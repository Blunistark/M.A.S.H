import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export class SummaryAgent {
  private agent: BandAgent;

  constructor() {
    this.agent = BandSDK.createAgent('SummaryAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for requests to generate patient summaries
    this.agent.onEvent('GENERATE_SUMMARY', async (payload: { patientId: string, history: any[] }) => {
      Telemetry.trackEvent(this.agent.name, 'START_SUMMARY_GENERATION', { patientId: payload.patientId });
      
      const summary = await this.callLLMForSummary(payload.history);
      
      // Update room state
      HealthcareOrchestrationRoom.updateState(`patient_summary_${payload.patientId}`, summary);
      
      // Full-duplex delegation: broadcast completion to the room
      Telemetry.trackHandoff(this.agent.name, 'ALL', { action: 'SUMMARY_GENERATED', patientId: payload.patientId });
      HealthcareOrchestrationRoom.broadcast('SUMMARY_AVAILABLE', { patientId: payload.patientId, summary });
    });
  }

  private async callLLMForSummary(history: any[]) {
    // Mocking Gemini/Mistral API call
    return `Patient has a history of ${history.length} notable events. Last visit was regular. Recommended follow-up in 6 months.`;
  }
}
