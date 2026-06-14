"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const band_config_1 = require("./band_config");
const SummaryAgent_1 = require("./SummaryAgent");
const MedicineManagementAgent_1 = require("./MedicineManagementAgent");
console.log('Initializing Band of Agents mesh...');
// Instantiate Agents (which automatically join the room and set up full-duplex listeners)
const summaryAgent = new SummaryAgent_1.SummaryAgent();
const medicineAgent = new MedicineManagementAgent_1.MedicineManagementAgent();
// Example simulation of orchestration workflow:
console.log('--- Simulating Workflow ---');
// 1. Patient data arrives, trigger summary
band_config_1.HealthcareOrchestrationRoom.broadcast('GENERATE_SUMMARY', {
    patientId: 'P-12345',
    history: ['Checkup 2024', 'Vaccination 2025']
});
// 2. Prescription written for an available medicine
band_config_1.HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
    patientId: 'P-12345',
    prescription: { medicine: 'Ibuprofen 400mg' }
});
// 3. Prescription written for an out-of-stock medicine (triggers Human-in-the-Loop)
setTimeout(() => {
    band_config_1.HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
        patientId: 'P-12345',
        prescription: { medicine: 'Rare-Antibiotic 500mg' }
    });
}, 1000);
