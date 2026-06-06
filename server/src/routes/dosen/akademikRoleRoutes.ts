import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
import { AkademikRoleController } from '../../controllers/AkademikRoleController';

const router = Router();
const controller = new AkademikRoleController();

// Endpoint untuk Kajur (Ketua Jurusan)
router.get('/jurusan/kegiatan', asyncHandler(controller.getJurusanActivities));
router.get('/jurusan/stats', asyncHandler(controller.getJurusanSummaryStats));

// Endpoint untuk Kaprodi (Ketua Program Studi)
router.get('/prodi/kegiatan', asyncHandler(controller.getProdiActivities));
router.get('/prodi/stats', asyncHandler(controller.getProdiSummaryStats));

export default router;
