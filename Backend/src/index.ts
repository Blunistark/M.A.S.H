import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { 
  initialMetrics, 
  mockProfiles, 
  mockDoctorDetails, 
  mockAppointments, 
  mockMedicalRecords, 
  mockMedicineInventory, 
  mockPrescriptions, 
  mockPrescriptionItems 
} from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/metrics', async (req, res) => {
  res.json(initialMetrics);
});

app.get('/api/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.warn('Supabase fetch failed, returning mock data:', error.message);
      return res.json(mockProfiles);
    }
    if (data && data.length > 0) return res.json(data);
    res.json(mockProfiles);
  } catch (err) {
    res.json(mockProfiles);
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error || !data) {
      const mock = mockProfiles.find(p => p.id === req.params.id);
      if (mock) return res.json(mock);
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) return res.json(mockAppointments);
    if (data && data.length > 0) return res.json(data);
    res.json(mockAppointments);
  } catch (err) {
    res.json(mockAppointments);
  }
});

app.get('/api/medical_records', async (req, res) => {
  try {
    const { data, error } = await supabase.from('medical_records').select('*');
    if (error) return res.json(mockMedicalRecords);
    if (data && data.length > 0) return res.json(data);
    res.json(mockMedicalRecords);
  } catch (err) {
    res.json(mockMedicalRecords);
  }
});

app.get('/api/prescriptions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prescriptions').select('*');
    if (error) return res.json(mockPrescriptions);
    if (data && data.length > 0) return res.json(data);
    res.json(mockPrescriptions);
  } catch (err) {
    res.json(mockPrescriptions);
  }
});

app.get('/api/prescription_items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prescription_items').select('*');
    if (error) return res.json(mockPrescriptionItems);
    if (data && data.length > 0) return res.json(data);
    res.json(mockPrescriptionItems);
  } catch (err) {
    res.json(mockPrescriptionItems);
  }
});

app.get('/api/medicine_inventory', async (req, res) => {
  try {
    const { data, error } = await supabase.from('medicine_inventory').select('*');
    if (error) return res.json(mockMedicineInventory);
    if (data && data.length > 0) return res.json(data);
    res.json(mockMedicineInventory);
  } catch (err) {
    res.json(mockMedicineInventory);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
