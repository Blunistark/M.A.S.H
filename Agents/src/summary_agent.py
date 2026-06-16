from typing import List, Dict, Any
from src.band_config import HealthcareOrchestrationRoom, ClinicalConsultRoom, BandSDK
from src.telemetry import Telemetry

class SummaryAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("SummaryAgent")
        HealthcareOrchestrationRoom.join(self.agent)
        ClinicalConsultRoom.join(self.agent)
        self.setup_listeners()

    def setup_listeners(self):
        async def on_generate_summary(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            history = payload["history"]
            tests = payload.get("tests", [])
            surgeries = payload.get("surgeries", [])

            Telemetry.track_event(self.agent.name, "START_SUMMARY_GENERATION", {"patientId": patient_id})

            summary = await self.call_llm_for_summary(history, tests, surgeries)

            # Update room state
            HealthcareOrchestrationRoom.update_state(f"patient_summary_{patient_id}", summary)

            # Full-duplex delegation: broadcast completion to the room
            Telemetry.track_handoff(self.agent.name, "ALL", {"action": "SUMMARY_GENERATED", "patientId": patient_id})
            HealthcareOrchestrationRoom.broadcast("SUMMARY_AVAILABLE", {"patientId": patient_id, "summary": summary})

        async def on_summarize_patient_history(payload: Dict[str, Any]):
            patient_id = payload["patientId"]
            history = payload.get("history", [])
            tests = payload.get("tests", [])
            surgeries = payload.get("surgeries", [])

            Telemetry.track_event(self.agent.name, "SUMMARIZE_PATIENT_HISTORY_START", {"patientId": patient_id})

            summary = await self.call_llm_for_summary(history, tests, surgeries)

            ClinicalConsultRoom.broadcast("PATIENT_HISTORY_COMPILED", {
                "patientId": patient_id,
                "compiledHistory": summary
            })

        self.agent.on_event("GENERATE_SUMMARY", on_generate_summary)
        self.agent.on_event("SUMMARIZE_PATIENT_HISTORY", on_summarize_patient_history)

    async def call_llm_for_summary(self, history: List[str], tests: List[Dict[str, Any]], surgeries: List[Dict[str, Any]]) -> str:
        history_text = f"History: {', '.join(history)}." if history else "No significant medical history."
        
        tests_text = "No diagnostic tests recorded."
        if tests:
            tests_text = f"Tests conducted: {'; '.join(f'{t.get('name')} on {t.get('date')} ({t.get('result')})' for t in tests)}."
            
        surgeries_text = "No surgical history."
        if surgeries:
            surgeries_text = f"Surgeries: {'; '.join(f'{s.get('procedure')} on {s.get('date')} (Outcome: {s.get('outcome')})' for s in surgeries)}."

        return f"Patient Summary:\n- {history_text}\n- {tests_text}\n- {surgeries_text}"

