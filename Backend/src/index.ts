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

    console.log(`[Prescription API] Received: patient_id=${patient_id}, doctor_id=${doctor_id}, items=${JSON.stringify(items)}, comments=${doctor_comments}`);

    if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
      console.log(`[Prescription API] REJECTED: Missing patient_id or items`);
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

    // 3. Create prescription items (with fuzzy medicine name matching)
    const prescriptionItems = items.map((item: any) => {
      const itemName = (item.name || '').toLowerCase().trim();
      // Tier 1: Exact match
      let med = (inventory || []).find(
        (m: any) => m.medicine_name.toLowerCase() === itemName
      );
      // Tier 2: Inventory name contains item name or vice-versa
      if (!med) {
        med = (inventory || []).find(
          (m: any) => m.medicine_name.toLowerCase().includes(itemName) || itemName.includes(m.medicine_name.toLowerCase())
        );
      }
      // Tier 3: First word match (e.g. "Tizanidine" matches "Tizanidine HCl 2mg Tablet")
      if (!med && itemName.split(' ').length > 0) {
        const firstWord = itemName.split(' ')[0];
        if (firstWord.length > 3) {
          med = (inventory || []).find(
            (m: any) => m.medicine_name.toLowerCase().includes(firstWord)
          );
        }
      }
      
      console.log(`[Prescription Item] "${item.name}" → ${med ? `matched: ${med.medicine_name} (${med.id})` : 'NO MATCH (medicine_id will be null)'}`);
      
      return {
        prescription_id: rx.id,
        medicine_id: med ? med.id : null,
        dosage: `${item.dosage || 'as directed'} - ${item.frequency || 'as needed'}`,
        quantity: item.quantity || item.duration || 7
      };
    });

    const { error: itemsErr } = await supabase
      .from('prescription_items')
      .insert(prescriptionItems);

    if (itemsErr) throw itemsErr;

    // 4. Also update any existing active or alternative_requested prescription for this patient to 'completed'
    await supabase
      .from('prescriptions')
      .update({ status: 'completed' })
      .eq('patient_id', patient_id)
      .in('status', ['active', 'alternative_requested'])
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

