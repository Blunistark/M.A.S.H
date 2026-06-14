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
            const summary = await this.callLLMForSummary(payload.history);
            // Update room state
            band_config_1.HealthcareOrchestrationRoom.updateState(`patient_summary_${payload.patientId}`, summary);
            // Full-duplex delegation: broadcast completion to the room
            Telemetry_1.Telemetry.trackHandoff(this.agent.name, 'ALL', { action: 'SUMMARY_GENERATED', patientId: payload.patientId });
            band_config_1.HealthcareOrchestrationRoom.broadcast('SUMMARY_AVAILABLE', { patientId: payload.patientId, summary });
        });
    }
    async callLLMForSummary(history) {
        // Mocking Gemini/Mistral API call
        return `Patient has a history of ${history.length} notable events. Last visit was regular. Recommended follow-up in 6 months.`;
    }
}
exports.SummaryAgent = SummaryAgent;
