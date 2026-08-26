"""
LangGraph Event Bus — replaces the Band SDK communication layer.

Provides an in-process pub/sub event bus for multi-agent coordination.
All 7 Band rooms are replaced by named Channels with identical semantics:
  - Agents join channels
  - Agents subscribe to events on channels
  - Channels broadcast events to all subscribed agents instantly
  - Channels hold shared state

This module is a drop-in replacement for band_config.py.
"""

import asyncio
import time
from typing import Callable, Any, Dict, List


class AgentHandle:
    """Lightweight handle for an agent — replaces BandAgent from band_config.py."""

    def __init__(self, name: str):
        self.id = f"agent-{name}-{int(time.time() * 1000)}"
        self.name = name
        self.channel = None  # Set when the agent joins a channel
        self.handlers: Dict[str, List[Callable[[Any], Any]]] = {}

    def on(self, event: str, handler: Callable[[Any], Any]):
        """Subscribe to an event. Identical semantics to BandAgent.on_event()."""
        if event not in self.handlers:
            self.handlers[event] = []
        self.handlers[event].append(handler)

    # Keep backward-compatible alias so agent code using on_event still works
    on_event = on

    def _dispatch(self, event: str, payload: Any):
        """Dispatch an event to all registered handlers for this agent."""
        if event in self.handlers:
            for handler in self.handlers[event]:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.create_task(handler(payload))
                else:
                    handler(payload)

    async def request_human_intervention(self, reason: str, context: Any) -> Any:
        """Simulate human-in-the-loop approval (replaces BandAgent.request_human_intervention).

        In the Band version this posted to TelemetryAuditRoom and slept 3s.
        We keep the same behaviour: log, broadcast to telemetry, sleep, return approval.
        """
        from src.telemetry import Telemetry
        Telemetry.track_event(self.name, "HUMAN_INTERVENTION_REQUESTED", {"reason": reason, "context": context})

        # Broadcast to telemetry channel
        TelemetryAuditChannel.emit("HUMAN_INTERVENTION_REQUESTED", {
            "agent": self.name,
            "reason": reason,
            "context": context
        })

        import json
        print(f"[EventBus] Pause for Human Intervention: {reason}", json.dumps(context, separators=(',', ':')))
        await asyncio.sleep(3)

        response = {"status": "approved", "comments": "Doctor reviewed and approved."}

        TelemetryAuditChannel.emit("RESOLVED", {
            "agent": self.name,
            "resolution": response
        })

        return response


class Channel:
    """Named pub/sub channel — replaces BandRoom from band_config.py.

    Provides the same API surface:
      - join(agent)           — register an agent in the channel
      - emit(event, payload)  — broadcast an event to all agents in the channel
      - update_state(k, v)    — store shared state
      - state                 — read shared state
    """

    def __init__(self, name: str):
        self.id = f"channel-{name}-{int(time.time() * 1000)}"
        self.name = name
        self.agents: List[AgentHandle] = []
        self.state: Dict[str, Any] = {}

    def join(self, agent: AgentHandle):
        """Add an agent to this channel."""
        self.agents.append(agent)
        agent.channel = self

        from src.telemetry import Telemetry
        Telemetry.track_event("EventBus", "AGENT_JOINED", {"channel": self.name, "agent": agent.name})

        # Notify telemetry channel (avoid infinite recursion for telemetry channel itself)
        if self.name != "telemetry_audit":
            TelemetryAuditChannel.emit("AGENT_JOINED", {"room": self.name, "agent": agent.name})

    def emit(self, event: str, payload: Any):
        """Broadcast an event to every agent in this channel.

        This is the equivalent of BandRoom.broadcast() — but instant and in-process.
        """
        for agent in self.agents:
            agent._dispatch(event, payload)

    # Keep backward-compatible alias so code using .broadcast() still works during migration
    broadcast = emit
    broadcast_local = emit

    def update_state(self, key: str, value: Any):
        """Store shared state on this channel."""
        self.state[key] = value

        from src.telemetry import Telemetry
        Telemetry.track_event("Channel", "STATE_UPDATED", {"key": key, "value": value})

        if self.name != "telemetry_audit":
            TelemetryAuditChannel.emit("STATE_UPDATED", {"room": self.name, "key": key, "value": value})


class EventBus:
    """Singleton event bus managing all channels and agents."""

    def __init__(self):
        self._channels: Dict[str, Channel] = {}

    def create_channel(self, name: str) -> Channel:
        """Create (or get) a named channel."""
        if name not in self._channels:
            self._channels[name] = Channel(name)
        return self._channels[name]

    def create_agent(self, name: str) -> AgentHandle:
        """Create a new agent handle."""
        return AgentHandle(name)

    @property
    def channels(self) -> Dict[str, Channel]:
        """Access all channels (used by telemetry endpoint)."""
        return self._channels


# ─── Singleton instance ───────────────────────────────────────────────
event_bus = EventBus()

# ─── Channel instances (replacing the 7 Band rooms) ──────────────────
PatientManagementChannel   = event_bus.create_channel("patient_management")
DoctorDashboardChannel     = event_bus.create_channel("doctor_dashboard")
ReceptionNavigationChannel = event_bus.create_channel("reception_navigation")
ClinicalConsultChannel     = event_bus.create_channel("clinical_consult")
PharmacyInventoryChannel   = event_bus.create_channel("pharmacy_inventory")
TelemetryAuditChannel      = event_bus.create_channel("telemetry_audit")
PharmacistDashboardChannel = event_bus.create_channel("pharmacist_dashboard")

# ─── Backward-compatible aliases (Room → Channel) ────────────────────
# These allow gradual migration — agents can use either name
PatientManagementRoom   = PatientManagementChannel
DoctorDashboardRoom     = DoctorDashboardChannel
ReceptionNavigationRoom = ReceptionNavigationChannel
ClinicalConsultRoom     = ClinicalConsultChannel
PharmacyInventoryRoom   = PharmacyInventoryChannel
TelemetryAuditRoom      = TelemetryAuditChannel
PharmacistDashboardRoom = PharmacistDashboardChannel

# ─── BandSDK backward-compatible shim ────────────────────────────────
# Some agent files call BandSDK.create_agent() — this shim keeps that working
class _BandSDKShim:
    """Drop-in shim so `BandSDK.create_agent(name)` and `BandSDK.create_room(name)` still work."""

    @staticmethod
    def create_agent(name: str) -> AgentHandle:
        return event_bus.create_agent(name)

    @staticmethod
    def create_room(name: str) -> Channel:
        return event_bus.create_channel(name)

BandSDK = _BandSDKShim()
