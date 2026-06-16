from typing import Dict, Any, TypedDict
from langgraph.graph import StateGraph, START, END
from src.band_config import HealthcareOrchestrationRoom, ReceptionNavigationRoom, BandSDK
from src.telemetry import Telemetry
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from src.supabase_tools import fetch_doctors_from_supabase, book_appointment_in_supabase

@tool
async def get_doctors() -> list:
    """Fetch the list of doctors and their availability."""
    return await fetch_doctors_from_supabase()

@tool
async def book_appointment(patient_name: str, doctor_id: str, slot_time: str, reason: str = "") -> str:
    """Book an appointment for a patient with a specific doctor at a given slot_time."""
    success = await book_appointment_in_supabase(patient_name, doctor_id, slot_time, reason)
    if success:
        return f"Successfully booked appointment for {patient_name} at {slot_time}."
    return "Failed to book appointment. Please try again."


class PatientManagementState(TypedDict):
    event_name: str
    payload: Dict[str, Any]
    bookings: Dict[str, Dict[str, Any]]

class PatientManagementAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientManagementAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        ReceptionNavigationRoom.join(self.agent)
        self.bookings: Dict[str, Dict[str, Any]] = {}
        self.graph = self._build_graph()
        self.setup_listeners()
        
        # LLM integration for interactive booking
        self.llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0)
        self.react_agent = create_react_agent(self.llm, tools=[get_doctors, book_appointment])

    async def process_patient_query(self, messages: list) -> list:
        """Process an interactive conversation to book an appointment.
        Pass in the full message history. Returns the updated message history."""
        system_msg = {
            "role": "system",
            "content": (
                "You are the MASH Patient Management Assistant. "
                "Your job is to understand patient symptoms, suggest an appropriate doctor by using the get_doctors tool, "
                "and then book an appointment using the book_appointment tool. "
                "Always confirm the doctor and time slot with the patient before booking."
            )
        }
        
        # Check if first message is a system message
        has_system = False
        if messages:
            first_msg = messages[0]
            if isinstance(first_msg, dict) and first_msg.get("role") == "system":
                has_system = True
            elif getattr(first_msg, "type", None) == "system" or getattr(first_msg, "type", None) == "SystemMessage":
                has_system = True
                
        # Prepend system message if not present
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
            patient_id = payload["patientId"]
            bookings[patient_id] = {
                "doctorId": payload["doctorId"],
                "doctorName": payload["doctorName"],
                "specialty": payload["specialty"],
                "slot": payload["slot"]
            }
            return {"bookings": bookings}

        def patient_check_in_node(state: PatientManagementState) -> PatientManagementState:
            payload = state["payload"]
            patient_id = payload["patientId"]
            Telemetry.track_event(self.agent.name, "PATIENT_CHECKED_IN", {"patientId": patient_id})

            booking = state["bookings"].get(patient_id)
            doctor_id = booking["doctorId"] if booking else "unknown"

            ReceptionNavigationRoom.broadcast("NAVIGATE_TO_ROOM", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "currentLocation": "Reception Desk"
            })
            return state

        async def reschedule_appointment_node(state: PatientManagementState) -> PatientManagementState:
            payload = state["payload"]
            patient_id = payload["patientId"]
            doctor_id = payload["doctorId"]
            requested_slot = payload["requestedSlot"]
            doctor_name = payload["doctorName"]

            Telemetry.track_event(self.agent.name, "START_RESCHEDULING", payload)

            is_available = requested_slot != "11:00"

            if is_available:
                Telemetry.track_handoff(self.agent.name, "ALL", {"action": "RESCHEDULE_SUCCESS", "patientId": patient_id})
                HealthcareOrchestrationRoom.broadcast("APPOINTMENT_CONFIRMED", {
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
                HealthcareOrchestrationRoom.broadcast("APPOINTMENT_CONFIRMED", {
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

        self.agent.on_event("RESCHEDULE_APPOINTMENT", on_reschedule_appointment)
        self.agent.on_event("DOCTOR_ASSIGNED", on_doctor_assigned)
        self.agent.on_event("PATIENT_CHECK_IN", on_patient_check_in)
