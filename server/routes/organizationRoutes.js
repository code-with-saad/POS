import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getOrganizations, createOrganization } from '../controllers/organizationController.js';

const router = Router();

// Allow superadmin or admin to manage/view organizations
router.use(protect, requireRole('superadmin', 'admin'));

router.get('/', getOrganizations);
router.post('/', createOrganization);

export default router;
