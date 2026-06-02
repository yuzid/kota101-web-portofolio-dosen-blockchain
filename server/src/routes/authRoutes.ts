import { Router } from 'express';
import { asyncHandler } from '../middleware/authMiddleware';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/login', asyncHandler(authController.login));
router.post('/google-login', asyncHandler(authController.googleLogin));

export default router;
