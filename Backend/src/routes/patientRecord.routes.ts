import { Router } from 'express';
import { createFromHistory, getPatientRecords, getLegacyMedicalRecords } from '../controllers/patientRecord.controller';

const router = Router();

router.post('/patient-records/from-history', createFromHistory);
router.get('/patient-records/:patientId', getPatientRecords);
router.get('/medical_records', getLegacyMedicalRecords);

export default router;
