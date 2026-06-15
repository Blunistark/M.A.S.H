import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export interface TestRecord {
  name: string;
  date: string;
  result: string;
}

export interface SurgeryRecord {
  procedure: string;
  date: string;
  outcome: string;
}

export class SummaryAgent {
  private agent: BandAgent;

  constructor() {
    this.agent = BandSDK.createAgent('SummaryAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for requests to generate patient summaries
    this.agent.onEvent('GENERATE_SUMMARY', async (payload: {
      patientId: string;
      history: string[];
      tests?: TestRecord[];
      surgeries?: SurgeryRecord[];
    }) => {
      Telemetry.trackEvent(this.agent.name, 'START_SUMMARY_GENERATION', { patientId: payload.patientId });
      
      const summary = await this.callLLMForSummary(payload.history, payload.tests || [], payload.surgeries || []);
      
      // Update room state
      HealthcareOrchestrationRoom.updateState(`patient_summary_${payload.patientId}`, summary);
      
      // Full-duplex delegation: broadcast completion to the room
      Telemetry.trackHandoff(this.agent.name, 'ALL', { action: 'SUMMARY_GENERATED', patientId: payload.patientId });
      HealthcareOrchestrationRoom.broadcast('SUMMARY_AVAILABLE', { patientId: payload.patientId, summary });
    });
  }

  private async callLLMForSummary(history: string[], tests: TestRecord[], surgeries: SurgeryRecord[]) {
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
