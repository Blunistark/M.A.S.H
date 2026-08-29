import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { createPatientRecordFromHistory } from '../services/patientRecord.service';

export async function getProfiles(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getProfileById(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createProfile(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, contact_number, medical_history } = req.body;
    if (!full_name) {
      res.status(400).json({ message: 'Full name is required' });
      return;
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
      res.status(500).json({ message: profileErr.message });
      return;
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
}
