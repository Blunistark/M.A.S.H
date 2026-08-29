import { Router } from 'express';
import { getPharmacyData } from '../controllers/pharmacy.controller';

const router = Router();

router.get('/pharmacy', getPharmacyData);

export default router;
