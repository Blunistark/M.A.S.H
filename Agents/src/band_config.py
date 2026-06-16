import asyncio
import time
import os
import json
from typing import Callable, Any, Dict, List
from dotenv import load_dotenv
from src.telemetry import Telemetry

# Load environment variables
load_dotenv()

USE_REAL_BAND = os.getenv("USE_REAL_BAND", "false").lower() == "true"

ROOM_ID_TO_NAME: Dict[str, str] = {}
ROOM_NAME_TO_ID: Dict[str, str] = {}

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
        if USE_REAL_BAND:
            asyncio.create_task(send_platform_event(self.id, event, payload))
            self.broadcast_local(event, payload)
        else:
            self.broadcast_local(event, payload)

    def broadcast_local(self, event: str, payload: Any):
        for agent in self.agents:
            agent.emit(event, payload)

    def update_state(self, key: str, value: Any):
        self.state[key] = value
        Telemetry.track_event("BandRoom", "STATE_UPDATED", {"key": key, "value": value})
        if self.name != "Telemetry-Audit-Room":
            TelemetryAuditRoom.broadcast("STATE_UPDATED", {"room": self.name, "key": key, "value": value})

async def send_platform_event(room_id: str, event: str, payload: Any):
    if not BandSDK.rest_client:
        return
    from band.client.rest import ChatEventRequest, DEFAULT_REQUEST_OPTIONS
    try:
        await BandSDK.rest_client.agent_api_events.create_agent_chat_event(
            chat_id=room_id,
            event=ChatEventRequest(
                content=event,
                message_type="task",
                metadata=payload
            ),
            request_options=DEFAULT_REQUEST_OPTIONS
        )
    except Exception as e:
        import logging
        logging.getLogger("band_config").exception(f"Failed to send event {event} to room {room_id}: {e}")

try:
    from band.core.simple_adapter import SimpleAdapter
    from band.core.types import PlatformMessage
    from band.core.protocols import AgentToolsProtocol
    from band.preprocessing.default import DefaultPreprocessor

    class BandSimpleAdapter(SimpleAdapter[Any]):
        async def on_message(
            self,
            msg: PlatformMessage,
            tools: AgentToolsProtocol,
            history: Any,
            participants_msg: str | None,
            contacts_msg: str | None,
            *,
            is_session_bootstrap: bool,
            room_id: str,
        ) -> None:
            room_name = ROOM_ID_TO_NAME.get(room_id)
            if not room_name:
                return

            room = MOCK_ROOMS.get(room_name)
            if not room:
                return

            event_name = msg.content if msg.message_type == "task" else msg.message_type
            payload = msg.metadata
            if not payload and msg.content:
                try:
                    payload = json.loads(msg.content)
                except Exception:
                    payload = msg.content

            room.broadcast_local(event_name, payload)

    class BandPreprocessor(DefaultPreprocessor):
        async def process(self, ctx, event, agent_id):
            # Pass dummy-agent-id to super so it doesn't filter out messages/events from self
            return await super().process(ctx, event, "dummy-agent-id")
except ImportError:
    class BandSimpleAdapter:
        pass
    class BandPreprocessor:
        pass

class BandSDK:
    real_agent = None
    rest_client = None

    @staticmethod
    def create_room(name: str) -> BandRoom:
        return BandRoom(name)

    @staticmethod
    def create_agent(name: str) -> BandAgent:
        return BandAgent(name)

    @staticmethod
    async def init_real_band():
        global ROOM_ID_TO_NAME, ROOM_NAME_TO_ID
        from band import Agent
        from band.config import load_agent_config
        from band.client.rest import AsyncRestClient, ChatRoomRequest

        try:
            agent_id, api_key = load_agent_config("my_agent", config_path="agent_config.yaml")
        except Exception as e:
            raise RuntimeError(f"Failed to load agent configuration: {e}")

        rest_url = os.getenv("BAND_REST_URL") or os.getenv("THENVOI_REST_URL") or "https://app.band.ai"
        ws_url = os.getenv("BAND_WS_URL") or os.getenv("THENVOI_WS_URL") or "wss://app.band.ai/api/v1/socket/websocket"

        client = AsyncRestClient(api_key=api_key, base_url=rest_url)
        BandSDK.rest_client = client

        # 1. Load room mappings
        rooms_file = ".env.rooms"
        if os.path.exists(rooms_file):
            with open(rooms_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and "=" in line:
                        name, rid = line.split("=", 1)
                        ROOM_NAME_TO_ID[name] = rid
                        ROOM_ID_TO_NAME[rid] = name

        # 2. Check and create any missing rooms
        required_rooms = [
            "Healthcare-Orchestration-Room",
            "Reception-Navigation-Room",
            "Clinical-Consult-Room",
            "Pharmacy-Inventory-Room",
            "Telemetry-Audit-Room"
        ]

        updated_rooms_file = False
        for room_name in required_rooms:
            if room_name not in ROOM_NAME_TO_ID:
                print(f"[BandSDK] Creating platform room for '{room_name}'...")
                room_res = await client.agent_api_chats.create_agent_chat(chat=ChatRoomRequest(task_id=None))
                rid = room_res.data.id
                ROOM_NAME_TO_ID[room_name] = rid
                ROOM_ID_TO_NAME[rid] = room_name
                updated_rooms_file = True

        if updated_rooms_file:
            with open(rooms_file, "w") as f:
                for name, rid in ROOM_NAME_TO_ID.items():
                    f.write(f"{name}={rid}\n")

        # 3. Update mock room IDs with real room IDs
        for name, rid in ROOM_NAME_TO_ID.items():
            if name in MOCK_ROOMS:
                MOCK_ROOMS[name].id = rid

        # 4. Initialize real agent
        adapter = BandSimpleAdapter()
        real_agent = Agent.create(
            adapter=adapter,
            agent_id=agent_id,
            api_key=api_key,
            ws_url=ws_url,
            rest_url=rest_url,
            preprocessor=BandPreprocessor(),
        )

        print("[BandSDK] Starting Real Agent connection...")
        await real_agent.start()
        BandSDK.real_agent = real_agent
        print(f"[BandSDK] Connected to Band Platform as '{real_agent.agent_name}'")

    @staticmethod
    async def stop_real_band():
        if BandSDK.real_agent:
            print("[BandSDK] Stopping Real Agent connection...")
            await BandSDK.real_agent.stop()
            BandSDK.real_agent = None
            print("[BandSDK] Stopped Real Agent connection.")

HealthcareOrchestrationRoom = BandSDK.create_room("Healthcare-Orchestration-Room")
ReceptionNavigationRoom = BandSDK.create_room("Reception-Navigation-Room")
ClinicalConsultRoom = BandSDK.create_room("Clinical-Consult-Room")
PharmacyInventoryRoom = BandSDK.create_room("Pharmacy-Inventory-Room")
TelemetryAuditRoom = BandSDK.create_room("Telemetry-Audit-Room")

MOCK_ROOMS = {
    "Healthcare-Orchestration-Room": HealthcareOrchestrationRoom,
    "Reception-Navigation-Room": ReceptionNavigationRoom,
    "Clinical-Consult-Room": ClinicalConsultRoom,
    "Pharmacy-Inventory-Room": PharmacyInventoryRoom,
    "Telemetry-Audit-Room": TelemetryAuditRoom
}

