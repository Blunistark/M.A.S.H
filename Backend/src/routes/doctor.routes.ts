import { Router } from 'express';
import { getDoctorDetails } from '../controllers/doctor.controller';

const router = Router();

router.get('/doctor_details', getDoctorDetails);

export default router;
