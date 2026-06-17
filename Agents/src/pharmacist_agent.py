from typing import Dict, Any
from src.band_config import PharmacistDashboardRoom, PharmacyInventoryRoom, BandSDK
from src.telemetry import Telemetry

class PharmacistAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("PharmacistAgent")
        PharmacistDashboardRoom.join(self.agent)
        PharmacyInventoryRoom.join(self.agent)
        self.setup_listeners()

    def setup_listeners(self):
        def on_prepare_medicine(payload: Dict[str, Any]):
            patient_id = payload.get("patientId")
            prescription = payload.get("prescription", {})
            medicine = prescription.get("medicine", "unknown medicine")

            Telemetry.track_event(self.agent.name, "INCOMING_ORDER_PREPARATION", payload)
            
            # Print status update to console simulating helping the pharmacist
            print(f"[Pharmacist Agent] Helping Pharmacist: New incoming order for patient '{patient_id}'.")
            print(f"                   -> Preparing medicine: '{medicine}'.")
            print(f"                   -> Order status set to readying.")

        def on_stock_demand_alert(payload: Dict[str, Any]):
            medicine = payload.get("medicine", "unknown medicine")
            count = payload.get("currentUsage", 0)

            Telemetry.track_event(self.agent.name, "STOCK_DEMAND_ALERT_RECEIVED", payload)
            
            print(f"[Pharmacist Agent] Helping Pharmacist: Rise in demand alert received!")
            print(f"                   -> Medicine: '{medicine}' has been prescribed {count} times.")
            print(f"                   -> Suggestion: Readying additional stock of '{medicine}' to meet high demand.")

        self.agent.on_event("PREPARE_MEDICINE", on_prepare_medicine)
        self.agent.on_event("ROUTE_TO_PHARMA", on_prepare_medicine)
        self.agent.on_event("STOCK_DEMAND_ALERT", on_stock_demand_alert)
