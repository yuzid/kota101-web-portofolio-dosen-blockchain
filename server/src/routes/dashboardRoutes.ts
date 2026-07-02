import { Router } from 'express';
import { asyncHandler, verifyToken } from '../middleware/authMiddleware';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();
const dashboardController = new DashboardController();

router.get('/staf-tu', verifyToken, asyncHandler(dashboardController.getStafTuDashboard));
router.get('/dosen', verifyToken, asyncHandler(dashboardController.getDosenDashboard));
router.get('/kaprodi', verifyToken, asyncHandler(dashboardController.getKaprodiDashboard));
router.get('/kajur', verifyToken, asyncHandler(dashboardController.getKajurDashboard));
router.get('/admin', verifyToken, asyncHandler(dashboardController.getAdminDashboard));

export default router;
