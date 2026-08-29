import { Router } from 'express';
import authRoutes from './auth.routes';
import metricsRoutes from './metrics.routes';
import profileRoutes from './profile.routes';
import patientRecordRoutes from './patientRecord.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import prescriptionRoutes from './prescription.routes';
import inventoryRoutes from './inventory.routes';
import pharmacyRoutes from './pharmacy.routes';
import chatRoutes from './chat.routes';
import ttsRoutes from './tts.routes';
import telemetryRoutes from './telemetry.routes';

const router = Router();

router.use(authRoutes);
router.use(metricsRoutes);
router.use(profileRoutes);
router.use(patientRecordRoutes);
router.use(doctorRoutes);
router.use(appointmentRoutes);
router.use(prescriptionRoutes);
router.use(inventoryRoutes);
router.use(pharmacyRoutes);
router.use(chatRoutes);
router.use(ttsRoutes);
router.use(telemetryRoutes);

export default router;
