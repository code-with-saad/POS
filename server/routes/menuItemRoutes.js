import { Router } from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} from '../controllers/menuItemController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/', getMenuItems);
router.post('/', requireRole('admin'), createMenuItem);
router.put('/:id', requireRole('admin'), updateMenuItem);
router.patch('/:id/availability', requireRole('admin'), toggleAvailability);
router.delete('/:id', requireRole('admin'), deleteMenuItem);

export default router;
