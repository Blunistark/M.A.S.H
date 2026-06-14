"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mockData_1 = require("./mockData");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/api/metrics', (req, res) => {
    res.json(mockData_1.initialMetrics);
});
app.get('/api/patients', (req, res) => {
    res.json(mockData_1.mockPatients);
});
app.get('/api/patients/:id', (req, res) => {
    const patient = mockData_1.mockPatients.find(p => p.id === req.params.id);
    if (patient) {
        res.json(patient);
    }
    else {
        res.status(404).json({ message: 'Patient not found' });
    }
});
// Update patient info (mock)
app.put('/api/patients/:id', (req, res) => {
    const index = mockData_1.mockPatients.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        mockData_1.mockPatients[index] = { ...mockData_1.mockPatients[index], ...req.body };
        res.json(mockData_1.mockPatients[index]);
    }
    else {
        res.status(404).json({ message: 'Patient not found' });
    }
});
// Add new patient (mock)
app.post('/api/patients', (req, res) => {
    const newPatient = {
        id: `patient-${Date.now()}`,
        ...req.body
    };
    mockData_1.mockPatients.push(newPatient);
    res.status(201).json(newPatient);
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
