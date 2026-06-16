from typing import Dict, Any
from src.band_config import PatientManagementRoom, ReceptionNavigationRoom, BandSDK
from src.telemetry import Telemetry

class PatientNavigationAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientNavigationAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        ReceptionNavigationRoom.join(self.agent)
        self.doctor_locations: Dict[str, Dict[str, str]] = {
            "doc-1": {"room": "Room 302", "floor": "3rd Floor"}, # Dr. Smith
            "doc-2": {"room": "Room 105", "floor": "1st Floor"}, # Dr. Jones
            "doc-3": {"room": "Room 204", "floor": "2nd Floor"}  # Dr. Davis
        }
        self.setup_listeners()

    def _get_directions(self, doctor_id: str, current_location: str) -> str:
        loc = self.doctor_locations.get(doctor_id)
        if loc:
            return f"From {current_location}: Go to the elevator, go to the {loc['floor']}, and find {loc['room']}."
        else:
            return f"From {current_location}: Please head to the main information desk on the ground floor."

    def setup_listeners(self):
        def on_request_navigation(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            doctor_id = payload["doctorId"]
            current_location = payload["currentLocation"]

            Telemetry.track_event(self.agent.name, "GENERATING_NAVIGATION", payload)

            directions = self._get_directions(doctor_id, current_location)

            PatientManagementRoom.broadcast("NAVIGATION_DIRECTIONS", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "directions": directions
            })

        def on_navigate_to_room(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            doctor_id = payload["doctorId"]
            current_location = payload["currentLocation"]

            Telemetry.track_event(self.agent.name, "GENERATING_ROOM_NAVIGATION", payload)

            directions = self._get_directions(doctor_id, current_location)

            ReceptionNavigationRoom.broadcast("NAVIGATION_DIRECTIONS", {
                "patientId": patient_id,
                "doctorId": doctor_id,
                "directions": directions
            })

        def on_doctor_room_change(payload: Dict[str, Any]):
            doctor_id = payload["doctorId"]
            room = payload["room"]
            floor = payload["floor"]

            self.doctor_locations[doctor_id] = {"room": room, "floor": floor}

            Telemetry.track_event(self.agent.name, "DOCTOR_ROOM_UPDATED", {
                "doctorId": doctor_id,
                "room": room,
                "floor": floor
            })

        self.agent.on_event("REQUEST_NAVIGATION", on_request_navigation)
        self.agent.on_event("NAVIGATE_TO_ROOM", on_navigate_to_room)
        self.agent.on_event("DOCTOR_ROOM_CHANGE", on_doctor_room_change)

