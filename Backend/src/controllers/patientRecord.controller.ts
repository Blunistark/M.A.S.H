import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { createPatientRecordFromHistory } from '../services/patientRecord.service';

export async function createFromHistory(req: Request, res: Response): Promise<void> {
  try {
    const { patient_id, raw_medical_history } = req.body;
    if (!patient_id || !raw_medical_history) {
      res.status(400).json({ message: 'patient_id and raw_medical_history are required' });
      return;
    }

    console.log(`[Patient Records] Summarizing medical history for patient ${patient_id}...`);
    const result = await createPatientRecordFromHistory(patient_id, raw_medical_history);

    if (!result.success) {
      res.status(500).json({ message: result.error || 'Failed to create patient record' });
      return;
    }

    console.log(`[Patient Records] Successfully stored AI-summarized medical history`);
    res.status(201).json(result.record);
  } catch (err: any) {
    console.error('Error in /api/patient-records/from-history:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getPatientRecords(req: Request, res: Response): Promise<void> {
  try {
    const { patientId } = req.params;
    const { data, error } = await supabase
      .from('patient_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getLegacyMedicalRecords(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('medical_records').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
