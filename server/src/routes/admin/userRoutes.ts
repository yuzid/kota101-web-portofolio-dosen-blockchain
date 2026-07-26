import { Router } from 'express';
import { asyncHandler, requireRole } from '../../middleware/authMiddleware';
import { AdminUserController } from '../../controllers/AdminUserController';
import { AdminUserService } from '../../services/AdminUserService';
import { UserRepository } from '../../repositories/UserRepository';

const router = Router();

const userRepository = new UserRepository();
const adminUserService = new AdminUserService(userRepository);
const adminUserController = new AdminUserController(adminUserService);

router.get('/', asyncHandler(adminUserController.getAllUsers));
router.get('/:id', asyncHandler(adminUserController.getUserById));
router.post('/', requireRole(["admin"]), asyncHandler(adminUserController.createUser));
router.patch('/:id', requireRole(["admin"]), asyncHandler(adminUserController.updateUser));
router.patch('/:id/status', requireRole(["admin"]), asyncHandler(adminUserController.updateUserStatus));
router.delete('/:id', requireRole(["admin"]), asyncHandler(adminUserController.deleteUser));

export default router;
