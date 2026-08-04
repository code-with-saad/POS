import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../controllers/organizationController.js';

const router = Router();

// Only superadmin can manage/view organizations
router.use(protect, requireRole('superadmin'));

router.get('/', getOrganizations);
router.post('/', createOrganization);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export default router;
