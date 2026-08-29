import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export async function getPharmacyData(req: Request, res: Response): Promise<void> {
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
}
