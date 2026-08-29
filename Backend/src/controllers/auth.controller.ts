import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { createPatientRecordFromHistory } from '../services/patientRecord.service';

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, full_name, contact_number, medical_history } = req.body;
    if (!email || !password || !full_name) {
      res.status(400).json({ message: 'Email, password and full name are required' });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const authUser = data.user;
    if (!authUser) {
      res.status(400).json({ message: 'Signup failed to create user' });
      return;
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
      res.status(500).json({ message: `Profile creation failed: ${profileErr.message}` });
      return;
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
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const authUser = data.user;
    if (!authUser) {
      res.status(400).json({ message: 'Login failed' });
      return;
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
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}
