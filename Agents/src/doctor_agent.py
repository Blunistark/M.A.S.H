import asyncio
import uuid as uuid_lib
import json
from typing import Dict, Any, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from src.band_config import DoctorDashboardRoom, BandSDK
from src.supabase_tools import get_doctor_schedule, fetch_doctor_schedule_from_supabase, create_prescription, book_appointment, get_doctors, fetch_medical_records_from_supabase

# Shared state for pending futures keyed by requestId
PENDING_REQUESTS: Dict[str, asyncio.Future] = {}

class DoctorAssistantAgent:
    def __init__(self, doctor_id: str, doctor_name: str):
        self.doctor_id = doctor_id
        self.doctor_name = doctor_name
        self.agent = BandSDK.create_agent(f"DoctorAgent_{doctor_name.replace(' ', '')}")
        DoctorDashboardRoom.join(self.agent)
        
        self.llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", temperature=0)
        
        # patient name (lowercase) → patient_id UUID
        # Populated when the schedule is fetched on boot
        self.patient_map: Dict[str, str] = {}
        
        self.pending_notifications: List[str] = []
        self.setup_listeners()
        
        self.pending_actions: List[Dict[str, Any]] = []
        
        # Build proxy tools bound to this instance
        agent_self = self

        @tool
        async def get_patient_summary(patient_name: str) -> str:
            """Fetch the complete medical history and health summary for a patient by their name.
            Returns a rich markdown table with conditions, allergies, tests, and surgical history.
            Use this when the doctor asks about a patient's background, history, or health records."""
            # Resolve name to UUID using the schedule map
            name_key = patient_name.strip().lower()
            patient_id = agent_self.patient_map.get(name_key)

            if not patient_id:
                # Try partial match
                for stored_name, pid in agent_self.patient_map.items():
                    if name_key in stored_name or stored_name in name_key:
                        patient_id = pid
                        break

            if not patient_id:
                return f"Could not find a patient named '{patient_name}' in today's schedule. Please check the name and try again."

            req_id = str(uuid_lib.uuid4())
            loop = asyncio.get_event_loop()
            future: asyncio.Future = loop.create_future()
            PENDING_REQUESTS[req_id] = future

            DoctorDashboardRoom.broadcast("PATIENT_SUMMARY_REQUESTED", {
                "requestId": req_id,
                "patientId": patient_id,
                "patientName": patient_name,
            })

            try:
                result = await asyncio.wait_for(asyncio.shield(future), timeout=15.0)
                return result.get("summary", "No summary available.")
            except asyncio.TimeoutError:
                return f"Timed out waiting for the patient summary for {patient_name}. The Summary Agent may be unavailable."
            finally:
                PENDING_REQUESTS.pop(req_id, None)

        @tool
        async def navigate_to_view(view_name: str, patient_name: Optional[str] = None) -> str:
            """Navigate the doctor's dashboard to a specific view or page.
            Supported view_names:
            - 'dashboard': Go to the main dashboard.
            - 'prescriptions': Go to the prescription writer.
            - 'schedule': Go to the appointment schedule calendar.
            - 'patients': Go to the patients list.
            - 'pharmacy': Go to the pharmacy portal.
            - 'patient-profile': Open a patient's medical profile (patient_name must be provided).
            - 'new-appointment': Open the new appointment booking scheduler.
            
            Use this whenever the doctor asks to 'go to', 'open', 'show', or 'navigate' to a page, view, or specific patient profile.
            """
            view_name = view_name.strip().lower()
            patient_id = None
            resolved_name = patient_name
            
            if view_name == 'patient-profile' or patient_name:
                if not patient_name:
                    return "Error: Patient name must be provided to open a patient profile."
                
                name_key = patient_name.strip().lower()
                patient_id = agent_self.patient_map.get(name_key)
                
                if not patient_id:
                    # Try partial match in today's schedule map
                    for stored_name, pid in agent_self.patient_map.items():
                        if name_key in stored_name or stored_name in name_key:
                            patient_id = pid
                            resolved_name = stored_name
                            break
                            
                if not patient_id:
                    # Query Supabase to find the patient
                    try:
                        import httpx
                        from src.supabase_tools import SUPABASE_URL, get_headers
                        search_name = patient_name.split()[0] if patient_name else ""
                        if search_name:
                            url = f"{SUPABASE_URL}/rest/v1/profiles?full_name=ilike.*{search_name}*&role=eq.patient"
                            async with httpx.AsyncClient() as client:
                                res = await client.get(url, headers=get_headers())
                                if res.status_code == 200 and res.json():
                                    first_match = res.json()[0]
                                    patient_id = first_match["id"]
                                    resolved_name = first_match.get("full_name", patient_name)
                                    # Cache it
                                    agent_self.patient_map[resolved_name.strip().lower()] = patient_id
                    except Exception as e:
                        print(f"Error querying Supabase in navigate_to_view: {e}")
                
                if not patient_id:
                    return f"Could not find a patient named '{patient_name}' in the database."
                
                # Make sure the view name is set to patient-profile if a patient was resolved
                view_name = 'patient-profile'

            action = {
                "type": "navigate",
                "route": view_name
            }
            if patient_id:
                action["patientId"] = patient_id

            agent_self.pending_actions.append(action)
            
            if view_name == 'patient-profile':
                return f"Navigating to the profile page of {resolved_name}."
            elif view_name == 'new-appointment':
                return "Opening the appointment booking dialog."
            else:
                return f"Navigating to the {view_name} page."

        @tool
        async def resolve_shortage_alert(patient_name: str) -> str:
            """Resolve a medicine shortage alert for a specific patient.
            Use this when the doctor asks to provide alternative medicine, resolve a shortage, or find alternative for a patient."""
            patient_id = None
            name_key = patient_name.strip().lower()
            patient_id = agent_self.patient_map.get(name_key)
            if not patient_id:
                for stored_name, pid in agent_self.patient_map.items():
                    if name_key in stored_name or stored_name in name_key:
                        patient_id = pid
                        break
            if not patient_id:
                try:
                    import httpx
                    from src.supabase_tools import SUPABASE_URL, get_headers
                    search_name = patient_name.split()[0] if patient_name else ""
                    if search_name:
                        url = f"{SUPABASE_URL}/rest/v1/profiles?full_name=ilike.*{search_name}*&role=eq.patient"
                        async with httpx.AsyncClient() as client:
                            res = await client.get(url, headers=get_headers())
                            if res.status_code == 200 and res.json():
                                first_match = res.json()[0]
                                patient_id = first_match["id"]
                                agent_self.patient_map[first_match.get("full_name", patient_name).strip().lower()] = patient_id
                except Exception as e:
                    print(f"Error querying Supabase in resolve_shortage_alert: {e}")
            
            action = {
                "type": "resolve_shortage",
                "patientId": patient_id
            }
            agent_self.pending_actions.append(action)
            return f"Initiating alternative medicine resolution alert for patient {patient_name}."

        self.react_agent = create_react_agent(
            self.llm,
            tools=[
                get_doctor_schedule,
                get_patient_summary,
                create_prescription,
                navigate_to_view,
                resolve_shortage_alert,
                book_appointment,
                get_doctors
            ]
        )

    def setup_listeners(self):
        from src.supabase_tools import resolve_doctor_id
        
        def on_booking_confirmed(payload: Dict[str, Any]):
            doc_id = resolve_doctor_id(payload.get("doctorId"))
            if doc_id == self.doctor_id:
                patient_name = payload.get("patientName", "A patient")
                slot_time = payload.get("slotTime", "unknown time")
                msg = f"New appointment booked: {patient_name} at {slot_time}."
                self.pending_notifications.append(msg)

        def on_patient_summary_response(payload: Dict[str, Any]):
            req_id = payload.get("requestId")
            if req_id and req_id in PENDING_REQUESTS:
                future = PENDING_REQUESTS[req_id]
                if not future.done():
                    future.set_result(payload)

        def on_alt_medicine_requested(payload: Dict[str, Any]):
            doc_id = resolve_doctor_id(payload.get("doctorId")) if payload.get("doctorId") else None
            if not doc_id or doc_id == self.doctor_id:
                patient_name = payload.get("patientName") or f"Patient ID {payload.get('patientId', 'Unknown')}"
                medicine = payload.get("medicine", "requested medicine")
                msg = f"Prescription alert: '{medicine}' for {patient_name} is out of stock. Please suggest an alternative medicine or comments."
                self.pending_notifications.append(msg)

        self.agent.on_event("BOOKING_CONFIRMED", on_booking_confirmed)
        self.agent.on_event("PATIENT_SUMMARY_RESPONSE", on_patient_summary_response)
        self.agent.on_event("ALTERNATIVE_MEDICINE_REQUESTED", on_alt_medicine_requested)

    async def load_schedule_to_patient_map(self):
        """Fetch today's schedule and store patient name→UUID for quick lookup during conversation."""
        from datetime import datetime
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        schedule = await fetch_doctor_schedule_from_supabase(self.doctor_id, today_str)
        self.patient_map.clear()
        for item in schedule:
            name = item.get("patientName", "")
            pid = item.get("patientId")
            if name and pid:
                self.patient_map[name.strip().lower()] = pid
        return schedule

    async def process_doctor_query(self, messages: list) -> list:
        """Process an interactive conversation with the doctor."""
        self.pending_actions = []
        try:
            await self.load_schedule_to_patient_map()
        except Exception as e:
            print(f"Error loading schedule in process_doctor_query: {e}")
            
        patient_map_hint = ""
        if self.patient_map:
            names = ", ".join(n.title() for n in self.patient_map.keys())
            patient_map_hint = (
                f" Today's patients in your schedule are: {names}. "
                "If the doctor asks about any of them, use get_patient_summary with their exact name."
            )

        from datetime import datetime
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        system_content = (
            f"You are the personal assistant for {self.doctor_name}. "
            f"Your doctor_id is '{self.doctor_id}'. "
            f"Today's date is {today_str}. "
            "You speak like a friendly, knowledgeable colleague — not a report generator. "
            "When the doctor asks to navigate, go to, show, or open a page or patient profile, use the navigate_to_view tool. "
            "When the doctor asks to resolve a shortage or find an alternative medicine, use the resolve_shortage_alert tool. "
            "When the doctor asks to book or schedule an appointment, use the book_appointment tool with your doctor_id. "
            "If they ask to book an appointment but no time is specified, ask them what time they would like to book it for. "
            "When the doctor asks about their schedule, use the get_doctor_schedule tool and summarize it conversationally. "
            "When the doctor asks about a patient's history, use the get_patient_summary tool to fetch the data. "
            "After fetching the patient summary, DO NOT paste the table. Instead, highlight the KEY points conversationally — "
            "e.g. 'Alice has mild asthma and is allergic to Sulfa Drugs. Her last spirometry came back normal.' "
            "Then mention the table is available for them to review on screen. "
            "Always be warm, brief, and human. No bullet point overload, no markdown dumps."
            + patient_map_hint
        )
        
        # Inject pending notifications if any exist
        if self.pending_notifications:
            notifications_str = " ".join(self.pending_notifications)
            system_content += f"\n\n[SYSTEM NOTIFICATION TO YOU]: {notifications_str}"
            self.pending_notifications.clear()

        system_msg = {"role": "system", "content": system_content}
        
        has_system = any(
            (isinstance(m, dict) and m.get("role") == "system") or
            getattr(m, "type", None) == "system"
            for m in messages[:1]
        )
            
        inputs = {"messages": messages if has_system else [system_msg] + messages}
        result = await self.react_agent.ainvoke(inputs)
        return result["messages"]
