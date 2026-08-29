import { Router } from 'express';
import { getTelemetryState } from '../controllers/telemetry.controller';

const router = Router();

router.get('/telemetry/state', getTelemetryState);

export default router;
