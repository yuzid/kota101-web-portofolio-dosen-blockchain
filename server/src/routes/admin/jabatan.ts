import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
import { JabatanController } from '../../controllers/JabatanController';
import { JabatanService } from '../../services/JabatanService';
import { JabatanRepository } from '../../repositories/JabatanRepository';
import { UserRepository } from '../../repositories/UserRepository';

const router = Router();

const jabatanRepository = new JabatanRepository();
const userRepository = new UserRepository();
const jabatanService = new JabatanService(jabatanRepository, userRepository);
const jabatanController = new JabatanController(jabatanService);

// KAJUR
router.get('/kajur', asyncHandler(jabatanController.getAllKajur));
router.post('/kajur', asyncHandler(jabatanController.createKajur));
router.patch('/kajur/:id', asyncHandler(jabatanController.updateKajur));
router.delete('/kajur/:id', asyncHandler(jabatanController.deleteKajur));

// KAPRODI
router.get('/kaprodi', asyncHandler(jabatanController.getAllKaprodi));
router.post('/kaprodi', asyncHandler(jabatanController.createKaprodi));
router.patch('/kaprodi/:id', asyncHandler(jabatanController.updateKaprodi));
router.delete('/kaprodi/:id', asyncHandler(jabatanController.deleteKaprodi));

export default router;
