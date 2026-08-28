import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { supabase } from './config/supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENTS_URL = process.env.AGENTS_URL || (process.env.RENDER === 'true' ? 'https://m-a-s-h-agents.onrender.com' : 'http://127.0.0.1:8000');

app.use(cors());
app.use(express.json());

// ─── Medical History AI Summarization Helper ───────────────────────────────
async function summarizeMedicalHistory(rawText: string): Promise<{
  conditions: string[];
  allergies: string[];
  surgeries: string[];
  medications: string[];
  family_history: string[];
  summary: string;
}> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not set, returning raw text as summary');
    return {
      conditions: [],
      allergies: [],
      surgeries: [],
      medications: [],
      family_history: [],
      summary: rawText
    };
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;

  const prompt = `You are a medical data extraction assistant. A patient has described their medical history in plain text. Extract and structure the information into the following JSON format. Be thorough but concise. If a category has no relevant information, use an empty array.

Patient's input:
"""
${rawText}
"""

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "conditions": ["list of medical conditions/diagnoses"],
  "allergies": ["list of allergies"],
  "surgeries": ["list of surgeries with year if mentioned"],
  "medications": ["list of current medications with dosage if mentioned"],
  "family_history": ["list of family medical history items"],
  "summary": "A brief 2-3 sentence clinical summary of the patient's medical history"
}`;

  try {
    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini summarization error:', errText);
      return {
        conditions: [],
        allergies: [],
        surgeries: [],
        medications: [],
        family_history: [],
        summary: rawText
      };
    }

    const resData = await response.json();
    const text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse the JSON response, handling potential markdown code fences
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      conditions: parsed.conditions || [],
      allergies: parsed.allergies || [],
      surgeries: parsed.surgeries || [],
      medications: parsed.medications || [],
      family_history: parsed.family_history || [],
      summary: parsed.summary || rawText
    };
  } catch (err) {
    console.error('Failed to summarize medical history with Gemini:', err);
    return {
      conditions: [],
      allergies: [],
      surgeries: [],
      medications: [],
      family_history: [],
      summary: rawText
    };
  }
}

