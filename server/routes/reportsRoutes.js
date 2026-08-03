import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  getSummaryReport,
  getDailyReport,
  getItemsReport,
  getPaymentReport,
  getCashierReport,
} from '../controllers/reportsController.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/summary', getSummaryReport);
router.get('/daily', getDailyReport);
router.get('/items', getItemsReport);
router.get('/payment', getPaymentReport);
router.get('/cashier', getCashierReport);

export default router;
