import asyncio
import time
from typing import Callable, Any, Dict, List
from src.telemetry import Telemetry

class BandAgent:
    def __init__(self, name: str):
        self.id = f"agent-{name}-{int(time.time() * 1000)}"
        self.name = name
        self.room = None
        self.handlers: Dict[str, List[Callable[[Any], Any]]] = {}

    def on_event(self, event: str, handler: Callable[[Any], Any]):
        if event not in self.handlers:
            self.handlers[event] = []
        self.handlers[event].append(handler)

    def emit(self, event: str, payload: Any):
        if event in self.handlers:
            for handler in self.handlers[event]:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.create_task(handler(payload))
                else:
                    handler(payload)

    async def request_human_intervention(self, reason: str, context: Any) -> Any:
        Telemetry.track_event(self.name, "HUMAN_INTERVENTION_REQUESTED", {"reason": reason, "context": context})
        
        # Broadcast request to TelemetryAuditRoom
        TelemetryAuditRoom.broadcast("HUMAN_INTERVENTION_REQUESTED", {
            "agent": self.name,
            "reason": reason,
            "context": context
        })

        # Format printing to match TS console.log exactly
        # Note: in Python, print dictionary with keys/values formatted cleanly.
        # We can format reason and context matching the TS logging style.
        import json
        print(f"[Band API] Pause for Human Intervention: {reason}", json.dumps(context, separators=(',', ':')))
        await asyncio.sleep(3)
        
        response = {"status": "approved", "comments": "Doctor reviewed and approved."}
        
        # Broadcast resolution to TelemetryAuditRoom
        TelemetryAuditRoom.broadcast("RESOLVED", {
            "agent": self.name,
            "resolution": response
        })

        return response

class BandRoom:
    def __init__(self, name: str):
        self.id = f"room-{int(time.time() * 1000)}"
        self.name = name
        self.agents: List[BandAgent] = []
        self.state: Dict[str, Any] = {}

    def join(self, agent: BandAgent):
        self.agents.append(agent)
        agent.room = self
        Telemetry.track_event("BandSDK", "AGENT_JOINED", {"room": self.name, "agent": agent.name})
        if self.name != "Telemetry-Audit-Room":
            TelemetryAuditRoom.broadcast("AGENT_JOINED", {"room": self.name, "agent": agent.name})

    def broadcast(self, event: str, payload: Any):
        for agent in self.agents:
            agent.emit(event, payload)

    def update_state(self, key: str, value: Any):
        self.state[key] = value
        Telemetry.track_event("BandRoom", "STATE_UPDATED", {"key": key, "value": value})
        if self.name != "Telemetry-Audit-Room":
            TelemetryAuditRoom.broadcast("STATE_UPDATED", {"room": self.name, "key": key, "value": value})

class BandSDK:
    @staticmethod
    def create_room(name: str) -> BandRoom:
        return BandRoom(name)

    @staticmethod
    def create_agent(name: str) -> BandAgent:
        return BandAgent(name)

HealthcareOrchestrationRoom = BandSDK.create_room("Healthcare-Orchestration-Room")
ReceptionNavigationRoom = BandSDK.create_room("Reception-Navigation-Room")
ClinicalConsultRoom = BandSDK.create_room("Clinical-Consult-Room")
PharmacyInventoryRoom = BandSDK.create_room("Pharmacy-Inventory-Room")
TelemetryAuditRoom = BandSDK.create_room("Telemetry-Audit-Room")

