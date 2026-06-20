import asyncio
import uuid
from typing import Dict, Any, TypedDict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, START, END
from src.band_config import PatientManagementRoom, BandSDK
from src.telemetry import Telemetry

PENDING_REQUESTS: Dict[str, asyncio.Future] = {}

@tool
async def get_doctors(date: str = None) -> list:
    """Fetch the list of doctors and their availability for a specific date (YYYY-MM-DD format). Defaults to today if not provided."""
    from src.supabase_tools import fetch_doctors_from_supabase
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    req_id = str(uuid.uuid4())
    PENDING_REQUESTS[req_id] = future

    PatientManagementRoom.broadcast("QUERY_DOCTORS", {"requestId": req_id, "date": date})
    try:
        result = await asyncio.wait_for(asyncio.shield(future), timeout=5.0)
        docs = result.get("doctors", [])
        return docs
    except asyncio.TimeoutError:
        print("[get_doctors] Registration agent timed out — querying Supabase directly")
        docs = await fetch_doctors_from_supabase(date)
        return docs
    finally:
        PENDING_REQUESTS.pop(req_id, None)

@tool
async def book_appointment(patient_name: str, doctor_id: str, slot_time: str, date: str = None, reason: str = "") -> str:
    """Book an appointment for a patient with a specific doctor at a given slot_time on a specific date (YYYY-MM-DD or relative like 'tomorrow')."""
    from src.supabase_tools import book_appointment_in_supabase, PatientNotFoundError
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    req_id = str(uuid.uuid4())
    PENDING_REQUESTS[req_id] = future
    
    PatientManagementRoom.broadcast("BOOKING_REQUESTED", {
        "requestId": req_id,
        "patientName": patient_name,
        "doctorId": doctor_id,
        "slotTime": slot_time,
        "date": date,
        "reason": reason
    })
    try:
        result = await asyncio.wait_for(future, timeout=10.0)
        return result.get("message", "Booking processed.")
    except asyncio.TimeoutError:
        print("[book_appointment] Registration agent timed out — booking in Supabase directly")
        try:
            success = await book_appointment_in_supabase(patient_name, doctor_id, slot_time, date, reason)
            if success:
                return f"Successfully booked appointment for {patient_name} at {slot_time}."
            return "Failed to book appointment. Please try again."
        except PatientNotFoundError as e:
            return str(e)
    finally:
        PENDING_REQUESTS.pop(req_id, None)

@tool
async def reschedule_appointment(patient_name: str, new_slot_time: str, date: str = None) -> str:
    """Reschedule an existing appointment to a new slot_time on a specific date (YYYY-MM-DD or relative like 'tomorrow')."""
    from src.supabase_tools import reschedule_appointment_in_supabase, PatientNotFoundError
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    req_id = str(uuid.uuid4())
    PENDING_REQUESTS[req_id] = future
    
    PatientManagementRoom.broadcast("RESCHEDULE_REQUESTED", {
        "requestId": req_id,
        "patientName": patient_name,
        "newSlotTime": new_slot_time,
        "date": date
    })
    try:
        result = await asyncio.wait_for(future, timeout=10.0)
        return result.get("message", "Reschedule processed.")
    except asyncio.TimeoutError:
        print("[reschedule_appointment] Registration agent timed out — rescheduling in Supabase directly")
        try:
            success = await reschedule_appointment_in_supabase(patient_name, new_slot_time, date)
            if success:
                return f"Successfully rescheduled the appointment for {patient_name} to {new_slot_time}."
            return f"Failed to reschedule the appointment for {patient_name}. Could not find an existing appointment."
        except PatientNotFoundError as e:
            return str(e)
    finally:
        PENDING_REQUESTS.pop(req_id, None)

PENDING_ACTIONS = []

