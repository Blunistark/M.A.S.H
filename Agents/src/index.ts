import { HealthcareOrchestrationRoom } from './band_config';
import { SummaryAgent } from './SummaryAgent';
import { MedicineManagementAgent } from './MedicineManagementAgent';

console.log('Initializing Band of Agents mesh...');

// Instantiate Agents (which automatically join the room and set up full-duplex listeners)
const summaryAgent = new SummaryAgent();
const medicineAgent = new MedicineManagementAgent();

// Example simulation of orchestration workflow:
console.log('--- Simulating Workflow ---');

// 1. Patient data arrives, trigger summary
HealthcareOrchestrationRoom.broadcast('GENERATE_SUMMARY', { 
  patientId: 'P-12345', 
  history: ['Checkup 2024', 'Vaccination 2025'] 
});

// 2. Prescription written for an available medicine
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
