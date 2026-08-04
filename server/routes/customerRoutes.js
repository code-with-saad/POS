import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  recordCustomerPayment,
} from '../controllers/customerController.js';

const router = Router();
router.use(protect);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id/orders', getCustomerOrders);
router.post('/:id/payments', recordCustomerPayment);
router.put('/:id', requireRole('admin'), updateCustomer);
router.delete('/:id', requireRole('admin'), deleteCustomer);

export default router;
