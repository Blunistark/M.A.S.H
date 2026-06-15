"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./config/supabase");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
// GET /api/metrics
app.get('/api/metrics', async (req, res) => {
    try {
        // Today's appointments count
        const { count: todayCount, error: todayErr } = await supabase_1.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true });
        // Remaining appointments count (scheduled)
        const { count: remainingCount, error: remainingErr } = await supabase_1.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'scheduled');
        // Stock alerts count (current_stock <= reorder_threshold)
        // Supabase JS doesn't support complex column-to-column comparisons directly via filters,
        // so we can fetch and filter or run a RPC. To keep it simple and clean:
        const { data: inventory, error: invErr } = await supabase_1.supabase
            .from('medicine_inventory')
            .select('current_stock, reorder_threshold');
        const stockAlertsCount = inventory
            ? inventory.filter(m => m.current_stock <= m.reorder_threshold).length
            : 0;
        if (todayErr || remainingErr || invErr) {
            return res.status(500).json({ message: 'Error fetching metrics from database' });
        }
        res.json({
            todayAppointmentsCount: todayCount || 0,
            remainingAppointmentsCount: remainingCount || 0,
            pendingReschedulesCount: 3, // mocked
            notificationsCount: 8, // mocked
            stockAlertsCount
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('profiles').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/profiles/:id
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('profiles').select('*').eq('id', req.params.id).single();
        if (error) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/doctor_details
app.get('/api/doctor_details', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('doctor_details').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('appointments').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
    try {
        const { patient_id, doctor_id, scheduled_time, status } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('appointments')
            .insert([{ patient_id, doctor_id, scheduled_time, status }])
            .select()
            .single();
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// PATCH /api/appointments/patient/:patientId/complete
app.patch('/api/appointments/patient/:patientId/complete', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { data, error } = await supabase_1.supabase
            .from('appointments')
            .update({ status: 'completed' })
            .eq('patient_id', patientId)
            .eq('status', 'scheduled')
            .select();
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /api/prescriptions/send-to-pharmacy
app.post('/api/prescriptions/send-to-pharmacy', async (req, res) => {
    try {
        const { patient_id, doctor_id, items, doctor_comments } = req.body;
        if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'patient_id and items[] are required' });
        }
        // 1. Create the prescription with status 'pushed_to_pharma'
        const { data: rx, error: rxErr } = await supabase_1.supabase
            .from('prescriptions')
            .insert({
            patient_id,
            doctor_id: doctor_id || 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd',
            status: 'pushed_to_pharma',
            doctor_comments: doctor_comments || null
        })
            .select()
            .single();
        if (rxErr)
            throw rxErr;
        // 2. Fetch inventory to resolve medicine names → IDs
        const { data: inventory, error: invErr } = await supabase_1.supabase
            .from('medicine_inventory')
            .select('id, medicine_name');
        if (invErr)
            throw invErr;
        // 3. Create prescription items
        const prescriptionItems = items.map((item) => {
            const med = (inventory || []).find((m) => m.medicine_name.toLowerCase() === item.name.toLowerCase());
            return {
                prescription_id: rx.id,
                medicine_id: med ? med.id : null,
                dosage: `${item.dosage} - ${item.frequency}`,
                quantity: item.quantity || item.duration || 7
            };
        });
        const { error: itemsErr } = await supabase_1.supabase
            .from('prescription_items')
            .insert(prescriptionItems);
        if (itemsErr)
            throw itemsErr;
        // 4. Also update any existing active prescription for this patient to 'completed'
        await supabase_1.supabase
            .from('prescriptions')
            .update({ status: 'completed' })
            .eq('patient_id', patient_id)
            .eq('status', 'active')
            .neq('id', rx.id);
        res.status(201).json(rx);
    }
    catch (err) {
        console.error('Error creating pharmacy prescription:', err);
        res.status(500).json({ message: err.message || 'Internal server error' });
    }
});
// GET /api/pharmacy
app.get('/api/pharmacy', async (req, res) => {
    try {
        const { data: prescriptions, error: rxErr } = await supabase_1.supabase
            .from('prescriptions')
            .select('*');
        if (rxErr)
            throw rxErr;
        const { data: items, error: itemsErr } = await supabase_1.supabase
            .from('prescription_items')
            .select('*');
        if (itemsErr)
            throw itemsErr;
        const { data: inventory, error: invErr } = await supabase_1.supabase
            .from('medicine_inventory')
            .select('*');
        if (invErr)
            throw invErr;
        const { data: profiles, error: profErr } = await supabase_1.supabase
            .from('profiles')
            .select('*');
        if (profErr)
            throw profErr;
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
    }
    catch (err) {
        console.error('Error fetching pharmacy aggregated data:', err);
        res.status(500).json({ message: err.message || 'Internal server error' });
    }
});
// PATCH /api/prescriptions/:id/fulfill
app.patch('/api/prescriptions/:id/fulfill', async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Get prescription items to deduct stock
        const { data: items, error: itemsErr } = await supabase_1.supabase
            .from('prescription_items')
            .select('medicine_id, quantity')
            .eq('prescription_id', id);
        if (itemsErr)
            throw itemsErr;
        // 2. Deduct stock for each item in inventory
        if (items) {
            for (const item of items) {
                if (item.medicine_id && item.quantity) {
                    // Fetch current stock
                    const { data: inv, error: invFetchErr } = await supabase_1.supabase
                        .from('medicine_inventory')
                        .select('current_stock')
                        .eq('id', item.medicine_id)
                        .single();
                    if (!invFetchErr && inv) {
                        const newStock = Math.max(0, inv.current_stock - item.quantity);
                        await supabase_1.supabase
                            .from('medicine_inventory')
                            .update({ current_stock: newStock, last_updated: new Date().toISOString() })
                            .eq('id', item.medicine_id);
                    }
                }
            }
        }
        // 3. Update prescription status to fulfilled
        const { data, error } = await supabase_1.supabase
            .from('prescriptions')
            .update({ status: 'fulfilled' })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// PATCH /api/prescriptions/:id/alternative
app.patch('/api/prescriptions/:id/alternative', async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('prescriptions')
            .update({ status: 'alternative_requested', doctor_comments: comments })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// PATCH /api/medicine_inventory/:id/restock
app.patch('/api/medicine_inventory/:id/restock', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        // Fetch current stock
        const { data: inv, error: invErr } = await supabase_1.supabase
            .from('medicine_inventory')
            .select('current_stock')
            .eq('id', id)
            .single();
        if (invErr) {
            return res.status(500).json({ message: invErr.message });
        }
        const newStock = (inv.current_stock || 0) + (amount || 100);
        const { data, error } = await supabase_1.supabase
            .from('medicine_inventory')
            .update({ current_stock: newStock, last_updated: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/medical_records
app.get('/api/medical_records', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('medical_records').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/prescriptions
app.get('/api/prescriptions', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('prescriptions').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/prescription_items
app.get('/api/prescription_items', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('prescription_items').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// GET /api/medicine_inventory
app.get('/api/medicine_inventory', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('medicine_inventory').select('*');
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
