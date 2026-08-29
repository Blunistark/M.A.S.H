import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export async function getAppointments(req: Request, res: Response): Promise<void> {
  try {
    const { doctor_id, patient_id } = req.query;
    let query = supabase.from('appointments').select('*');
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id as string);
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id as string);
    }
    const { data, error } = await query;
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createAppointment(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateAppointment(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function completePatientAppointments(req: Request, res: Response): Promise<void> {
  try {
    const { patientId } = req.params;
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('patient_id', patientId)
      .eq('status', 'scheduled')
      .select();

    if (error) {
      res.status(500).json({ message: error.message });
      return;
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
}
