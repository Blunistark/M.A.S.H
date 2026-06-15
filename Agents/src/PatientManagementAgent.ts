import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export class PatientManagementAgent {
  private agent: BandAgent;

  constructor() {
    this.agent = BandSDK.createAgent('PatientManagementAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    this.setupListeners();
  }

  private setupListeners() {
    this.agent.onEvent('RESCHEDULE_APPOINTMENT', async (payload: { patientId: string, doctorId: string, requestedSlot: string, doctorName: string }) => {
      Telemetry.trackEvent(this.agent.name, 'START_RESCHEDULING', payload);

      // Simulating availability check (Dr. Smith doesn't have 11:00 slot, so it will fail and request human intervention)
      const isAvailable = payload.requestedSlot !== '11:00'; 

      if (isAvailable) {
        Telemetry.trackHandoff(this.agent.name, 'ALL', { action: 'RESCHEDULE_SUCCESS', patientId: payload.patientId });
        HealthcareOrchestrationRoom.broadcast('APPOINTMENT_CONFIRMED', {
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          slot: payload.requestedSlot,
          status: 'confirmed'
        });
      } else {
        // Human-in-the-Loop fallback
        const humanResponse = await this.agent.requestHumanIntervention(
          `Conflict: ${payload.doctorName} is unavailable at ${payload.requestedSlot}. Rescheduling required.`,
          payload
        );
        
        Telemetry.trackEvent(this.agent.name, 'RESCHEDULE_CONFLICT_RESOLVED', humanResponse);
        HealthcareOrchestrationRoom.broadcast('APPOINTMENT_CONFIRMED', {
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          slot: '14:00', // Slot assigned by human
          status: 'confirmed_via_intervention',
          comments: humanResponse.comments
        });
      }
    });
  }
}
