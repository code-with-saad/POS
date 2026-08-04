import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, recordSupplierPayment } from '../controllers/supplierController.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.post('/:id/payments', recordSupplierPayment);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
