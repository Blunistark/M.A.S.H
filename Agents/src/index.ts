import { HealthcareOrchestrationRoom } from './band_config';
import { SummaryAgent } from './SummaryAgent';
import { MedicineManagementAgent } from './MedicineManagementAgent';
import { StockManagementAgent } from './StockManagementAgent';
import { RegistrationAgent } from './RegistrationAgent';
import { PatientManagementAgent } from './PatientManagementAgent';
import { PatientNavigationAgent } from './PatientNavigationAgent';

console.log('Initializing Band of Agents mesh...');

// Instantiate Agents (which automatically join the room and set up full-duplex listeners)
const summaryAgent = new SummaryAgent();
const medicineAgent = new MedicineManagementAgent();
const stockAgent = new StockManagementAgent();
const registrationAgent = new RegistrationAgent();
const patientManagementAgent = new PatientManagementAgent();
const patientNavigationAgent = new PatientNavigationAgent();

// Log simulation events for visibility
HealthcareOrchestrationRoom.broadcast = ((originalBroadcast) => {
  return function(this: any, event: string, payload: any) {
    if (event === 'REORDER_SUGGESTION') {
      console.log(`[SIMULATION ALERT] Reorder Suggestion Received: ${payload.reason}`);
    } else if (event === 'STOCK_STATS_RESPONSE') {
      console.log(`[SIMULATION RESPONSE] Current Stock Stats:`, payload.stats);
    } else if (event === 'SUMMARY_AVAILABLE') {
      console.log(`[SIMULATION RESPONSE] Generated Summary for ${payload.patientId}:\n${payload.summary}`);
    } else if (event === 'DOCTORS_LIST_RESPONSE') {
      console.log(`[SIMULATION RESPONSE] Available Doctors list:`, payload.doctors.map((d: any) => `${d.name} (${d.specialty}) - Slots: [${d.availableSlots.join(', ')}]`));
    } else if (event === 'APPOINTMENT_CONFIRMED') {
      console.log(`[SIMULATION ALERT] Appointment Confirmed for ${payload.patientId} with Doctor ID ${payload.doctorId} at slot ${payload.slot} (Status: ${payload.status})${payload.comments ? ` - Comments: ${payload.comments}` : ''}`);
    } else if (event === 'NAVIGATION_DIRECTIONS') {
      console.log(`[SIMULATION RESPONSE] Navigation Directions for ${payload.patientId}:\n${payload.directions}`);
    }
    return originalBroadcast.apply(this, arguments as any);
  };
})(HealthcareOrchestrationRoom.broadcast);

// Example simulation of orchestration workflow:
console.log('--- Simulating Workflow ---');

// 1. Patient data arrives, trigger summary
HealthcareOrchestrationRoom.broadcast('GENERATE_SUMMARY', { 
  patientId: 'P-12345', 
  history: ['Checkup 2024', 'Vaccination 2025'],
  tests: [
    { name: 'Blood Panel', date: '2025-11-10', result: 'Normal' },
    { name: 'X-Ray Chest', date: '2026-02-14', result: 'Clear lungs' }
  ],
  surgeries: [
    { procedure: 'Appendectomy', date: '2020-04-12', outcome: 'Successful recovery' }
  ]
});

// 2. Prescription written for an available medicine (1st usage)
HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
  patientId: 'P-12345',
  prescription: { medicine: 'Ibuprofen 400mg' }
});

// 3. Prescription written for an out-of-stock medicine (triggers Human-in-the-Loop)
setTimeout(() => {
  HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
    patientId: 'P-12345',
    prescription: { medicine: 'Rare-Antibiotic 500mg' }
  });
}, 1000);

// 4. Repeated prescription of the same medicine to trigger Stock Reorder Suggestion (2nd usage)
setTimeout(() => {
  console.log('\n--- Triggering repeated usage of Ibuprofen to test Stock Management Agent ---');
  HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
    patientId: 'P-67890',
    prescription: { medicine: 'Ibuprofen 400mg' }
  });
}, 2000);

// 5. Query current stock stats
setTimeout(() => {
  console.log('\n--- Querying Stock Stats ---');
  HealthcareOrchestrationRoom.broadcast('GET_STOCK_STATS', {});
}, 3000);

// 6. Registration workflow: Query available doctor directory
setTimeout(() => {
  console.log('\n--- Querying Doctors Directory ---');
  HealthcareOrchestrationRoom.broadcast('QUERY_DOCTORS', {});
}, 4000);

// 7. Patient Management workflow: Request scheduling / rescheduling
setTimeout(() => {
  console.log('\n--- Requesting Rescheduling (Successful Flow) ---');
  HealthcareOrchestrationRoom.broadcast('RESCHEDULE_APPOINTMENT', {
    patientId: 'P-12345',
    doctorId: 'doc-1',
    doctorName: 'Dr. Smith',
    requestedSlot: '10:00'
  });
}, 5000);

// 8. Patient Management workflow: Request scheduling with slot conflict (triggers Human-in-the-Loop)
setTimeout(() => {
  console.log('\n--- Requesting Rescheduling with Slot Conflict (Human-in-the-Loop) ---');
  HealthcareOrchestrationRoom.broadcast('RESCHEDULE_APPOINTMENT', {
    patientId: 'P-12345',
    doctorId: 'doc-1',
    doctorName: 'Dr. Smith',
    requestedSlot: '11:00' // Dr. Smith is not available at 11:00
  });
}, 6000);

// 9. Navigation workflow: Request routing directions to see doctor
setTimeout(() => {
  console.log('\n--- Requesting Navigation Guidance to see Dr. Smith ---');
  HealthcareOrchestrationRoom.broadcast('REQUEST_NAVIGATION', {
    patientId: 'P-12345',
    doctorId: 'doc-1',
    currentLocation: 'Main Entrance Lobby'
  });
}, 7000);
