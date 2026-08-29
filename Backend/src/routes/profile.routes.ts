import { Router } from 'express';
import { getProfiles, getProfileById, createProfile } from '../controllers/profile.controller';

const router = Router();

router.get('/profiles', getProfiles);
router.get('/profiles/:id', getProfileById);
router.post('/profiles', createProfile);

export default router;
