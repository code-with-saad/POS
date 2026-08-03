import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  getInventory,
  createInventory,
  updateInventory,
  adjustStock,
  deleteInventory,
} from '../controllers/inventoryController.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/', getInventory);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.patch('/:id/stock', adjustStock);
router.delete('/:id', deleteInventory);

export default router;
