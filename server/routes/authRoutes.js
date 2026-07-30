import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', protect, me);

export default router;
