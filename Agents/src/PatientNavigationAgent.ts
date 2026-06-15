import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export class PatientNavigationAgent {
  private agent: BandAgent;
  // Doctor locations mapping
  private doctorLocations: Record<string, { room: string, floor: string }> = {
    'doc-1': { room: 'Room 302', floor: '3rd Floor' }, // Dr. Smith
    'doc-2': { room: 'Room 105', floor: '1st Floor' }, // Dr. Jones
    'doc-3': { room: 'Room 204', floor: '2nd Floor' }  // Dr. Davis
  };

  constructor() {
    this.agent = BandSDK.createAgent('PatientNavigationAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    this.setupListeners();
  }

  private setupListeners() {
    this.agent.onEvent('REQUEST_NAVIGATION', (payload: { patientId: string, doctorId: string, currentLocation: string }) => {
      Telemetry.trackEvent(this.agent.name, 'GENERATING_NAVIGATION', payload);
      
      const loc = this.doctorLocations[payload.doctorId];
      let directions = '';
      
      if (loc) {
        directions = `From ${payload.currentLocation}: Go to the elevator, go to the ${loc.floor}, and find ${loc.room}.`;
      } else {
        directions = `From ${payload.currentLocation}: Please head to the main information desk on the ground floor.`;
      }

      HealthcareOrchestrationRoom.broadcast('NAVIGATION_DIRECTIONS', {
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        directions
      });
    });
  }
}
