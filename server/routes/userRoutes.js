import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// All user management routes require Admin privileges
router.use(protect, requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/reset-password', resetPassword);
router.delete('/:id', deleteUser);

export default router;
