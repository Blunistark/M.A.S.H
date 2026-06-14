"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./config/supabase");
const mockData_1 = require("./mockData");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/api/metrics', async (req, res) => {
    // Example of using Supabase:
    // const { data, error } = await supabase.from('metrics').select('*').single();
    // if (error) return res.status(500).json({ error: error.message });
    // res.json(data);
    // Fallback to mock data for now
    res.json(mockData_1.initialMetrics);
});
app.get('/api/patients', async (req, res) => {
    try {
        // Attempt to fetch from Supabase
        const { data: patients, error } = await supabase_1.supabase.from('patients').select('*');
        if (error) {
            console.warn('Supabase fetch failed, returning mock data:', error.message);
            return res.json(mockData_1.mockPatients);
        }
        // If table is empty or we got data, return it
        if (patients && patients.length > 0) {
            return res.json(patients);
        }
        // Fallback to mock data
        res.json(mockData_1.mockPatients);
    }
    catch (err) {
        res.json(mockData_1.mockPatients);
    }
});
app.get('/api/patients/:id', async (req, res) => {
    try {
        const { data: patient, error } = await supabase_1.supabase
            .from('patients')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error || !patient) {
            const mockPatient = mockData_1.mockPatients.find(p => p.id === req.params.id);
            if (mockPatient)
                return res.json(mockPatient);
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { data: patient, error } = await supabase_1.supabase
            .from('patients')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) {
            // Mock fallback
            const index = mockData_1.mockPatients.findIndex(p => p.id === req.params.id);
            if (index !== -1) {
                mockData_1.mockPatients[index] = { ...mockData_1.mockPatients[index], ...req.body };
                return res.json(mockData_1.mockPatients[index]);
            }
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/patients', async (req, res) => {
    try {
        const { data: patient, error } = await supabase_1.supabase
            .from('patients')
            .insert([req.body])
            .select()
            .single();
        if (error) {
            // Mock fallback
            const newPatient = {
                id: `patient-${Date.now()}`,
                ...req.body
            };
            mockData_1.mockPatients.push(newPatient);
            return res.status(201).json(newPatient);
        }
        res.status(201).json(patient);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
