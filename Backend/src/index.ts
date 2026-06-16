import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { supabase } from './config/supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, contact_number } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Email, password and full name are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const authUser = data.user;
    if (!authUser) {
      return res.status(400).json({ message: 'Signup failed to create user' });
    }

    // Insert profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          full_name,
          role: 'patient',
          contact_number: contact_number || null,
        }
      ])
      .select()
      .single();

    if (profileErr) {
      return res.status(500).json({ message: `Profile creation failed: ${profileErr.message}` });
    }

    res.status(201).json({
      user: authUser,
      profile,
      session: data.session,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const authUser = data.user;
    if (!authUser) {
      return res.status(400).json({ message: 'Login failed' });
    }

    // Fetch profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    let userProfile = profile;
    if (profileErr) {
      console.warn('Profile not found for authenticated user, creating default profile');
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            full_name: email.split('@')[0],
            role: 'patient',
          }
        ])
        .select()
        .single();
      userProfile = newProfile;
    }

    res.json({
      user: authUser,
      profile: userProfile,
      session: data.session,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

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

// POST /api/profiles
app.post('/api/profiles', async (req, res) => {
  try {
    const { full_name, contact_number } = req.body;
    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const newId = crypto.randomUUID();

    // Create profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert([
        {
          id: newId,
          full_name,
          role: 'patient',
          contact_number: contact_number || null,
        }
      ])
      .select()
      .single();

    if (profileErr) {
      return res.status(500).json({ message: profileErr.message });
    }

    // Resolve a valid doctor ID dynamically from the database
    const { data: doctors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'doctor')
      .limit(1);

    const resolvedDoctorId = doctors && doctors.length > 0
      ? doctors[0].id
      : 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd';

    // Insert default demographics record
    const initials = full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const { error: mrErr } = await supabase.from('medical_records').insert([
      {
        patient_id: newId,
        doctor_id: resolvedDoctorId,
        record_type: 'demographics',
        description: JSON.stringify({
          dob: '01/01/1990',
          gender: 'Not Specified',
          bloodType: 'O+',
          photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
          age: 30,
          address: 'Not Provided',
          email: 'notprovided@email.com',
          initials
        }),
        record_date: new Date().toISOString().split('T')[0]
      }
    ]);

    if (mrErr) {
      console.error('Demographics creation warning:', mrErr);
    }

    res.status(201).json(profile);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
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

    let resolvedDoctorId = doctor_id;
    // Check if the doctor profile exists
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', doctor_id)
      .single();

    if (!doctorProfile) {
      const { data: firstDoc } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'doctor')
        .limit(1);

      if (firstDoc && firstDoc.length > 0) {
        resolvedDoctorId = firstDoc[0].id;
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ patient_id, doctor_id: resolvedDoctorId, scheduled_time, status }])
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

// PATCH /api/appointments/:id
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_time, status } = req.body;

    const { data, error } = await supabase
      .from('appointments')
      .update({ scheduled_time, status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/appointments/patient/:patientId/complete
app.patch('/api/appointments/patient/:patientId/complete', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('patient_id', patientId)
      .eq('status', 'scheduled')
      .select();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/prescriptions/send-to-pharmacy
app.post('/api/prescriptions/send-to-pharmacy', async (req, res) => {
  try {
    const { patient_id, doctor_id, items, doctor_comments } = req.body;

    if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'patient_id and items[] are required' });
    }

    let resolvedDoctorId = doctor_id;
    // Check if the doctor profile exists
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', doctor_id || '')
      .single();

    if (!doctorProfile) {
      const { data: firstDoc } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'doctor')
        .limit(1);

      if (firstDoc && firstDoc.length > 0) {
        resolvedDoctorId = firstDoc[0].id;
      } else {
        resolvedDoctorId = '22222222-2222-2222-2222-222222222222';
      }
    }

    // 1. Create the prescription with status 'pushed_to_pharma'
    const { data: rx, error: rxErr } = await supabase
      .from('prescriptions')
      .insert({
        patient_id,
        doctor_id: resolvedDoctorId,
        status: 'pushed_to_pharma',
        doctor_comments: doctor_comments || null
      })
      .select()
      .single();

    if (rxErr) throw rxErr;

    // 2. Fetch inventory to resolve medicine names → IDs
    const { data: inventory, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('id, medicine_name');

    if (invErr) throw invErr;

    // 3. Create prescription items
    const prescriptionItems = items.map((item: any) => {
      const med = (inventory || []).find(
        (m: any) => m.medicine_name.toLowerCase() === item.name.toLowerCase()
      );
      return {
        prescription_id: rx.id,
        medicine_id: med ? med.id : null,
        dosage: `${item.dosage} - ${item.frequency}`,
        quantity: item.quantity || item.duration || 7
      };
    });

    const { error: itemsErr } = await supabase
      .from('prescription_items')
      .insert(prescriptionItems);

    if (itemsErr) throw itemsErr;

    // 4. Also update any existing active prescription for this patient to 'completed'
    await supabase
      .from('prescriptions')
      .update({ status: 'completed' })
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .neq('id', rx.id);

    res.status(201).json(rx);
  } catch (err: any) {
    console.error('Error creating pharmacy prescription:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// GET /api/pharmacy
app.get('/api/pharmacy', async (req, res) => {
  try {
    const { data: prescriptions, error: rxErr } = await supabase
      .from('prescriptions')
      .select('*');
    
    if (rxErr) throw rxErr;

    const { data: items, error: itemsErr } = await supabase
      .from('prescription_items')
      .select('*');

    if (itemsErr) throw itemsErr;

    const { data: inventory, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('*');

    if (invErr) throw invErr;

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*');

    if (profErr) throw profErr;

    const validStatuses = ['pushed_to_pharma', 'alternative_requested', 'pending_check', 'fulfilled'];
    const rxList = (prescriptions || []).filter(p => validStatuses.includes(p.status));

    const detailedPrescriptions = rxList.map(rx => {
      const patient = (profiles || []).find(p => p.id === rx.patient_id);
      const doctor = (profiles || []).find(p => p.id === rx.doctor_id);
      
      const rxItems = (items || []).filter(item => item.prescription_id === rx.id).map(item => {
        const med = (inventory || []).find(inv => inv.id === item.medicine_id);
        const inStock = med ? (med.current_stock >= item.quantity) : false;
        return {
          id: item.id,
          medicine_id: item.medicine_id,
          medicine_name: med ? med.medicine_name : 'Unknown Medication',
          dosage: item.dosage,
          quantity: item.quantity,
          inStock,
          current_stock: med ? med.current_stock : 0
        };
      });

      const allInStock = rxItems.every(i => i.inStock);

      return {
        id: rx.id,
        patient_id: rx.patient_id,
        patient_name: patient ? patient.full_name : 'Unknown Patient',
        doctor_id: rx.doctor_id,
        doctor_name: doctor ? doctor.full_name : 'Unknown Doctor',
        status: rx.status,
        doctor_comments: rx.doctor_comments,
        items: rxItems,
        allInStock
      };
    });

    res.json({
      prescriptions: detailedPrescriptions,
      inventory: inventory || []
    });
  } catch (err: any) {
    console.error('Error fetching pharmacy aggregated data:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// PATCH /api/prescriptions/:id/fulfill
app.patch('/api/prescriptions/:id/fulfill', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get prescription items to deduct stock
    const { data: items, error: itemsErr } = await supabase
      .from('prescription_items')
      .select('medicine_id, quantity')
      .eq('prescription_id', id);

    if (itemsErr) throw itemsErr;

    // 2. Deduct stock for each item in inventory
    if (items) {
      for (const item of items) {
        if (item.medicine_id && item.quantity) {
          // Fetch current stock
          const { data: inv, error: invFetchErr } = await supabase
            .from('medicine_inventory')
            .select('current_stock')
            .eq('id', item.medicine_id)
            .single();

          if (!invFetchErr && inv) {
            const newStock = Math.max(0, inv.current_stock - item.quantity);
            await supabase
              .from('medicine_inventory')
              .update({ current_stock: newStock, last_updated: new Date().toISOString() })
              .eq('id', item.medicine_id);
          }
        }
      }
    }

    // 3. Update prescription status to fulfilled
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ status: 'fulfilled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/prescriptions/:id/alternative
app.patch('/api/prescriptions/:id/alternative', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ status: 'alternative_requested', doctor_comments: comments })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/medicine_inventory/:id/restock
app.patch('/api/medicine_inventory/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Fetch current stock
    const { data: inv, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('current_stock')
      .eq('id', id)
      .single();

    if (invErr) {
      return res.status(500).json({ message: invErr.message });
    }

    const newStock = (inv.current_stock || 0) + (amount || 100);

    const { data, error } = await supabase
      .from('medicine_inventory')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data);
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
