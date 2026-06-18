from typing import Dict, Any
from src.band_config import PatientManagementRoom, ReceptionNavigationRoom, BandSDK
from src.telemetry import Telemetry

class PatientNavigationAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PatientNavigationAgent")
        PatientManagementRoom.join(self.agent)
        ReceptionNavigationRoom.join(self.agent)
        self.doctor_locations: Dict[str, Dict[str, str]] = {
            "doc-1": {"room": "Room 302", "floor": "3rd Floor"}, # Dr. Smith
            "doc-2": {"room": "Room 105", "floor": "1st Floor"}, # Dr. Jones
            "doc-3": {"room": "Room 204", "floor": "2nd Floor"}  # Dr. Davis
        }
        self.setup_listeners()

    def _get_directions(self, doctor_id: str, current_location: str) -> str:
        doc_clean = str(doctor_id).lower()
        if "a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd" in doc_clean or "smith" in doc_clean or "cardio" in doc_clean:
            return f"From {current_location}: Exit the reception/waiting area, walk straight into the corridor, and take the first right into Doctor Consultation Room 1 (Dr. Smith)."
        elif "f85362c8-5935-4b2e-bff1-e2779d9d78ae" in doc_clean or "kirran" in doc_clean or "general" in doc_clean:
            return f"From {current_location}: Exit the reception/waiting area, walk straight into the corridor, pass Doctor Consultation Room 1, and take the second right into Doctor Consultation Room 2 (Dr. Kirran Kumar)."
        elif "13a4db1b-c1dd-43b2-b1c1-71aa36b5574f" in doc_clean or "mithun" in doc_clean or "ent" in doc_clean:
            return f"From {current_location}: Exit the reception/waiting area, walk straight into the corridor, pass Doctor Consultation Room 1, and take the second right into Doctor Consultation Room 2 (Dr. Mithun Nair)."
        elif "pharmacy" in doc_clean:
            return f"From {current_location}: The Pharmacy is located immediately to your right as you enter the building."
        else:
            return f"From {current_location}: Exit the reception area and walk down the corridor to find your destination room."

    def setup_listeners(self):
        def on_request_navigation(payload: Dict[str, Any]):
            patient_id = payload.get("patientId")
            doctor_id = payload.get("doctorId")
            current_location = payload.get("currentLocation", "Reception Desk")
            req_id = payload.get("requestId")

            Telemetry.track_event(self.agent.name, "GENERATING_NAVIGATION", payload)

            directions = self._get_directions(doctor_id, current_location)

            PatientManagementRoom.broadcast("NAVIGATION_DIRECTIONS", {
                "requestId": req_id,
                "patientId": patient_id,
                "doctorId": doctor_id,
                "directions": directions
            })

        def on_navigate_to_room(payload: Dict[str, Any]):
            patient_id = payload.get("patientId")
            doctor_id = payload.get("doctorId")
            current_location = payload.get("currentLocation", "Reception Desk")
            req_id = payload.get("requestId")

            Telemetry.track_event(self.agent.name, "GENERATING_ROOM_NAVIGATION", payload)

            directions = self._get_directions(doctor_id, current_location)

            ReceptionNavigationRoom.broadcast("NAVIGATION_DIRECTIONS", {
                "requestId": req_id,
                "patientId": patient_id,
                "doctorId": doctor_id,
                "directions": directions
            })

        def on_doctor_room_change(payload: Dict[str, Any]):
            doctor_id = payload.get("doctorId")
            room = payload.get("room")
            floor = payload.get("floor")

            self.doctor_locations[doctor_id] = {"room": room, "floor": floor}

            Telemetry.track_event(self.agent.name, "DOCTOR_ROOM_UPDATED", {
                "doctorId": doctor_id,
                "room": room,
                "floor": floor
            })

        self.agent.on_event("REQUEST_NAVIGATION", on_request_navigation)
        self.agent.on_event("NAVIGATE_TO_ROOM", on_navigate_to_room)
        self.agent.on_event("DOCTOR_ROOM_CHANGE", on_doctor_room_change)

