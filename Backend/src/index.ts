import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { mockPatients, initialMetrics } from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/metrics', async (req, res) => {
  // Example of using Supabase:
  // const { data, error } = await supabase.from('metrics').select('*').single();
  // if (error) return res.status(500).json({ error: error.message });
  // res.json(data);
  
  // Fallback to mock data for now
  res.json(initialMetrics);
});

app.get('/api/patients', async (req, res) => {
  try {
    // Attempt to fetch from Supabase
    const { data: patients, error } = await supabase.from('patients').select('*');
    
    if (error) {
      console.warn('Supabase fetch failed, returning mock data:', error.message);
      return res.json(mockPatients);
    }
    
    // If table is empty or we got data, return it
    if (patients && patients.length > 0) {
      return res.json(patients);
    }
    
    // Fallback to mock data
    res.json(mockPatients);
  } catch (err) {
    res.json(mockPatients);
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !patient) {
      const mockPatient = mockPatients.find(p => p.id === req.params.id);
      if (mockPatient) return res.json(mockPatient);
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      // Mock fallback
      const index = mockPatients.findIndex(p => p.id === req.params.id);
      if (index !== -1) {
        mockPatients[index] = { ...mockPatients[index], ...req.body };
        return res.json(mockPatients[index]);
      }
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { data: patient, error } = await supabase
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
      mockPatients.push(newPatient);
      return res.status(201).json(newPatient);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
