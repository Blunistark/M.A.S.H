import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mockPatients, initialMetrics } from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/metrics', (req, res) => {
  res.json(initialMetrics);
});

app.get('/api/patients', (req, res) => {
  res.json(mockPatients);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = mockPatients.find(p => p.id === req.params.id);
  if (patient) {
    res.json(patient);
  } else {
    res.status(404).json({ message: 'Patient not found' });
  }
});

// Update patient info (mock)
app.put('/api/patients/:id', (req, res) => {
  const index = mockPatients.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPatients[index] = { ...mockPatients[index], ...req.body };
    res.json(mockPatients[index]);
  } else {
    res.status(404).json({ message: 'Patient not found' });
  }
});

// Add new patient (mock)
app.post('/api/patients', (req, res) => {
  const newPatient = {
    id: `patient-${Date.now()}`,
    ...req.body
  };
  mockPatients.push(newPatient);
  res.status(201).json(newPatient);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
