import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export async function getMetrics(req: Request, res: Response): Promise<void> {
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
      todayQuery = todayQuery.eq('doctor_id', doctor_id as string);
      remainingQuery = remainingQuery.eq('doctor_id', doctor_id as string);
      altMedQuery = altMedQuery.eq('doctor_id', doctor_id as string);
    }

    const { count: todayCount, error: todayErr } = await todayQuery;
    const { count: remainingCount, error: remainingErr } = await remainingQuery;
    const { count: altMedCount, error: altMedErr } = await altMedQuery;

    // Stock alerts count (current_stock <= reorder_threshold)
    const { data: inventory, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('current_stock, reorder_threshold');

    const stockAlertsCount = inventory
      ? inventory.filter(m => m.current_stock <= m.reorder_threshold).length
      : 0;

    if (todayErr || remainingErr || altMedErr || invErr) {
      res.status(500).json({ message: 'Error fetching metrics from database' });
      return;
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
}
