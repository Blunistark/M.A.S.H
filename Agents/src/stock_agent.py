from typing import Dict, Any
from src.band_config import HealthcareOrchestrationRoom, PharmacyInventoryRoom, BandSDK
from src.telemetry import Telemetry

class StockManagementAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("StockManagementAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        PharmacyInventoryRoom.join(self.agent)
        self.stock_usage: Dict[str, int] = {}
        self.REORDER_THRESHOLD = 2
        self.setup_listeners()

    def setup_listeners(self):
        async def on_route_to_pharma(payload: Dict[str, Any]):
            medicine = payload["prescription"]["medicine"]
            self.stock_usage[medicine] = self.stock_usage.get(medicine, 0) + 1

            Telemetry.track_event(self.agent.name, "STOCK_USAGE_INCREMENTED", {"medicine": medicine, "count": self.stock_usage[medicine]})

            if self.stock_usage[medicine] >= self.REORDER_THRESHOLD:
                Telemetry.track_event(self.agent.name, "SUGGEST_STOCK_REORDER", {"medicine": medicine, "count": self.stock_usage[medicine]})
                HealthcareOrchestrationRoom.broadcast("REORDER_SUGGESTION", {
                    "medicine": medicine,
                    "reason": f"Medicine '{medicine}' is repeatedly used ({self.stock_usage[medicine]} times). Suggest restocking.",
                    "currentUsage": self.stock_usage[medicine]
                })

        def on_get_stock_stats(payload: Dict[str, Any]):
            HealthcareOrchestrationRoom.broadcast("STOCK_STATS_RESPONSE", {"stats": self.stock_usage})

        async def on_route_to_pharmacy(payload: Dict[str, Any]):
            medicine = payload["prescription"]["medicine"]
            self.stock_usage[medicine] = self.stock_usage.get(medicine, 0) + 1

            Telemetry.track_event(self.agent.name, "PHARMACY_STOCK_USAGE_INCREMENTED", {
                "medicine": medicine,
                "count": self.stock_usage[medicine]
            })

            if self.stock_usage[medicine] >= self.REORDER_THRESHOLD:
                Telemetry.track_event(self.agent.name, "AUTOMATED_SUGGEST_STOCK_REORDER", {
                    "medicine": medicine,
                    "count": self.stock_usage[medicine]
                })

                PharmacyInventoryRoom.broadcast("TRIGGER_REORDER", {
                    "medicine": medicine,
                    "currentUsage": self.stock_usage[medicine],
                    "reason": f"Automated Alert: Medicine '{medicine}' usage is high ({self.stock_usage[medicine]} requests). Reorder suggested."
                })

        self.agent.on_event("ROUTE_TO_PHARMA", on_route_to_pharma)
        self.agent.on_event("GET_STOCK_STATS", on_get_stock_stats)
        self.agent.on_event("ROUTE_TO_PHARMACY", on_route_to_pharmacy)

