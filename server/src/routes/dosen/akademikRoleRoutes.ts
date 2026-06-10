import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
import { AkademikRoleController } from '../../controllers/AkademikRoleController';

const router = Router();
const controller = new AkademikRoleController();

// Endpoint untuk Kajur (Ketua Jurusan)
router.get('/jurusan/kegiatan', asyncHandler(controller.getJurusanActivities));
router.get('/jurusan/stats', asyncHandler(controller.getJurusanSummaryStats));
router.post('/jurusan/rekap', asyncHandler(controller.createJurusanRekap));
router.get('/jurusan/rekap', asyncHandler(controller.getJurusanRekaps));
router.get('/jurusan/rekap/:id', asyncHandler(controller.getRekapDetail));
router.put('/jurusan/rekap/:id', asyncHandler(controller.updateRekap));
router.delete('/jurusan/rekap/:id', asyncHandler(controller.deleteRekap));

// Endpoint untuk Kaprodi (Ketua Program Studi)
router.get('/prodi/kegiatan', asyncHandler(controller.getProdiActivities));
router.get('/prodi/stats', asyncHandler(controller.getProdiSummaryStats));
router.post('/prodi/rekap', asyncHandler(controller.createProdiRekap));
router.get('/prodi/rekap', asyncHandler(controller.getProdiRekaps));
router.get('/prodi/rekap/:id', asyncHandler(controller.getRekapDetail));
router.put('/prodi/rekap/:id', asyncHandler(controller.updateRekap));
router.delete('/prodi/rekap/:id', asyncHandler(controller.deleteRekap));

export default router;
