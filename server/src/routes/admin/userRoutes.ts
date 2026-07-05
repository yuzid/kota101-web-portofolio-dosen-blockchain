import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
import { AdminUserController } from '../../controllers/AdminUserController';
import { AdminUserService } from '../../services/AdminUserService';
import { UserRepository } from '../../repositories/UserRepository';

const router = Router();

const userRepository = new UserRepository();
const adminUserService = new AdminUserService(userRepository);
const adminUserController = new AdminUserController(adminUserService);

router.get('/', asyncHandler(adminUserController.getAllUsers));
router.get('/:id', asyncHandler(adminUserController.getUserById));
router.post('/', asyncHandler(adminUserController.createUser));
router.patch('/:id', asyncHandler(adminUserController.updateUser));
router.patch('/:id/status', asyncHandler(adminUserController.updateUserStatus));
router.delete('/:id', asyncHandler(adminUserController.deleteUser));

export default router;