async function createPatientRecordFromHistory(
  patientId: string,
  rawText: string,
  appointmentId?: string,
  createdBy?: string
): Promise<{ success: boolean; record?: any; error?: string }> {
  try {
    const aiSummary = await summarizeMedicalHistory(rawText);

    const doctorReport = {
      ai_intake_summary: aiSummary,
      raw_patient_input: rawText,
      source: appointmentId ? 'post_visit' : 'registration',
      summarized_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('patient_records')
      .insert({
        patient_id: patientId,
        appointment_id: appointmentId || null,
        doctor_report: doctorReport,
        prescription_id: null,
        medical_tests: [],
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting patient record:', error);
      return { success: false, error: error.message };
    }

    return { success: true, record: data };
  } catch (err: any) {
    console.error('Error creating patient record from history:', err);
    return { success: false, error: err.message };
  }
}

// Routes

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, contact_number, medical_history } = req.body;
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

    // If patient provided medical history, summarize it with AI and store in patient_records
    let patientRecord = null;
    if (medical_history && medical_history.trim().length > 0) {
      console.log(`[Signup] Processing medical history for ${full_name} (${authUser.id})...`);
      const result = await createPatientRecordFromHistory(authUser.id, medical_history);
      if (result.success) {
        patientRecord = result.record;
        console.log(`[Signup] Medical history summarized and stored for ${full_name}`);
      } else {
        console.warn(`[Signup] Failed to store medical history: ${result.error}`);
      }
    }

    res.status(201).json({
      user: authUser,
      profile,
      session: data.session,
      patientRecord,
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
    if (profileErr || !userProfile) {
      console.warn('Profile not found, attempting to create one:', profileErr?.message);
      const { data: newProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || email.split('@')[0],
            role: 'patient',
          }
        ])
        .select()
        .single();
      if (insertErr) {
        console.warn('Profile insert failed:', insertErr.message);
      }
      // Use created profile, or construct a minimal one from auth data as fallback
      userProfile = newProfile ?? {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || email.split('@')[0],
        role: 'patient',
      };
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
    const { doctor_id } = req.query;

    // Today's date range in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Today's appointments count
    let todayQuery = supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_time', todayStart.toISOString())
      .lte('scheduled_time', todayEnd.toISOString());

    // Remaining appointments count (scheduled, today only)
    let remainingQuery = supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_time', todayStart.toISOString())
      .lte('scheduled_time', todayEnd.toISOString());

    // Pending alternative medicine requests count (prescriptions with status 'alternative_requested')
    let altMedQuery = supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'alternative_requested');

    if (doctor_id) {
      todayQuery = todayQuery.eq('doctor_id', doctor_id);
      remainingQuery = remainingQuery.eq('doctor_id', doctor_id);
      altMedQuery = altMedQuery.eq('doctor_id', doctor_id);
    }

    const { count: todayCount, error: todayErr } = await todayQuery;
    const { count: remainingCount, error: remainingErr } = await remainingQuery;
    const { count: altMedCount, error: altMedErr } = await altMedQuery;

    // Stock alerts count (current_stock <= reorder_threshold)
    // Supabase JS doesn't support complex column-to-column comparisons directly via filters,
    // so we can fetch and filter or run a RPC. To keep it simple and clean:
    const { data: inventory, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('current_stock, reorder_threshold');

    const stockAlertsCount = inventory
      ? inventory.filter(m => m.current_stock <= m.reorder_threshold).length
      : 0;

    if (todayErr || remainingErr || altMedErr || invErr) {
      return res.status(500).json({ message: 'Error fetching metrics from database' });
    }

    res.json({
      todayAppointmentsCount: todayCount || 0,
      remainingAppointmentsCount: remainingCount || 0,
      pendingAlternativeMedCount: altMedCount || 0,
      pendingReschedulesCount: altMedCount || 0, // kept for backward compatibility
      notificationsCount: altMedCount || 0, // sync notifications to pending requests count
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
    const { full_name, contact_number, medical_history } = req.body;
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

    // If patient provided medical history, summarize with AI and store
    if (medical_history && medical_history.trim().length > 0) {
      console.log(`[Profile Create] Processing medical history for ${full_name} (${newId})...`);
      const result = await createPatientRecordFromHistory(newId, medical_history);
      if (result.success) {
        console.log(`[Profile Create] Medical history summarized and stored for ${full_name}`);
      } else {
        console.warn(`[Profile Create] Failed to store medical history: ${result.error}`);
      }
    }

    res.status(201).json(profile);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// POST /api/patient-records/from-history
app.post('/api/patient-records/from-history', async (req, res) => {
  try {
    const { patient_id, raw_medical_history } = req.body;
    if (!patient_id || !raw_medical_history) {
      return res.status(400).json({ message: 'patient_id and raw_medical_history are required' });
    }

    console.log(`[Patient Records] Summarizing medical history for patient ${patient_id}...`);
    const result = await createPatientRecordFromHistory(patient_id, raw_medical_history);

    if (!result.success) {
      return res.status(500).json({ message: result.error || 'Failed to create patient record' });
    }

    console.log(`[Patient Records] Successfully stored AI-summarized medical history`);
    res.status(201).json(result.record);
  } catch (err: any) {
    console.error('Error in /api/patient-records/from-history:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// GET /api/patient-records/:patientId
app.get('/api/patient-records/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { data, error } = await supabase
      .from('patient_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
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
    const { doctor_id, patient_id } = req.query;
    let query = supabase.from('appointments').select('*');
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    const { data, error } = await query;
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

    // Auto-create patient_records for each completed appointment
    const completedAppointments = data || [];
    for (const appt of completedAppointments) {
      try {
        // Find the most recent prescription for this patient from this visit
        const { data: recentRx } = await supabase
          .from('prescriptions')
          .select('id, doctor_comments, doctor_id')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch prescription items if a prescription exists
        let prescriptionDetails: any[] = [];
        if (recentRx) {
          const { data: rxItems } = await supabase
            .from('prescription_items')
            .select('dosage, quantity, medicine_id')
            .eq('prescription_id', recentRx.id);

          if (rxItems && rxItems.length > 0) {
            // Resolve medicine names
            const { data: inventory } = await supabase
              .from('medicine_inventory')
              .select('id, medicine_name');

            prescriptionDetails = rxItems.map(item => {
              const med = (inventory || []).find(m => m.id === item.medicine_id);
              return {
                medicine: med ? med.medicine_name : 'Unknown',
                dosage: item.dosage,
                quantity: item.quantity
              };
            });
          }
        }

        const visitReport = {
          visit_date: appt.scheduled_time,
          source: 'post_visit',
          doctor_comments: recentRx?.doctor_comments || null,
          prescriptions_given: prescriptionDetails,
          completed_at: new Date().toISOString()
        };

        const { error: prErr } = await supabase
          .from('patient_records')
          .insert({
            patient_id: patientId,
            appointment_id: appt.id,
            doctor_report: visitReport,
            prescription_id: recentRx?.id || null,
            medical_tests: [],
            created_by: appt.doctor_id
          });

        if (prErr) {
          console.warn(`[Appointment Complete] Failed to create patient record for appointment ${appt.id}:`, prErr.message);
        } else {
          console.log(`[Appointment Complete] Created patient record for appointment ${appt.id}`);
        }
      } catch (prError) {
        console.warn(`[Appointment Complete] Error creating patient record:`, prError);
      }
    }

    res.json(completedAppointments);
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

    // 5. Notify agent server so StockManagementAgent tracks usage and deducts Supabase stock
    try {
      globalThis.fetch(`${AGENTS_URL}/api/prescription-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id, items })
      }).catch(() => {}); // fire-and-forget — don't block response
    } catch (_) {}

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
    const { message, history, doctorId, doctorName } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/doctor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history, doctorId, doctorName })
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

    // 1. Fetch today's appointments for Dr. Smith
    const fbTodayStart = new Date();
    fbTodayStart.setUTCHours(0, 0, 0, 0);
    const fbTodayEnd = new Date();
    fbTodayEnd.setUTCHours(23, 59, 59, 999);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd')
      .gte('scheduled_time', fbTodayStart.toISOString())
      .lte('scheduled_time', fbTodayEnd.toISOString());

    // 2. Fetch profiles to match patient names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    // 3. Fetch medical records and patient_records (AI intake & visit summaries)
    const [{ data: medicalRecords }, { data: patientRecords }] = await Promise.all([
      supabase.from('medical_records').select('*'),
      supabase.from('patient_records').select('*')
    ]);

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

    // Format medical records from both medical_records and patient_records
    const legacyRecordsStr = (medicalRecords || []).map(record => {
      const patient = (profiles || []).find(p => p.id === record.patient_id);
      if (!patient) return null;
      let desc = record.description;
      return `- Patient: ${patient.full_name}, Record Type: ${record.record_type}, Details: ${desc}`;
    }).filter(Boolean);

    const patientRecordsStr = (patientRecords || []).map(record => {
      const patient = (profiles || []).find(p => p.id === record.patient_id);
      if (!patient) return null;
      const report = record.doctor_report || {};
      const intake = report.ai_intake_summary || {};
      const parts = [];
      if (intake.summary) parts.push(`Summary: ${intake.summary}`);
      if (intake.conditions?.length) parts.push(`Conditions: ${intake.conditions.join(', ')}`);
      if (intake.medications?.length) parts.push(`Medications: ${intake.medications.join(', ')}`);
      if (intake.allergies?.length) parts.push(`Allergies: ${intake.allergies.join(', ')}`);
      if (intake.family_history?.length) parts.push(`Family History: ${intake.family_history.join(', ')}`);
      if (intake.surgeries?.length) parts.push(`Surgeries: ${intake.surgeries.join(', ')}`);
      if (report.source === 'post_visit') {
        parts.push(`Visit Notes: ${report.doctor_comments || 'N/A'}`);
      }
      return `- Patient: ${patient.full_name}, Medical History (patient_records): ${parts.join(' | ')}`;
    }).filter(Boolean);

    const recordsStr = [...legacyRecordsStr, ...patientRecordsStr].join('\n');

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

    // Check for prescription writing intent
    const prescriptionPatterns = [
      /(?:write|create|send)\s+(?:a\s+)?prescription\s+(?:to|for)\s+(.+?)(?:\s+|$)/i,
      /prescribe\s+(?:.+?)\s+(?:to|for)\s+(.+?)(?:\s+|$)/i,
      /prescription\s+(?:to|for)\s+(.+?)(?:\s+|$)/i
    ];

    let extractedName: string | null = null;
    let isPrescriptionIntent = false;

    for (const pattern of patientNavPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        extractedName = match[1].trim();
        break;
      }
    }

    if (!extractedName) {
      for (const pattern of prescriptionPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          extractedName = match[1].trim();
          isPrescriptionIntent = true;
          break;
        }
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
        action = {
          type: 'navigate',
          route: isPrescriptionIntent ? 'prescriptions' : 'patient-profile',
          patientId: bestMatch.id
        };
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

// POST /api/patient-chat
app.post('/api/patient-chat', async (req, res) => {
  try {
    const { message, history, patientId, patientName } = req.body;
    console.log(`[Patient Chat API] Received message. AGENTS_URL=${AGENTS_URL}, patientId=${patientId}`);
    if (!message) {
      console.log(`[Patient Chat API] Rejected: message is missing`);
      return res.status(400).json({ message: 'Message is required' });
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/patient-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history, patientId, patientName })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python PatientAgent received successfully.');
        return res.json({ reply: agentData.reply, action: agentData.action });
      } else {
        const errorData = (await agentResponse.json().catch(() => ({}))) as { detail?: string };
        console.warn('Python agent server (patient) returned non-ok status:', agentResponse.status, errorData);
        return res.status(agentResponse.status).json({ message: errorData.detail || 'Error from patient agent server' });
      }
    } catch (err) {
      console.warn('Python agent server (patient) is unreachable:', err);
      return res.status(503).json({ message: 'Patient agent server is unreachable' });
    }
  } catch (err: any) {
    console.error('Patient Chat error:', err);
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
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/pharmacist-chat`, {
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

// POST /api/tts - uses Sarvam AI text-to-speech
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (!process.env.SARVAM_API_KEY) {
      return res.status(500).json({ message: 'SARVAM_API_KEY is not configured' });
    }

    const response = await globalThis.fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [text.substring(0, 500)],
        target_language_code: 'en-IN',
        speaker: 'anushka',
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Sarvam API error:', errText);
      return res.status(response.status).json({ message: 'Error from Sarvam API', details: errText });
    }

    interface SarvamResponse {
      audios: string[];
    }
    const resData = (await response.json()) as SarvamResponse;
    if (!resData.audios || resData.audios.length === 0) {
      return res.status(500).json({ message: 'No audio returned from Sarvam API' });
    }

    const audioBase64 = resData.audios[0];
    const buffer = Buffer.from(audioBase64, 'base64');

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString()
    });
    res.send(buffer);
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// GET /api/telemetry/state
app.get('/api/telemetry/state', async (req, res) => {
  try {
    const { doctorId, doctorName } = req.query;
    const urlParams = doctorId && doctorName
      ? `?doctorId=${encodeURIComponent(doctorId as string)}&doctorName=${encodeURIComponent(doctorName as string)}`
      : '';
    const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/telemetry/state${urlParams}`);
    if (agentResponse.ok) {
      const data = await agentResponse.json();
      return res.json(data);
    } else {
      return res.status(agentResponse.status).json({ message: 'Error from agents server' });
    }
  } catch (err: any) {
    console.error('Error fetching telemetry state from python server:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (clientWs, req) => {
  const targetBaseUrl = AGENTS_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  const targetWs = new WSWebSocket(`${targetBaseUrl}/api/telemetry-stream`);

  targetWs.on('open', () => {
    clientWs.on('message', (message, isBinary) => {
      if (targetWs.readyState === WSWebSocket.OPEN) {
        targetWs.send(message, { binary: isBinary });
      }
    });

    targetWs.on('message', (message, isBinary) => {
      if (clientWs.readyState === WSWebSocket.OPEN) {
        clientWs.send(message, { binary: isBinary });
      }
    });
  });

  clientWs.on('close', () => {
    targetWs.close();
  });

  targetWs.on('close', () => {
    clientWs.close();
  });

  clientWs.on('error', (err) => {
    console.error('Client WS error:', err);
    targetWs.close();
  });

  targetWs.on('error', (err) => {
    console.error('Target WS error:', err);
    clientWs.close();
  });
});

// Proxy websocket connections to Python agents server
server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/api/telemetry-stream')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});
