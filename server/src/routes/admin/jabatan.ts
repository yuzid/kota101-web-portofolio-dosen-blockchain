import { Router } from 'express';
import { asyncHandler, requireRole } from '../../middleware/authMiddleware';
import { JabatanController } from '../../controllers/JabatanController';
import { JabatanService } from '../../services/JabatanService';
import { JabatanRepository } from '../../repositories/JabatanRepository';

const router = Router();

const jabatanRepository = new JabatanRepository();
const jabatanService = new JabatanService(jabatanRepository);
const jabatanController = new JabatanController(jabatanService);

// KAJUR
router.get('/kajur', asyncHandler(jabatanController.getAllKajur));
router.post('/kajur', asyncHandler(jabatanController.createKajur),requireRole(["admin"]));
router.patch('/kajur/:id', asyncHandler(jabatanController.updateKajur),requireRole(["admin"]));
router.delete('/kajur/:id', asyncHandler(jabatanController.deleteKajur),requireRole(["admin"]));

// KAPRODI
router.get('/kaprodi', asyncHandler(jabatanController.getAllKaprodi));
router.post('/kaprodi', asyncHandler(jabatanController.createKaprodi),requireRole(["admin"]));
router.patch('/kaprodi/:id', asyncHandler(jabatanController.updateKaprodi),requireRole(["admin"]));
router.delete('/kaprodi/:id', asyncHandler(jabatanController.deleteKaprodi),requireRole(["admin"]));

export default router;
