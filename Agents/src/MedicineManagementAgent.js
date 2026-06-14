"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineManagementAgent = void 0;
const band_config_1 = require("./band_config");
const Telemetry_1 = require("./Telemetry");
class MedicineManagementAgent {
    agent;
    constructor() {
        this.agent = band_config_1.BandSDK.createAgent('MedicineManagementAgent');
        band_config_1.HealthcareOrchestrationRoom.join(this.agent);
        this.setupListeners();
    }
    setupListeners() {
        this.agent.onEvent('PROCESS_PRESCRIPTION', async (payload) => {
            Telemetry_1.Telemetry.trackEvent(this.agent.name, 'EVALUATE_PRESCRIPTION', { patientId: payload.patientId });
            const isStockAvailable = this.checkStock(payload.prescription.medicine);
            if (isStockAvailable) {
                // Dual-branched handoff: Route directly to Pharma queue
                Telemetry_1.Telemetry.trackHandoff(this.agent.name, 'PharmaQueue', { patientId: payload.patientId, prescription: payload.prescription });
                band_config_1.HealthcareOrchestrationRoom.broadcast('ROUTE_TO_PHARMA', { patientId: payload.patientId, prescription: payload.prescription });
            }
            else {
                // Dual-branched handoff: Raise Band event for Human-in-the-Loop
                const humanResponse = await this.agent.requestHumanIntervention(`Medicine '${payload.prescription.medicine}' is out of stock. Require Doctor's alternate prescription.`, { patientId: payload.patientId, prescription: payload.prescription });
                Telemetry_1.Telemetry.trackEvent(this.agent.name, 'HUMAN_INTERVENTION_RESOLVED', humanResponse);
                // Broadcast the resolution
                band_config_1.HealthcareOrchestrationRoom.broadcast('PRESCRIPTION_UPDATED', { patientId: payload.patientId, resolution: humanResponse });
            }
        });
    }
    checkStock(medicine) {
        // Mock logic: anything with "rare" in the name is out of stock
        return !medicine.toLowerCase().includes('rare');
    }
}
exports.MedicineManagementAgent = MedicineManagementAgent;
//# sourceMappingURL=MedicineManagementAgent.js.map