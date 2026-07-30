import { Router } from 'express';
import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../controllers/tableController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/', getTables);
router.patch('/:id/status', updateTableStatus);

router.post('/', requireRole('admin'), createTable);
router.put('/:id', requireRole('admin'), updateTable);
router.delete('/:id', requireRole('admin'), deleteTable);

export default router;
