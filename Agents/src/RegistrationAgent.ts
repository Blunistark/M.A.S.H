import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availableSlots: string[]; // e.g. ["09:00", "14:00"]
}

export class RegistrationAgent {
  private agent: BandAgent;
  private doctors: Doctor[] = [
    { id: 'doc-1', name: 'Dr. Smith', specialty: 'Cardiology', availableSlots: ['09:00', '10:00', '14:00'] },
    { id: 'doc-2', name: 'Dr. Jones', specialty: 'Pediatrics', availableSlots: ['11:00', '15:00'] },
    { id: 'doc-3', name: 'Dr. Davis', specialty: 'General Practice', availableSlots: ['09:00', '13:00', '16:00'] }
  ];

  constructor() {
    this.agent = BandSDK.createAgent('RegistrationAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    this.setupListeners();
  }

  private setupListeners() {
    this.agent.onEvent('QUERY_DOCTORS', () => {
      Telemetry.trackEvent(this.agent.name, 'FETCHING_DOCTOR_LIST', {});
      HealthcareOrchestrationRoom.broadcast('DOCTORS_LIST_RESPONSE', { doctors: this.doctors });
    });

    this.agent.onEvent('CHECK_DOCTOR_AVAILABILITY', (payload: { doctorId: string, slot: string }) => {
      const doc = this.doctors.find(d => d.id === payload.doctorId);
      const isAvailable = doc ? doc.availableSlots.includes(payload.slot) : false;

      Telemetry.trackEvent(this.agent.name, 'CHECK_AVAILABILITY_RESULT', { doctorId: payload.doctorId, slot: payload.slot, isAvailable });
      HealthcareOrchestrationRoom.broadcast('DOCTOR_AVAILABILITY_STATUS', {
        doctorId: payload.doctorId,
        slot: payload.slot,
        isAvailable
      });
    });
  }
}
