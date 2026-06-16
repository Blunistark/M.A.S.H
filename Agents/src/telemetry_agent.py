from typing import Dict, Any, List
from src.band_config import TelemetryAuditRoom, BandSDK
from src.telemetry import Telemetry

class TelemetryAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("TelemetryAgent")
        TelemetryAuditRoom.join(self.agent)
        self.audit_log: List[Dict[str, Any]] = []
        self.setup_listeners()

    def setup_listeners(self):
        def on_agent_joined(payload: Dict[str, Any]):
            entry = {
                "type": "AGENT_JOINED",
                "room": payload.get("room"),
                "agent": payload.get("agent")
            }
            self.audit_log.append(entry)
            Telemetry.track_event(self.agent.name, "AUDIT_AGENT_JOINED", entry)

        def on_state_updated(payload: Dict[str, Any]):
            entry = {
                "type": "STATE_UPDATED",
                "room": payload.get("room"),
                "key": payload.get("key"),
                "value": payload.get("value")
            }
            self.audit_log.append(entry)
            Telemetry.track_event(self.agent.name, "AUDIT_STATE_UPDATED", entry)

        def on_human_intervention_requested(payload: Dict[str, Any]):
            entry = {
                "type": "HUMAN_INTERVENTION_REQUESTED",
                "agent": payload.get("agent"),
                "reason": payload.get("reason"),
                "context": payload.get("context")
            }
            self.audit_log.append(entry)
            Telemetry.track_event(self.agent.name, "AUDIT_HUMAN_INTERVENTION_REQUESTED", entry)

        def on_resolved(payload: Dict[str, Any]):
            entry = {
                "type": "RESOLVED",
                "agent": payload.get("agent"),
                "resolution": payload.get("resolution")
            }
            self.audit_log.append(entry)
            Telemetry.track_event(self.agent.name, "AUDIT_RESOLVED", entry)

        self.agent.on_event("AGENT_JOINED", on_agent_joined)
        self.agent.on_event("STATE_UPDATED", on_state_updated)
        self.agent.on_event("HUMAN_INTERVENTION_REQUESTED", on_human_intervention_requested)
        self.agent.on_event("RESOLVED", on_resolved)

    def generate_audit_report(self) -> str:
        report = ["=== CLINIC AUDIT REPORT ==="]
        for idx, entry in enumerate(self.audit_log, 1):
            if entry["type"] == "AGENT_JOINED":
                report.append(f"{idx:02d}. [JOIN] Agent '{entry['agent']}' joined room '{entry['room']}'")
            elif entry["type"] == "STATE_UPDATED":
                report.append(f"{idx:02d}. [STATE] Room '{entry['room']}': key '{entry['key']}' updated to '{entry['value']}'")
            elif entry["type"] == "HUMAN_INTERVENTION_REQUESTED":
                report.append(f"{idx:02d}. [INTERVENTION REQUEST] Agent '{entry['agent']}' requested approval: {entry['reason']}")
            elif entry["type"] == "RESOLVED":
                report.append(f"{idx:02d}. [INTERVENTION RESOLUTION] Agent '{entry['agent']}' intervention resolved: {entry['resolution']['status']} - Comments: {entry['resolution']['comments']}")
        return "\n".join(report)
