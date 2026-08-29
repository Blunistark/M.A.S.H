import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export async function getDoctorDetails(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('doctor_details').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
