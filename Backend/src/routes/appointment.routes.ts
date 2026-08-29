import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  completePatientAppointments
} from '../controllers/appointment.controller';

const router = Router();

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id', updateAppointment);
router.patch('/appointments/patient/:patientId/complete', completePatientAppointments);

export default router;
