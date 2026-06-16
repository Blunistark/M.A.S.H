from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, START, END
from src.band_config import HealthcareOrchestrationRoom, ReceptionNavigationRoom, BandSDK
from src.telemetry import Telemetry
from src.supabase_tools import fetch_doctors_from_supabase

class RegistrationState(TypedDict):
    event_name: str
    payload: Dict[str, Any]

class RegistrationAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("RegistrationAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        ReceptionNavigationRoom.join(self.agent)
        self.doctors: List[Dict[str, Any]] = [
            {"id": "doc-1", "name": "Dr. Smith", "specialty": "Cardiology", "availableSlots": ["09:00", "10:00", "14:00"]},
            {"id": "doc-2", "name": "Dr. Jones", "specialty": "Pediatrics", "availableSlots": ["11:00", "15:00"]},
            {"id": "doc-3", "name": "Dr. Davis", "specialty": "General Practice", "availableSlots": ["09:00", "13:00", "16:00"]}
        ]
        self.graph = self._build_graph()
        self.setup_listeners()

    def _build_graph(self):
        builder = StateGraph(RegistrationState)

        async def query_doctors_node(state: RegistrationState) -> RegistrationState:
            Telemetry.track_event(self.agent.name, "FETCHING_DOCTOR_LIST", {})
            db_docs = await fetch_doctors_from_supabase()
            docs = db_docs if db_docs else self.doctors
            HealthcareOrchestrationRoom.broadcast("DOCTORS_LIST_RESPONSE", {"doctors": docs})
            return state

        async def check_availability_node(state: RegistrationState) -> RegistrationState:
            payload = state["payload"]
            doctor_id = payload["doctorId"]
            slot = payload["slot"]

            db_docs = await fetch_doctors_from_supabase()
            docs = db_docs if db_docs else self.doctors
            doc = next((d for d in docs if d["id"] == doctor_id), None)
            is_available = slot in doc["availableSlots"] if doc else False

            Telemetry.track_event(self.agent.name, "CHECK_AVAILABILITY_RESULT", {
                "doctorId": doctor_id,
                "slot": slot,
                "isAvailable": is_available
            })
            HealthcareOrchestrationRoom.broadcast("DOCTOR_AVAILABILITY_STATUS", {
                "doctorId": doctor_id,
                "slot": slot,
                "isAvailable": is_available
            })
            return state

        async def request_doctor_match_node(state: RegistrationState) -> RegistrationState:
            payload = state["payload"]
            patient_id = payload["patientId"]
            symptoms = payload.get("symptoms", "").lower()
            requested_slot = payload.get("requestedSlot", "09:00")

            if "chest pain" in symptoms or "heart" in symptoms or "cardio" in symptoms:
                specialty = "Cardiology"
            elif "fever" in symptoms or "child" in symptoms or "pediatric" in symptoms:
                specialty = "Pediatrics"
            else:
                specialty = "General Practice"

            db_docs = await fetch_doctors_from_supabase()
            docs = db_docs if db_docs else self.doctors
            matched_doc = next((d for d in docs if d["specialty"] == specialty), None)
            if matched_doc:
                doctor_id = matched_doc["id"]
                doctor_name = matched_doc["name"]
            else:
                doctor_id = "unknown"
                doctor_name = "Unknown Doctor"

            Telemetry.track_event(self.agent.name, "DOCTOR_MATCH_REQUESTED", {
                "patientId": patient_id,
                "symptoms": symptoms,
                "matchedSpecialty": specialty,
                "assignedDoctor": doctor_name
            })

            ReceptionNavigationRoom.broadcast("DOCTOR_ASSIGNED", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "doctorName": doctor_name,
                "specialty": specialty,
                "slot": requested_slot
            })
            return state

        def route_event(state: RegistrationState) -> str:
            event_name = state.get("event_name")
            if event_name == "QUERY_DOCTORS":
                return "query_doctors"
            elif event_name == "CHECK_DOCTOR_AVAILABILITY":
                return "check_availability"
            elif event_name == "REQUEST_DOCTOR_MATCH":
                return "request_doctor_match"
            return END

        builder.add_node("query_doctors", query_doctors_node)
        builder.add_node("check_availability", check_availability_node)
        builder.add_node("request_doctor_match", request_doctor_match_node)

        builder.add_conditional_edges(
            START,
            route_event,
            {
                "query_doctors": "query_doctors",
                "check_availability": "check_availability",
                "request_doctor_match": "request_doctor_match",
                END: END
            }
        )
        builder.add_edge("query_doctors", END)
        builder.add_edge("check_availability", END)
        builder.add_edge("request_doctor_match", END)

        return builder.compile()

    def setup_listeners(self):
        async def on_query_doctors(payload: Dict[str, Any]):
            await self.graph.ainvoke({"event_name": "QUERY_DOCTORS", "payload": payload})

        async def on_check_doctor_availability(payload: Dict[str, Any]):
            await self.graph.ainvoke({"event_name": "CHECK_DOCTOR_AVAILABILITY", "payload": payload})

        async def on_request_doctor_match(payload: Dict[str, Any]):
            await self.graph.ainvoke({"event_name": "REQUEST_DOCTOR_MATCH", "payload": payload})

        self.agent.on_event("QUERY_DOCTORS", on_query_doctors)
        self.agent.on_event("CHECK_DOCTOR_AVAILABILITY", on_check_doctor_availability)
        self.agent.on_event("REQUEST_DOCTOR_MATCH", on_request_doctor_match)
