from typing import Dict, Any
from src.band_config import HealthcareOrchestrationRoom, ClinicalConsultRoom, PharmacyInventoryRoom, BandSDK
from src.telemetry import Telemetry

class MedicineManagementAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("MedicineManagementAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        ClinicalConsultRoom.join(self.agent)
        PharmacyInventoryRoom.join(self.agent)
        self.setup_listeners()

    def setup_listeners(self):
        async def on_process_prescription(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            prescription = payload["prescription"]
            
            Telemetry.track_event(self.agent.name, "EVALUATE_PRESCRIPTION", {"patientId": patient_id})

            is_stock_available = self.check_stock(prescription.get("medicine", ""))

            if is_stock_available:
                # Dual-branched handoff: Route directly to Pharma queue
                Telemetry.track_handoff(self.agent.name, "PharmaQueue", {"patientId": patient_id, "prescription": prescription})
                HealthcareOrchestrationRoom.broadcast("ROUTE_TO_PHARMA", {"patientId": patient_id, "prescription": prescription})
            else:
                # Dual-branched handoff: Raise Band event for Human-in-the-Loop
                human_response = await self.agent.request_human_intervention(
                    f"Medicine '{prescription.get('medicine')}' is out of stock. Require Doctor's alternate prescription.",
                    {"patientId": patient_id, "prescription": prescription}
                )

                Telemetry.track_event(self.agent.name, "HUMAN_INTERVENTION_RESOLVED", human_response)

                # Broadcast the resolution
                HealthcareOrchestrationRoom.broadcast("PRESCRIPTION_UPDATED", {"patientId": patient_id, "resolution": human_response})

        async def on_prescription_written(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            prescription = payload["prescription"]

            Telemetry.track_event(self.agent.name, "CLINICAL_PRESCRIPTION_WRITTEN", {"patientId": patient_id})

            is_stock_available = self.check_stock(prescription.get("medicine", ""))

            if is_stock_available:
                ClinicalConsultRoom.broadcast("PRESCRIPTION_SAFETY_PASSED", {
                    "patientId": patient_id,
                    "prescription": prescription,
                    "status": "approved"
                })
            else:
                human_response = await self.agent.request_human_intervention(
                    f"Conflict: Medicine '{prescription.get('medicine')}' is out of stock. Alternate prescription required.",
                    {"patientId": patient_id, "prescription": prescription}
                )

                Telemetry.track_event(self.agent.name, "CLINICAL_PRESCRIPTION_RESOLVED", human_response)

                ClinicalConsultRoom.broadcast("PRESCRIPTION_SAFETY_PASSED", {
                    "patientId": patient_id,
                    "prescription": prescription,
                    "status": "approved_via_intervention",
                    "resolution": human_response
                })

        def on_check_medicine_availability(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            medicine = payload.get("medicine", "")

            Telemetry.track_event(self.agent.name, "CHECK_MEDICINE_AVAILABILITY", {
                "patientId": patient_id,
                "medicine": medicine
            })

            is_available = self.check_stock(medicine)

            PharmacyInventoryRoom.broadcast("MEDICINE_AVAILABILITY_STATUS", {
                "patientId": patient_id,
                "medicine": medicine,
                "isAvailable": is_available
            })

        self.agent.on_event("PROCESS_PRESCRIPTION", on_process_prescription)
        self.agent.on_event("PRESCRIPTION_WRITTEN", on_prescription_written)
        self.agent.on_event("CHECK_MEDICINE_AVAILABILITY", on_check_medicine_availability)

    def check_stock(self, medicine: str) -> bool:
        # Mock logic: anything with "rare" in the name is out of stock
        return "rare" not in medicine.lower()


