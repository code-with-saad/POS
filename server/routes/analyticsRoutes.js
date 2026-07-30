import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/dashboard — Admin only
router.get('/dashboard', protect, requireRole('admin'), getDashboardAnalytics);

export default router;
