import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getOrganizations, createOrganization } from '../controllers/organizationController.js';

const router = Router();

// Only superadmin can manage/view organizations
router.use(protect, requireRole('superadmin'));

router.get('/', getOrganizations);
router.post('/', createOrganization);

export default router;
