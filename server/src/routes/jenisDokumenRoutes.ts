import { Router } from 'express';
import { asyncHandler } from '../middleware/authMiddleware';
import { JenisDokumenController } from '../controllers/JenisDokumenController';

const router = Router();
const controller = new JenisDokumenController();

// GET /api/jenis-dokumen
router.get('/', asyncHandler(controller.getAll));

export default router;
