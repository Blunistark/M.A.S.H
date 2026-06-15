"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryAgent = void 0;
const band_config_1 = require("./band_config");
const Telemetry_1 = require("./Telemetry");
class SummaryAgent {
    agent;
    constructor() {
        this.agent = band_config_1.BandSDK.createAgent('SummaryAgent');
        band_config_1.HealthcareOrchestrationRoom.join(this.agent);
        this.setupListeners();
    }
    setupListeners() {
        // Listen for requests to generate patient summaries
        this.agent.onEvent('GENERATE_SUMMARY', async (payload) => {
            Telemetry_1.Telemetry.trackEvent(this.agent.name, 'START_SUMMARY_GENERATION', { patientId: payload.patientId });
            const summary = await this.callLLMForSummary(payload.history, payload.tests || [], payload.surgeries || []);
            // Update room state
            band_config_1.HealthcareOrchestrationRoom.updateState(`patient_summary_${payload.patientId}`, summary);
            // Full-duplex delegation: broadcast completion to the room
            Telemetry_1.Telemetry.trackHandoff(this.agent.name, 'ALL', { action: 'SUMMARY_GENERATED', patientId: payload.patientId });
            band_config_1.HealthcareOrchestrationRoom.broadcast('SUMMARY_AVAILABLE', { patientId: payload.patientId, summary });
        });
    }
    async callLLMForSummary(history, tests, surgeries) {
        // Generate summarized string including tests and surgeries
        const historyText = history.length > 0 ? `History: ${history.join(', ')}.` : 'No significant medical history.';
        const testsText = tests.length > 0
            ? `Tests conducted: ${tests.map(t => `${t.name} on ${t.date} (${t.result})`).join('; ')}.`
            : 'No diagnostic tests recorded.';
        const surgeriesText = surgeries.length > 0
            ? `Surgeries: ${surgeries.map(s => `${s.procedure} on ${s.date} (Outcome: ${s.outcome})`).join('; ')}.`
            : 'No surgical history.';
        return `Patient Summary:\n- ${historyText}\n- ${testsText}\n- ${surgeriesText}`;
    }
}
exports.SummaryAgent = SummaryAgent;
