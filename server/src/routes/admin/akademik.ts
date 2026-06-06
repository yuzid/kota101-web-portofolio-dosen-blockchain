import { Router } from 'express';
import { asyncHandler, requireRole } from '../../middleware/authMiddleware';
import { AkademikController } from '../../controllers/AkademikController';
import { AkademikService } from '../../services/AkademikService';
import { AkademikRepository } from '../../repositories/AkademikRepository';

const router = Router();

const akademikRepository = new AkademikRepository();
const akademikService = new AkademikService(akademikRepository);
const akademikController = new AkademikController(akademikService);

// JURUSAN
router.get('/jurusan', asyncHandler(akademikController.getAllJurusan));
router.get('/jurusan/:id', asyncHandler(akademikController.getJurusanById));
router.post('/jurusan', requireRole(['admin']), asyncHandler(akademikController.createJurusan));
router.patch('/jurusan/:id', requireRole(['admin']), asyncHandler(akademikController.updateJurusan));
router.delete('/jurusan/:id', requireRole(['admin']), asyncHandler(akademikController.deleteJurusan));

// PRODI
router.get('/prodi', asyncHandler(akademikController.getAllProdi));
router.get('/prodi/:id', asyncHandler(akademikController.getProdiById));
router.post('/prodi', requireRole(['admin']), asyncHandler(akademikController.createProdi));
router.patch('/prodi/:id', requireRole(['admin']), asyncHandler(akademikController.updateProdi));
router.delete('/prodi/:id', requireRole(['admin']), asyncHandler(akademikController.deleteProdi));

export default router;
