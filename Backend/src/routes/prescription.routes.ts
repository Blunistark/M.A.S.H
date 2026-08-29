import { Router } from 'express';
import {
  sendToPharmacy,
  getPrescriptions,
  getPrescriptionItems,
  fulfillPrescription,
  requestAlternative
} from '../controllers/prescription.controller';

const router = Router();

router.post('/prescriptions/send-to-pharmacy', sendToPharmacy);
router.get('/prescriptions', getPrescriptions);
router.get('/prescription_items', getPrescriptionItems);
router.patch('/prescriptions/:id/fulfill', fulfillPrescription);
router.patch('/prescriptions/:id/alternative', requestAlternative);

export default router;
