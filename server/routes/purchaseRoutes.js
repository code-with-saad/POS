import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getPurchases, createPurchase, resetBook } from '../controllers/purchaseController.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/', getPurchases);
router.post('/', createPurchase);
router.post('/reset-book', resetBook);

export default router;
