import os
import asyncio
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from src.summary_agent import SummaryAgent
from src.doctor_agent import DoctorAssistantAgent
from src.pharmacist_agent import PharmacistAssistantAgent

summary_agent = None
doctor_agent = None
pharmacist_agent = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global summary_agent, doctor_agent, pharmacist_agent
    use_real_band = os.getenv("USE_REAL_BAND", "false").lower() == "true"
    if use_real_band:
        from src.band_config import BandSDK
        print("Connecting to real Band platform...")
        await BandSDK.init_real_band()
    
    print("Initializing Agents...")
    try:
        summary_agent = SummaryAgent()
        doctor_agent = DoctorAssistantAgent("a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd", "Dr. Smith")
        await doctor_agent.load_schedule_to_patient_map()
        pharmacist_agent = PharmacistAssistantAgent()
        print("Agents initialized successfully (Doctor + Pharmacist).")
    except Exception as e:
        print(f"Failed to initialize agents: {e}")
        import traceback
        traceback.print_exc()
    
    yield
    
    if use_real_band:
        from src.band_config import BandSDK
        await BandSDK.stop_real_band()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]

def extract_text(content) -> str:
    """Robustly extract plain text from LangChain message content."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict):
                parts.append(part.get("text", ""))
            elif isinstance(part, str):
                parts.append(part)
        return "".join(parts)
    return str(content)

@app.post("/api/doctor-chat")
async def doctor_chat(req: ChatRequest):
    print(f"[DEBUG] Incoming doctor-chat message: '{req.message}'")
    if not doctor_agent:
        raise HTTPException(status_code=503, detail="Doctor Agent is not initialized yet.")
    
    # Map input history to LangGraph format
    langgraph_messages = []
    for h in req.history:
        role = "user" if h.role == "user" else "assistant"
        langgraph_messages.append({"role": role, "content": h.text})
    
    langgraph_messages.append({"role": "user", "content": req.message})
    
    try:
        # Clear actions before query (handled in process_doctor_query as well)
        doctor_agent.pending_actions = []
        
        updated_messages = await doctor_agent.process_doctor_query(langgraph_messages)
        last_msg = updated_messages[-1]
        reply = extract_text(last_msg.content)
        
        # Get the first pending action if any was triggered by a tool
        action = doctor_agent.pending_actions[0] if doctor_agent.pending_actions else None
        
        return {"reply": reply, "action": action}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pharmacist-chat")
async def pharmacist_chat(req: ChatRequest):
    print(f"[DEBUG] Incoming pharmacist-chat message: '{req.message}'")
    if not pharmacist_agent:
        raise HTTPException(status_code=503, detail="Pharmacist Agent is not initialized yet.")
    
    # Map input history to LangGraph format
    langgraph_messages = []
    for h in req.history:
        role = "user" if h.role == "user" else "assistant"
        langgraph_messages.append({"role": role, "content": h.text})
    
    langgraph_messages.append({"role": "user", "content": req.message})
    
    try:
        pharmacist_agent.pending_actions = []
        
        updated_messages = await pharmacist_agent.process_pharmacist_query(langgraph_messages)
        last_msg = updated_messages[-1]
        reply = extract_text(last_msg.content)
        
        action = pharmacist_agent.pending_actions[0] if pharmacist_agent.pending_actions else None
        
        return {"reply": reply, "action": action}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("agent_server:app", host="0.0.0.0", port=port, reload=False)

