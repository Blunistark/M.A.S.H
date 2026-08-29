import { Router } from 'express';
import { signup, login, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/logout', logout);

export default router;
