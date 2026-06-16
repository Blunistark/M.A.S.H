from typing import Dict, Any
from src.band_config import HealthcareOrchestrationRoom, BandSDK
from src.telemetry import Telemetry

class PatientNavigationAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientNavigationAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        self.doctor_locations: Dict[str, Dict[str, str]] = {
            "doc-1": {"room": "Room 302", "floor": "3rd Floor"}, # Dr. Smith
            "doc-2": {"room": "Room 105", "floor": "1st Floor"}, # Dr. Jones
            "doc-3": {"room": "Room 204", "floor": "2nd Floor"}  # Dr. Davis
        }
        self.setup_listeners()

    def setup_listeners(self):
        def on_request_navigation(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            doctor_id = payload["doctorId"]
            current_location = payload["currentLocation"]

            Telemetry.track_event(self.agent.name, "GENERATING_NAVIGATION", payload)

            loc = self.doctor_locations.get(doctor_id)
            if loc:
                directions = f"From {current_location}: Go to the elevator, go to the {loc['floor']}, and find {loc['room']}."
            else:
                directions = f"From {current_location}: Please head to the main information desk on the ground floor."

            HealthcareOrchestrationRoom.broadcast("NAVIGATION_DIRECTIONS", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "directions": directions
            })

        self.agent.on_event("REQUEST_NAVIGATION", on_request_navigation)
