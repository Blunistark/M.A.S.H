import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export async function getInventory(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabase.from('medicine_inventory').select('*');
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function restockInventory(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: invErr.message });
      return;
    }

    const newStock = (inv.current_stock || 0) + (amount || 100);

    const { data, error } = await supabase
      .from('medicine_inventory')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
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
