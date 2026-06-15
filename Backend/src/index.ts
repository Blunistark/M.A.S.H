import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes

// GET /api/metrics
app.get('/api/metrics', async (req, res) => {
  try {
    // Today's appointments count
    const { count: todayCount, error: todayErr } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    // Remaining appointments count (scheduled)
    const { count: remainingCount, error: remainingErr } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled');

    // Stock alerts count (current_stock <= reorder_threshold)
    // Supabase JS doesn't support complex column-to-column comparisons directly via filters,
    // so we can fetch and filter or run a RPC. To keep it simple and clean:
    const { data: inventory, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('current_stock, reorder_threshold');

    const stockAlertsCount = inventory 
      ? inventory.filter(m => m.current_stock <= m.reorder_threshold).length 
      : 0;

    if (todayErr || remainingErr || invErr) {
      return res.status(500).json({ message: 'Error fetching metrics from database' });
    }

    res.json({
      todayAppointmentsCount: todayCount || 0,
      remainingAppointmentsCount: remainingCount || 0,
      pendingReschedulesCount: 3, // mocked
      notificationsCount: 8, // mocked
      stockAlertsCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/profiles/:id
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/doctor_details
app.get('/api/doctor_details', async (req, res) => {
  try {
    const { data, error } = await supabase.from('doctor_details').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  try {
    const { patient_id, doctor_id, scheduled_time, status } = req.body;
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ patient_id, doctor_id, scheduled_time, status }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/medical_records
app.get('/api/medical_records', async (req, res) => {
  try {
    const { data, error } = await supabase.from('medical_records').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/prescriptions
app.get('/api/prescriptions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prescriptions').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/prescription_items
app.get('/api/prescription_items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prescription_items').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/medicine_inventory
app.get('/api/medicine_inventory', async (req, res) => {
  try {
    const { data, error } = await supabase.from('medicine_inventory').select('*');
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
