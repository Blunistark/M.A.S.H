import { Router } from 'express';
import { doctorChat, patientChat, pharmacistChat } from '../controllers/chat.controller';

const router = Router();

router.post('/doctor-chat', doctorChat);
router.post('/patient-chat', patientChat);
router.post('/pharmacist-chat', pharmacistChat);

export default router;