@tool
async def get_navigation_directions(destination: str) -> str:
    """Fetch step-by-step navigation directions to a doctor, specialty, or department.
    Use this when the patient asks 'where is Dr. X?', 'how do I get to X?', or requests directions.
    destination must be one of: 'Dr. Smith', 'Dr. Kirran Kumar', 'Dr. Mithun Nair', 'Cardiology', 'General Medicine', 'ENT', 'Pharmacy', 'Reception'.
    """
    dest = destination.lower()
    doctor_id = None
    target_name = destination
    if "smith" in dest or "cardio" in dest:
        doctor_id = "a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd"
        target_name = "Dr. Smith (Cardiology)"
    elif "kirran" in dest or "kumar" in dest or "general" in dest:
        doctor_id = "f85362c8-5935-4b2e-bff1-e2779d9d78ae"
        target_name = "Dr. Kirran Kumar (General Medicine)"
    elif "mithun" in dest or "nair" in dest or "ent" in dest:
        doctor_id = "13a4db1b-c1dd-43b2-b1c1-71aa36b5574f"
        target_name = "Dr. Mithun Nair (ENT)"
    elif "quorum" in dest or "dental" in dest or "dentist" in dest:
        doctor_id = "edb25638-f9b3-40c9-98dd-1799b17a3561"
        target_name = "Dr. Quorum (Dentist)"
    elif "pharmacy" in dest or "pharmacist" in dest or "med" in dest:
        doctor_id = "pharmacy"
        target_name = "Pharmacy"
    elif "reception" in dest or "waiting" in dest:
        doctor_id = "reception"
        target_name = "Reception"
        
    if not doctor_id:
        return f"I could not locate '{destination}' in our hospital directory. Please specify a doctor name (like Dr. Smith or Dr. Kirran) or department (like Pharmacy)."
        
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    req_id = str(uuid.uuid4())
    PENDING_REQUESTS[req_id] = future
    
    # Broadcast request to PatientManagementRoom where PatientNavigationAgent listens
    PatientManagementRoom.broadcast("REQUEST_NAVIGATION", {
        "requestId": req_id,
        "patientId": "current-patient",
        "doctorId": doctor_id,
        "currentLocation": "Reception Desk"
    })
    
    try:
        # Wait up to 5 seconds for navigation agent to reply
        result = await asyncio.wait_for(future, timeout=5.0)
        directions = result.get("directions", "")
    except asyncio.TimeoutError:
        # Offline fallback if navigation agent is not responsive
        if doctor_id in ("a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd", "edb25638-f9b3-40c9-98dd-1799b17a3561"):
            directions = "From Reception Desk: Exit the waiting area, enter the corridor, and take the first right into Doctor Consultation Room 1."
        elif doctor_id in ("f85362c8-5935-4b2e-bff1-e2779d9d78ae", "13a4db1b-c1dd-43b2-b1c1-71aa36b5574f"):
            directions = "From Reception Desk: Exit the waiting area, enter the corridor, pass Doctor Consultation Room 1, and take the second right into Doctor Consultation Room 2."
        elif doctor_id == "pharmacy":
            directions = "From Reception Desk: The Pharmacy is located immediately to your right as you enter the building."
        else:
            directions = "From Reception Desk: Exit the waiting area and walk straight down the corridor."
            
    # Register pending action for the frontend
    PENDING_ACTIONS.append({
        "type": "navigate",
        "route": "navigation",
        "target": doctor_id,
        "directions": directions
    })
    
    return f"Here are the directions to {target_name}: {directions}"

class PatientManagementState(TypedDict):
    event_name: str
    payload: Dict[str, Any]
    bookings: Dict[str, Dict[str, Any]]

class PatientManagementAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientManagementAgent")
        PatientManagementRoom.join(self.agent)
        self.bookings: Dict[str, Dict[str, Any]] = {}
        self.graph = self._build_graph()
        self.setup_listeners()
        
        # LLM integration for interactive booking
        self.llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", temperature=0)
        self.react_agent = create_react_agent(self.llm, tools=[get_doctors, book_appointment, reschedule_appointment, get_navigation_directions])

    async def process_patient_query(self, messages: list, patient_id: str = None, patient_name: str = None) -> list:
        """Process an interactive conversation to book an appointment or get directions.
        Pass in the full message history. Returns the updated message history."""
        global PENDING_ACTIONS
        PENDING_ACTIONS.clear()
        
        from datetime import datetime, timedelta
        # Local system timezone offset relative to user's local date
        now_local = datetime.utcnow() + timedelta(hours=5, minutes=30)
        local_date_str = now_local.strftime("%Y-%m-%d")
        local_day_of_week = now_local.strftime("%A")
        
        patient_info = f"The logged-in patient is {patient_name} (ID: {patient_id})." if patient_name and patient_id else ""
        
        is_after_6pm = now_local.hour >= 18
        date_options = "Tomorrow, Day After Tomorrow" if is_after_6pm else "Today, Tomorrow, Day After Tomorrow"
        
        system_msg = {
            "role": "system",
            "content": (
                "You are the MASH Patient Management Assistant. "
                f"{patient_info} "
                "Your job is to assist patients. You can book/reschedule appointments or provide hospital directions. "
                "If the patient wants directions, or asks where a doctor, specialty room, or department (like Pharmacy) is located, "
                "YOU MUST call the get_navigation_directions tool to retrieve and present the directions. "
                f"Today's Date: {local_date_str} ({local_day_of_week}). "
                "\n\nFor booking appointments, follow these steps in order:\n"
                "STEP 1 — Ask reason: If the patient has not mentioned their symptoms or reason for the visit, ask briefly (e.g. 'What brings you in today?'). "
                "If they have already mentioned a reason, skip to STEP 2.\n"
                f"STEP 2 — Ask date: Ask which date they prefer. YOU MUST append date options in the format [DATES: {date_options}].\n"
                "STEP 3 — Select best doctor: Once you have BOTH the reason AND the date, call get_doctors with the date. "
                "Then automatically pick the single most suitable doctor based on the patient's symptoms using this specialty guide:\n"
                "  • Chest pain / heart / palpitations / cardiology → Dr. Smith (Cardiologist)\n"
                "  • Ear / nose / throat / hearing / sinus / ENT → Dr. Mithun Nair (ENT)\n"
                "  • Teeth / dental / gum / mouth / jaw → Dr. Quorum (Dentist)\n"
                "  • Everything else (fever, cold, general, unknown) → Dr. Kirran Kumar (General Medicine)\n"
                "CRITICAL: Do NOT list all doctors. Pick ONE best match and present only that doctor's available slots.\n"
                "STEP 4 — Offer slots: Present only the chosen doctor's availableSlots as chips. "
                "YOU MUST append them at the end of your message in the format [SLOTS: time1, time2, ...]. "
                "ONLY use slots from the 'availableSlots' field returned by get_doctors. Never invent slots.\n"
                "STEP 5 — Confirm and book: Once the patient picks a slot, confirm once ('Booking Dr. X at HH:MM on DATE for you — confirm?') "
                "then call book_appointment with patient_name, doctor_id, slot_time, and date.\n"
                "If the patient wants to reschedule an existing appointment, use reschedule_appointment instead.\n"
                "If get_doctors returns no available slots for the chosen doctor, suggest the next best doctor."
            )
        }
        
        has_system = False
        if messages:
            first_msg = messages[0]
            if isinstance(first_msg, dict) and first_msg.get("role") == "system":
                has_system = True
            elif getattr(first_msg, "type", None) == "system" or getattr(first_msg, "type", None) == "SystemMessage":
                has_system = True
                
        if not has_system:
            inputs = {"messages": [system_msg] + messages}
        else:
            inputs = {"messages": messages}
            
        result = await self.react_agent.ainvoke(inputs)
        return result["messages"]

    def _build_graph(self):
        builder = StateGraph(PatientManagementState)

        def doctor_assigned_node(state: PatientManagementState) -> Dict[str, Any]:
            payload = state["payload"]
            bookings = dict(state["bookings"])
            patient_id = payload.get("patientId", "unknown")
            bookings[patient_id] = {
                "doctorId": payload.get("doctorId"),
                "doctorName": payload.get("doctorName"),
                "specialty": payload.get("specialty"),
                "slot": payload.get("slot")
            }
            return {"bookings": bookings}

        def patient_check_in_node(state: PatientManagementState) -> PatientManagementState:
            payload = state["payload"]
            patient_id = payload.get("patientId", "unknown")
            Telemetry.track_event(self.agent.name, "PATIENT_CHECKED_IN", {"patientId": patient_id})

            booking = state["bookings"].get(patient_id)
            doctor_id = booking["doctorId"] if booking else "unknown"

            PatientManagementRoom.broadcast("NAVIGATE_TO_ROOM", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "currentLocation": "Reception Desk"
            })
            return state

        async def reschedule_appointment_node(state: PatientManagementState) -> PatientManagementState:
            payload = state["payload"]
            patient_id = payload.get("patientId")
            doctor_id = payload.get("doctorId")
            requested_slot = payload.get("requestedSlot")
            doctor_name = payload.get("doctorName")

            Telemetry.track_event(self.agent.name, "START_RESCHEDULING", payload)
            is_available = requested_slot != "11:00"

            if is_available:
                Telemetry.track_handoff(self.agent.name, "ALL", {"action": "RESCHEDULE_SUCCESS", "patientId": patient_id})
                PatientManagementRoom.broadcast("APPOINTMENT_CONFIRMED", {
                    "patientId": patient_id,
                    "doctorId": doctor_id,
                    "slot": requested_slot,
                    "status": "confirmed"
                })
            else:
                human_response = await self.agent.request_human_intervention(
                    f"Conflict: {doctor_name} is unavailable at {requested_slot}. Rescheduling required.",
                    payload
                )

                Telemetry.track_event(self.agent.name, "RESCHEDULE_CONFLICT_RESOLVED", human_response)
                PatientManagementRoom.broadcast("APPOINTMENT_CONFIRMED", {
                    "patientId": patient_id,
                    "doctorId": doctor_id,
                    "slot": "14:00",
                    "status": "confirmed_via_intervention",
                    "comments": human_response.get("comments")
                })
            return state

        def route_event(state: PatientManagementState) -> str:
            event_name = state.get("event_name")
            if event_name == "DOCTOR_ASSIGNED":
                return "doctor_assigned"
            elif event_name == "PATIENT_CHECK_IN":
                return "patient_check_in"
            elif event_name == "RESCHEDULE_APPOINTMENT":
                return "reschedule_appointment"
            return END

        builder.add_node("doctor_assigned", doctor_assigned_node)
        builder.add_node("patient_check_in", patient_check_in_node)
        builder.add_node("reschedule_appointment", reschedule_appointment_node)

        builder.add_conditional_edges(
            START,
            route_event,
            {
                "doctor_assigned": "doctor_assigned",
                "patient_check_in": "patient_check_in",
                "reschedule_appointment": "reschedule_appointment",
                END: END
            }
        )
        builder.add_edge("doctor_assigned", END)
        builder.add_edge("patient_check_in", END)
        builder.add_edge("reschedule_appointment", END)

        return builder.compile()

    def setup_listeners(self):
        async def on_reschedule_appointment(payload: Dict[str, Any]):
            res = await self.graph.ainvoke({
                "event_name": "RESCHEDULE_APPOINTMENT",
                "payload": payload,
                "bookings": self.bookings
            })
            self.bookings = res.get("bookings", self.bookings)

        def on_doctor_assigned(payload: Dict[str, Any]):
            res = self.graph.invoke({
                "event_name": "DOCTOR_ASSIGNED",
                "payload": payload,
                "bookings": self.bookings
            })
            self.bookings = res.get("bookings", self.bookings)

        def on_patient_check_in(payload: Dict[str, Any]):
            res = self.graph.invoke({
                "event_name": "PATIENT_CHECK_IN",
                "payload": payload,
                "bookings": self.bookings
            })
            self.bookings = res.get("bookings", self.bookings)

        async def on_proxy_response(payload: Dict[str, Any]):
            req_id = payload.get("requestId")
            if req_id in PENDING_REQUESTS and not PENDING_REQUESTS[req_id].done():
                PENDING_REQUESTS[req_id].set_result(payload)

        self.agent.on_event("RESCHEDULE_APPOINTMENT", on_reschedule_appointment)
        self.agent.on_event("DOCTOR_ASSIGNED", on_doctor_assigned)
        self.agent.on_event("PATIENT_CHECK_IN", on_patient_check_in)
        
        self.agent.on_event("DOCTORS_LIST_RESPONSE", on_proxy_response)
        self.agent.on_event("BOOKING_CONFIRMED", on_proxy_response)
        self.agent.on_event("BOOKING_FAILED", on_proxy_response)
        self.agent.on_event("RESCHEDULE_CONFIRMED", on_proxy_response)
        self.agent.on_event("RESCHEDULE_FAILED", on_proxy_response)
        self.agent.on_event("NAVIGATION_DIRECTIONS", on_proxy_response)