// POST /api/doctor-chat
app.post('/api/doctor-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch('http://127.0.0.1:8000/api/doctor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python DoctorAgent received successfully.');
        return res.json({ reply: agentData.reply, action: agentData.action });
      } else {
        console.warn('Python agent server returned non-ok status, falling back to direct Gemini call.');
      }
    } catch (err) {
      console.warn('Python agent server is unreachable, falling back to direct Gemini call:', err);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // 1. Fetch appointments for Dr. Smith
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd');

    // 2. Fetch profiles to match patient names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    // 3. Fetch medical records
    const { data: medicalRecords } = await supabase
      .from('medical_records')
      .select('*');

    // 4. Fetch inventory details
    const { data: inventory } = await supabase
      .from('medicine_inventory')
      .select('*');

    // Format schedule
    const scheduleStr = (appointments || []).map(appt => {
      const patient = (profiles || []).find(p => p.id === appt.patient_id);
      const patientName = patient ? patient.full_name : 'Unknown Patient';
      return `- Time: ${appt.scheduled_time}, Patient: ${patientName}, Status: ${appt.status}`;
    }).join('\n');

    // Format medical records
    const recordsStr = (medicalRecords || []).map(record => {
      const patient = (profiles || []).find(p => p.id === record.patient_id);
      if (!patient) return null;
      let desc = record.description;
      return `- Patient: ${patient.full_name}, Record Type: ${record.record_type}, Details: ${desc}`;
    }).filter(Boolean).join('\n');

    // Format inventory
    const inventoryStr = (inventory || []).map(item => {
      return `- Medicine: ${item.medicine_name}, Stock: ${item.current_stock}, Reorder Threshold: ${item.reorder_threshold}`;
    }).join('\n');

    const systemInstruction = `You are the personal AI assistant for Dr. Anita Desai (also known as Dr. Smith). 
You speak like a friendly, knowledgeable clinical colleague — not a stiff chatbot or a report generator.

Today's Schedule / Appointments:
${scheduleStr || 'No appointments scheduled today.'}

Patient Medical History Context:
${recordsStr || 'No patient records found.'}

Medicine Inventory Stock Levels:
${inventoryStr || 'No stock details available.'}

Guidelines:
1. Speak like a real professional clinical assistant.
2. When asked about patient history or today's schedule, summarize details conversationally.
3. Be friendly, brief, and concise. Speak in short paragraphs. No huge lists or markdown tables unless requested.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    // Map history to Gemini API format
    const contents = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    
    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return res.status(500).json({ message: `Gemini API returned error: ${response.status}` });
    }

    const resData = await response.json();
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // --- Extract navigation action from the user's message (fallback action extraction) ---
    let action: any = undefined;
    const msgLower = message.toLowerCase();

    // Check for patient profile navigation intent
    const patientNavPatterns = [
      /(?:open|show|go\s+to|view|navigate\s+to)\s+(?:patient\s+)?(?:profile\s+(?:of|for)\s+)?(.+?)(?:'s)?\s*(?:profile|page|record)?$/i,
      /(?:open|show|go\s+to|view)\s+(.+?)(?:'s)?\s*(?:profile|page)?$/i,
    ];

    let extractedName: string | null = null;
    for (const pattern of patientNavPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        extractedName = match[1].trim();
        break;
      }
    }

    if (extractedName && profiles) {
      const searchLower = extractedName.toLowerCase();
      const searchWords = searchLower.split(/\s+/).filter((w: string) => w.length > 1);
      const patients = (profiles as any[]).filter((p: any) => p.role === 'patient');
      
      let bestMatch: any = null;
      let bestScore = 0;

      for (const p of patients) {
        const fullName = (p.full_name || '').toLowerCase();
        const nameWords = fullName.split(/\s+/);
        let score = 0;

        if (fullName === searchLower) { score += 20; }
        else if (fullName.includes(searchLower)) { score += 10; }

        for (const sw of searchWords) {
          if (nameWords.some((nw: string) => nw === sw)) score += 5;
          else if (nameWords.some((nw: string) => nw.startsWith(sw))) score += 3;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = p;
        }
      }

      if (bestMatch && bestScore >= 3) {
        action = { type: 'navigate', route: 'patient-profile', patientId: bestMatch.id };
        console.log(`[Fallback] Resolved patient '${extractedName}' → ${bestMatch.full_name} (${bestMatch.id})`);
      }
    }

    // Check for simple page navigation intent
    if (!action) {
      const routeMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'home': 'dashboard',
        'main page': 'dashboard',
        'prescriptions': 'prescriptions',
        'prescription writer': 'prescriptions',
        'schedule': 'schedule',
        'calendar': 'schedule',
        'appointments': 'schedule',
        'patients': 'patients',
        'patients list': 'patients',
        'patients directory': 'patients',
        'pharmacy': 'pharmacy',
        'stock': 'pharmacy',
      };

      const navPrefixes = ['go to', 'navigate to', 'open', 'show', 'take me to'];
      for (const prefix of navPrefixes) {
        if (msgLower.includes(prefix)) {
          const afterPrefix = msgLower.split(prefix).pop()?.trim() || '';
          for (const [keyword, route] of Object.entries(routeMap)) {
            if (afterPrefix.includes(keyword)) {
              action = { type: 'navigate', route };
              break;
            }
          }
          if (action) break;
        }
      }

      // Also check if message itself is just the page name
      if (!action) {
        for (const [keyword, route] of Object.entries(routeMap)) {
          if (msgLower === keyword || msgLower === `go to ${keyword}`) {
            action = { type: 'navigate', route };
            break;
          }
        }
      }

      // Check for appointment booking intent
      if (!action && (msgLower.includes('new appointment') || msgLower.includes('book appointment') || msgLower.includes('create appointment'))) {
        action = { type: 'navigate', route: 'new-appointment' };
      }
    }

    res.json({ reply: replyText, action });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/pharmacist-chat
app.post('/api/pharmacist-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch('http://127.0.0.1:8000/api/pharmacist-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python PharmacistAgent received successfully.');
        return res.json({ reply: agentData.reply, action: agentData.action });
      } else {
        console.warn('Python agent server (pharmacist) returned non-ok status, falling back to direct Gemini call.');
      }
    } catch (err) {
      console.warn('Python agent server (pharmacist) is unreachable, falling back to direct Gemini call:', err);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Fallback: fetch pharmacy context and use Gemini directly
    const { data: inventory } = await supabase
      .from('medicine_inventory')
      .select('*');

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .in('status', ['pushed_to_pharma', 'alternative_requested', 'pending_check']);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    // Format inventory
    const inventoryStr = (inventory || []).map(item => {
      const status = item.current_stock <= item.reorder_threshold ? 'LOW STOCK' : 'OK';
      return `- ${item.medicine_name}: ${item.current_stock} units (reorder at ${item.reorder_threshold}) [${status}]`;
    }).join('\n');

    // Format pending prescriptions
    const rxStr = (prescriptions || []).map(rx => {
      const patient = (profiles || []).find(p => p.id === rx.patient_id);
      const patientName = patient ? patient.full_name : 'Unknown Patient';
      return `- [${rx.status}] Patient: ${patientName}, ID: ${rx.id}`;
    }).join('\n');

    const systemInstruction = `You are the AI pharmacy assistant for the hospital pharmacy panel.
You help the pharmacist manage inventory, fulfill prescription orders, restock medicines, and handle stock alerts.
You speak like a friendly, efficient colleague — brief and action-oriented.

Current Medicine Inventory:
${inventoryStr || 'No inventory data available.'}

Pending Prescription Orders:
${rxStr || 'No pending prescriptions.'}

Guidelines:
1. Be concise, friendly, and practical.
2. When asked about stock, summarize the key points (especially low-stock items).
3. When asked to fulfill or restock, confirm the action clearly.
4. No markdown tables or long dumps unless the user explicitly requests them.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const contents = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error (pharmacist):', errorText);
      return res.status(500).json({ message: `Gemini API returned error: ${response.status}` });
    }

    const resData = await response.json();
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // Extract navigation actions from message
    let action: any = undefined;
    const msgLower = message.toLowerCase();

    const routeMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'doctor portal': 'dashboard',
      'doctor dashboard': 'dashboard',
      'prescriptions': 'prescriptions',
      'patients': 'patients',
      'schedule': 'schedule',
      'pharmacy': 'pharmacy',
    };

    const navPrefixes = ['go to', 'navigate to', 'open', 'show', 'switch to', 'take me to'];
    for (const prefix of navPrefixes) {
      if (msgLower.includes(prefix)) {
        const afterPrefix = msgLower.split(prefix).pop()?.trim() || '';
        for (const [keyword, route] of Object.entries(routeMap)) {
          if (afterPrefix.includes(keyword)) {
            action = { type: 'navigate', route };
            break;
          }
        }
        if (action) break;
      }
    }

    res.json({ reply: replyText, action });
  } catch (err: any) {
    console.error('Pharmacist chat error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJcg' } = req.body; // Default Adam voice
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ message: 'ELEVENLABS_API_KEY is not configured' });
    }

    const response = await globalThis.fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Usually faster and better
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs API error:', errText);
      return res.status(response.status).json({ message: 'Error from ElevenLabs API' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked'
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
