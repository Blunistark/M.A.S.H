from typing import Dict, Any
from src.band_config import HealthcareOrchestrationRoom, BandSDK
from src.telemetry import Telemetry

class PatientManagementAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientManagementAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        self.setup_listeners()

    def setup_listeners(self):
        async def on_reschedule_appointment(payload: Dict[str, Any]):
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

        self.agent.on_event("RESCHEDULE_APPOINTMENT", on_reschedule_appointment)
