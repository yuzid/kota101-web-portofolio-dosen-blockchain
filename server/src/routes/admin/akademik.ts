import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
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
router.post('/jurusan', asyncHandler(akademikController.createJurusan));
router.patch('/jurusan/:id', asyncHandler(akademikController.updateJurusan));
router.delete('/jurusan/:id', asyncHandler(akademikController.deleteJurusan));

// PRODI
router.get('/prodi', asyncHandler(akademikController.getAllProdi));
router.get('/prodi/:id', asyncHandler(akademikController.getProdiById));
router.post('/prodi', asyncHandler(akademikController.createProdi));
router.patch('/prodi/:id', asyncHandler(akademikController.updateProdi));
router.delete('/prodi/:id', asyncHandler(akademikController.deleteProdi));

export default router;
