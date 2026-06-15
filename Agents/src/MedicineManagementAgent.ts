import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export class MedicineManagementAgent {
  private agent: BandAgent;

  constructor() {
    this.agent = BandSDK.createAgent('MedicineManagementAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.agent.onEvent('PROCESS_PRESCRIPTION', async (payload: { patientId: string, prescription: any }) => {
      Telemetry.trackEvent(this.agent.name, 'EVALUATE_PRESCRIPTION', { patientId: payload.patientId });

      const isStockAvailable = this.checkStock(payload.prescription.medicine);

      if (isStockAvailable) {
        // Dual-branched handoff: Route directly to Pharma queue
        Telemetry.trackHandoff(this.agent.name, 'PharmaQueue', { patientId: payload.patientId, prescription: payload.prescription });
        HealthcareOrchestrationRoom.broadcast('ROUTE_TO_PHARMA', { patientId: payload.patientId, prescription: payload.prescription });
      } else {
        // Dual-branched handoff: Raise Band event for Human-in-the-Loop
        const humanResponse = await this.agent.requestHumanIntervention(
          `Medicine '${payload.prescription.medicine}' is out of stock. Require Doctor's alternate prescription.`,
          { patientId: payload.patientId, prescription: payload.prescription }
        );

        Telemetry.trackEvent(this.agent.name, 'HUMAN_INTERVENTION_RESOLVED', humanResponse);
        
        // Broadcast the resolution
        HealthcareOrchestrationRoom.broadcast('PRESCRIPTION_UPDATED', { patientId: payload.patientId, resolution: humanResponse });
      }
    });
  }

  private checkStock(medicine: string): boolean {
    // Mock logic: anything with "rare" in the name is out of stock
    return !medicine.toLowerCase().includes('rare');
  }
}
