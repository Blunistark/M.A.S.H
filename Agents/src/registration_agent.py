from typing import Dict, Any, List
from src.band_config import HealthcareOrchestrationRoom, BandSDK
from src.telemetry import Telemetry

class RegistrationAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("RegistrationAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        self.doctors: List[Dict[str, Any]] = [
            {"id": "doc-1", "name": "Dr. Smith", "specialty": "Cardiology", "availableSlots": ["09:00", "10:00", "14:00"]},
            {"id": "doc-2", "name": "Dr. Jones", "specialty": "Pediatrics", "availableSlots": ["11:00", "15:00"]},
            {"id": "doc-3", "name": "Dr. Davis", "specialty": "General Practice", "availableSlots": ["09:00", "13:00", "16:00"]}
        ]
        self.setup_listeners()

    def setup_listeners(self):
        def on_query_doctors(payload: Dict[str, Any]):
            Telemetry.track_event(self.agent.name, "FETCHING_DOCTOR_LIST", {})
            HealthcareOrchestrationRoom.broadcast("DOCTORS_LIST_RESPONSE", {"doctors": self.doctors})

        def on_check_doctor_availability(payload: Dict[str, Any]):
            doctor_id = payload["doctorId"]
            slot = payload["slot"]

            doc = next((d for d in self.doctors if d["id"] == doctor_id), None)
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

        self.agent.on_event("QUERY_DOCTORS", on_query_doctors)
        self.agent.on_event("CHECK_DOCTOR_AVAILABILITY", on_check_doctor_availability)
