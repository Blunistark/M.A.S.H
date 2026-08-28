import json
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, START, END
from src.event_bus import PatientManagementRoom, DoctorDashboardRoom, ClinicalConsultRoom, BandSDK
from src.telemetry import Telemetry
from src.supabase_tools import (
    fetch_medical_records_from_supabase,
    fetch_patient_records_from_supabase,
    save_patient_summary_to_supabase
)

class PatientSummaryState(TypedDict):
    event_name: str
    payload: Dict[str, Any]

class SummaryAgent:
    def __init__(self):
        self.agent = BandSDK.create_agent("SummaryAgent")
        PatientManagementRoom.join(self.agent)
        DoctorDashboardRoom.join(self.agent)
        ClinicalConsultRoom.join(self.agent)
        self.graph = self._build_graph()
        self.setup_listeners()

    def _build_graph(self):
        builder = StateGraph(PatientSummaryState)

        async def generate_summary_node(state: PatientSummaryState) -> PatientSummaryState:
            payload = state["payload"]
            patient_id = payload["patientId"]
            history = payload["history"]
            tests = payload.get("tests", [])
            surgeries = payload.get("surgeries", [])

            Telemetry.track_event(self.agent.name, "START_SUMMARY_GENERATION", {"patientId": patient_id})

            # Try to query Supabase if patient_id is a valid UUID
            import uuid
            try:
                uuid.UUID(patient_id)
                db_records = await fetch_medical_records_from_supabase(patient_id)
                patient_records = await fetch_patient_records_from_supabase(patient_id)
                history_items = []
                test_items = []
                surgery_items = []

                if patient_records:
                    for pr in patient_records:
                        report = pr.get("doctor_report") or {}
                        if isinstance(report, str):
                            try:
                                report = json.loads(report)
                            except Exception:
                                report = {}
                        intake = report.get("ai_intake_summary") or {}
                        if intake:
                            for c in intake.get("conditions") or []:
                                history_items.append(f"Condition: {c}")
                            for a in intake.get("allergies") or []:
                                history_items.append(f"Allergy: {a}")
                            for m in intake.get("medications") or []:
                                history_items.append(f"Medication: {m}")
                            for f in intake.get("family_history") or []:
                                history_items.append(f"Family History: {f}")
                            for s in intake.get("surgeries") or []:
                                surgery_items.append({"procedure": s, "date": "Self-reported", "outcome": "Past procedure"})

                if db_records:
                    for record in db_records:
                        rtype = record.get("record_type")
                        desc = record.get("description", "")
                        
                        desc_data = {}
                        if isinstance(desc, str) and desc.startswith("{") and desc.endswith("}"):
                            try:
                                desc_data = json.loads(desc)
                            except Exception:
                                pass
                        elif isinstance(desc, dict):
                            desc_data = desc

                        if rtype == "chronic_condition":
                            history_items.append(desc if isinstance(desc, str) else str(desc))
                        elif rtype == "allergy":
                            if desc_data:
                                history_items.append(f"Allergy: {desc_data.get('name')} (Severity: {desc_data.get('severity')})")
                            else:
                                history_items.append(f"Allergy: {desc}")
                        elif rtype == "test_result":
                            if desc_data:
                                test_items.append({
                                    "name": desc_data.get("name"),
                                    "date": desc_data.get("date"),
                                    "result": desc_data.get("result")
                                })
                        elif rtype == "surgical_history":
                            if desc_data:
                                surgery_items.append({
                                    "procedure": desc_data.get("name"),
                                    "date": desc_data.get("date"),
                                    "outcome": desc_data.get("description") or "Successful recovery"
                                })
                if history_items:
                    history = history_items
                if test_items:
                    tests = test_items
                if surgery_items:
                    surgeries = surgery_items
            except ValueError:
                pass

            summary = await self.call_llm_for_summary(history, tests, surgeries)

            # Try to save to Supabase if patient_id is a valid UUID
            import uuid
            try:
                uuid.UUID(patient_id)
                await save_patient_summary_to_supabase(patient_id, summary)
            except ValueError:
                pass

            # Update room state
            PatientManagementRoom.update_state(f"patient_summary_{patient_id}", summary)

            # Full-duplex delegation: broadcast completion to the room
            Telemetry.track_handoff(self.agent.name, "ALL", {"action": "SUMMARY_GENERATED", "patientId": patient_id})
            PatientManagementRoom.broadcast("SUMMARY_AVAILABLE", {"patientId": patient_id, "summary": summary})
            return state

        async def summarize_history_node(state: PatientSummaryState) -> PatientSummaryState:
            payload = state["payload"]
            patient_id = payload["patientId"]
            history = payload.get("history", [])
            tests = payload.get("tests", [])
            surgeries = payload.get("surgeries", [])

            Telemetry.track_event(self.agent.name, "SUMMARIZE_PATIENT_HISTORY_START", {"patientId": patient_id})

            import uuid
            try:
                uuid.UUID(patient_id)
                db_records = await fetch_medical_records_from_supabase(patient_id)
                patient_records = await fetch_patient_records_from_supabase(patient_id)
                history_items = []
                test_items = []
                surgery_items = []

                if patient_records:
                    for pr in patient_records:
                        report = pr.get("doctor_report") or {}
                        if isinstance(report, str):
                            try:
                                report = json.loads(report)
                            except Exception:
                                report = {}
                        intake = report.get("ai_intake_summary") or {}
                        if intake:
                            for c in intake.get("conditions") or []:
                                history_items.append(f"Condition: {c}")
                            for a in intake.get("allergies") or []:
                                history_items.append(f"Allergy: {a}")
                            for m in intake.get("medications") or []:
                                history_items.append(f"Medication: {m}")
                            for f in intake.get("family_history") or []:
                                history_items.append(f"Family History: {f}")
                            for s in intake.get("surgeries") or []:
                                surgery_items.append({"procedure": s, "date": "Self-reported", "outcome": "Past procedure"})

                if db_records:
                    for record in db_records:
                        rtype = record.get("record_type")
                        desc = record.get("description", "")
                        
                        desc_data = {}
                        if isinstance(desc, str) and desc.startswith("{") and desc.endswith("}"):
                            try:
                                desc_data = json.loads(desc)
                            except Exception:
                                pass
                        elif isinstance(desc, dict):
                            desc_data = desc

                        if rtype == "chronic_condition":
                            history_items.append(desc if isinstance(desc, str) else str(desc))
                        elif rtype == "allergy":
                            if desc_data:
                                history_items.append(f"Allergy: {desc_data.get('name')} (Severity: {desc_data.get('severity')})")
                            else:
                                history_items.append(f"Allergy: {desc}")
                        elif rtype == "test_result":
                            if desc_data:
                                test_items.append({
                                    "name": desc_data.get("name"),
                                    "date": desc_data.get("date"),
                                    "result": desc_data.get("result")
                                })
                        elif rtype == "surgical_history":
                            if desc_data:
                                surgery_items.append({
                                    "procedure": desc_data.get("name"),
                                    "date": desc_data.get("date"),
                                    "outcome": desc_data.get("description") or "Successful recovery"
                                })
                if history_items:
                    history = history_items
                if test_items:
                    tests = test_items
                if surgery_items:
                    surgeries = surgery_items
            except ValueError:
                pass

            summary = await self.call_llm_for_summary(history, tests, surgeries)

            # Try to save to Supabase if patient_id is a valid UUID
            import uuid
            try:
                uuid.UUID(patient_id)
                await save_patient_summary_to_supabase(patient_id, summary)
            except ValueError:
                pass

            ClinicalConsultRoom.broadcast("PATIENT_HISTORY_COMPILED", {
                "patientId": patient_id,
                "compiledHistory": summary
            })
            return state

        def route_event(state: PatientSummaryState) -> str:
            event_name = state.get("event_name")
            if event_name == "GENERATE_SUMMARY":
                return "generate_summary"
            elif event_name == "SUMMARIZE_PATIENT_HISTORY":
                return "summarize_history"
            return END

        builder.add_node("generate_summary", generate_summary_node)
        builder.add_node("summarize_history", summarize_history_node)

        builder.add_conditional_edges(
            START,
            route_event,
            {
                "generate_summary": "generate_summary",
                "summarize_history": "summarize_history",
                END: END
            }
        )
        builder.add_edge("generate_summary", END)
        builder.add_edge("summarize_history", END)

        return builder.compile()

    def setup_listeners(self):
        async def on_generate_summary(payload: Dict[str, Any]):
            await self.graph.ainvoke({"event_name": "GENERATE_SUMMARY", "payload": payload})

        async def on_summarize_patient_history(payload: Dict[str, Any]):
            await self.graph.ainvoke({"event_name": "SUMMARIZE_PATIENT_HISTORY", "payload": payload})

        async def on_patient_summary_requested(payload: Dict[str, Any]):
            patient_id = payload.get("patientId")
            patient_name = payload.get("patientName", "Unknown Patient")
            req_id = payload.get("requestId")

            Telemetry.track_event(self.agent.name, "PATIENT_SUMMARY_REQUESTED", {"patientId": patient_id})

            import uuid
            db_records = []
            patient_records = []
            try:
                uuid.UUID(patient_id)
                db_records = await fetch_medical_records_from_supabase(patient_id)
                patient_records = await fetch_patient_records_from_supabase(patient_id)
            except (ValueError, TypeError):
                pass

            summary_table = await self.call_llm_for_summary_table(patient_name, db_records, patient_records)

            DoctorDashboardRoom.broadcast("PATIENT_SUMMARY_RESPONSE", {
                "requestId": req_id,
                "patientId": patient_id,
                "patientName": patient_name,
                "summary": summary_table
            })

        self.agent.on_event("GENERATE_SUMMARY", on_generate_summary)
        self.agent.on_event("SUMMARIZE_PATIENT_HISTORY", on_summarize_patient_history)
        self.agent.on_event("PATIENT_SUMMARY_REQUESTED", on_patient_summary_requested)

    async def call_llm_for_summary(self, history: List[str], tests: List[Dict[str, Any]], surgeries: List[Dict[str, Any]]) -> str:
        history_text = f"History: {', '.join(history)}." if history else "No significant medical history."
        
        tests_text = "No diagnostic tests recorded."
        if tests:
            formatted_tests = []
            for t in tests:
                formatted_tests.append(f"{t.get('name')} on {t.get('date')} ({t.get('result')})")
            tests_text = f"Tests conducted: {'; '.join(formatted_tests)}."
            
        surgeries_text = "No surgical history."
        if surgeries:
            formatted_surgeries = []
            for s in surgeries:
                formatted_surgeries.append(f"{s.get('procedure')} on {s.get('date')} (Outcome: {s.get('outcome')})")
            surgeries_text = f"Surgeries: {'; '.join(formatted_surgeries)}."

        return f"Patient Summary:\n- {history_text}\n- {tests_text}\n- {surgeries_text}"

    async def call_llm_for_summary_table(self, patient_name: str, db_records: List[Dict[str, Any]] = None, patient_records: List[Dict[str, Any]] = None) -> str:
        """Build a markdown table from medical_records and patient_records tables."""
        history_items, allergy_items, medication_items, family_items = [], [], [], []
        test_rows, surgery_rows, visit_rows = [], [], []
        clinical_summaries = []

        # 1. Extract from patient_records (AI intake summary + visit reports)
        if patient_records:
            for pr in patient_records:
                report = pr.get("doctor_report") or {}
                if isinstance(report, str):
                    try:
                        report = json.loads(report)
                    except Exception:
                        report = {}
                
                intake = report.get("ai_intake_summary") or {}
                if intake:
                    if intake.get("summary") and intake["summary"] not in clinical_summaries:
                        clinical_summaries.append(intake["summary"])
                    for c in intake.get("conditions") or []:
                        if c not in history_items:
                            history_items.append(c)
                    for a in intake.get("allergies") or []:
                        if a not in allergy_items:
                            allergy_items.append(a)
                    for s in intake.get("surgeries") or []:
                        surgery_rows.append({
                            "procedure": s,
                            "date": "Self-reported",
                            "outcome": "Past procedure"
                        })
                    for m in intake.get("medications") or []:
                        if m not in medication_items:
                            medication_items.append(m)
                    for f in intake.get("family_history") or []:
                        if f not in family_items:
                            family_items.append(f)
                
                if report.get("source") == "post_visit":
                    visit_date = report.get("visit_date") or pr.get("created_at") or "Past visit"
                    comments = report.get("doctor_comments")
                    rx_list = report.get("prescriptions_given") or []
                    rx_str = ", ".join([f"{r.get('medicine')} ({r.get('dosage')})" for r in rx_list]) if rx_list else "None"
                    visit_rows.append({
                        "date": str(visit_date)[:10],
                        "comments": comments or "Routine consultation",
                        "prescriptions": rx_str
                    })

        # 2. Extract from medical_records
        if db_records:
            for record in db_records:
                rtype = record.get("record_type", "")
                desc = record.get("description", "")
                record_date = record.get("record_date", "")

                desc_data: Dict[str, Any] = {}
                if isinstance(desc, str) and desc.startswith("{"):
                    try:
                        desc_data = json.loads(desc)
                    except Exception:
                        pass
                elif isinstance(desc, dict):
                    desc_data = desc

                if rtype == "chronic_condition":
                    val = desc if isinstance(desc, str) else str(desc)
                    if val not in history_items:
                        history_items.append(val)
                elif rtype == "allergy":
                    name = desc_data.get("name") or desc
                    severity = desc_data.get("severity", "Unknown")
                    allergy_str = f"{name} (Severity: {severity})"
                    if allergy_str not in allergy_items:
                        allergy_items.append(allergy_str)
                elif rtype == "test_result":
                    test_rows.append({
                        "name": desc_data.get("name", "Unknown Test"),
                        "date": desc_data.get("date") or record_date,
                        "result": desc_data.get("result", "—")
                    })
                elif rtype == "surgical_history":
                    surgery_rows.append({
                        "procedure": desc_data.get("name", "Unknown Procedure"),
                        "date": desc_data.get("date") or record_date,
                        "outcome": desc_data.get("description") or "Successful recovery"
                    })
                elif rtype == "ai_summary" and isinstance(desc, str):
                    if desc not in clinical_summaries:
                        clinical_summaries.append(desc)

        lines = [f"## Patient Summary: {patient_name}", ""]

        if clinical_summaries:
            lines.append("### Clinical Summary")
            for cs in clinical_summaries:
                lines.append(f"> {cs}")
            lines.append("")

        # Conditions & Allergies & Medications
        lines.append("### Medical Conditions, Medications & Allergies")
        lines.append("| Category | Details |")
        lines.append("|----------|---------|")
        if history_items:
            for h in history_items:
                lines.append(f"| Condition | {h} |")
        else:
            lines.append("| Condition | No chronic conditions recorded |")
        if medication_items:
            for m in medication_items:
                lines.append(f"| Medication | {m} |")
        if allergy_items:
            for a in allergy_items:
                lines.append(f"| Allergy | {a} |")
        else:
            lines.append("| Allergy | No known allergies |")
        if family_items:
            for f in family_items:
                lines.append(f"| Family History | {f} |")
        lines.append("")

        # Past Hospital Visits
        if visit_rows:
            lines.append("### Past Hospital Visits")
            lines.append("| Date | Doctor Notes | Prescriptions Given |")
            lines.append("|------|--------------|---------------------|")
            for v in visit_rows:
                lines.append(f"| {v['date']} | {v['comments']} | {v['prescriptions']} |")
            lines.append("")

        # Test Results
        lines.append("### Diagnostic Tests")
        if test_rows:
            lines.append("| Test Name | Date | Result |")
            lines.append("|-----------|------|--------|")
            for t in test_rows:
                lines.append(f"| {t['name']} | {t['date']} | {t['result']} |")
        else:
            lines.append("_No diagnostic tests recorded._")
        lines.append("")

        # Surgeries
        lines.append("### Surgical History")
        if surgery_rows:
            lines.append("| Procedure | Date | Outcome |")
            lines.append("|-----------|------|---------|")
            for s in surgery_rows:
                lines.append(f"| {s['procedure']} | {s['date']} | {s['outcome']} |")
        else:
            lines.append("_No surgical history recorded._")

        return "\n".join(lines)
