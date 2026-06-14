import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mockPatients } from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
