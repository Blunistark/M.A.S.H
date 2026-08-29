import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AGENTS_URL } from '../config/env';

export async function sendToPharmacy(req: Request, res: Response): Promise<void> {
  try {
    const { patient_id, doctor_id, items, doctor_comments } = req.body;

    console.log(`[Prescription API] Received: patient_id=${patient_id}, doctor_id=${doctor_id}, items=${JSON.stringify(items)}, comments=${doctor_comments}`);

    if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
      console.log(`[Prescription API] REJECTED: Missing patient_id or items`);
      res.status(400).json({ message: 'patient_id and items[] are required' });
      return;
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
}

export async function getPrescriptions(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('prescriptions').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getPrescriptionItems(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('prescription_items').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function fulfillPrescription(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function requestAlternative(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
