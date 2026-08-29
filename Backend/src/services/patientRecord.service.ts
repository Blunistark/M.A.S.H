import { supabase } from '../config/supabase';
import { summarizeMedicalHistory } from './gemini.service';

export async function createPatientRecordFromHistory(
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
