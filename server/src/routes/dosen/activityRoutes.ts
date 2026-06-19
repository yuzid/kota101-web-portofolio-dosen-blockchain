import { Router } from 'express';
import { asyncHandler } from '../../middleware/authMiddleware';
import { ActivityController } from '../../controllers/ActivityController';
import { ActivityService } from '../../services/ActivityService';
import { ActivityRepository } from '../../repositories/ActivityRepository';

const router = Router();

const activityRepository = new ActivityRepository();
const activityService = new ActivityService(activityRepository);
const activityController = new ActivityController(activityService);

router.get('/', asyncHandler(activityController.getAllActivities));
router.get('/stats/summary', asyncHandler(activityController.getSummaryStats));
router.get('/filter/tanpa-bukti', asyncHandler(activityController.getTanpaBukti));
router.get('/permintaan-konfirmasi', asyncHandler(activityController.getPendingConfirmations));
router.get('/:id/audit-trail', asyncHandler(activityController.getAuditTrail));
router.get('/:id', asyncHandler(activityController.getActivityById));
router.post('/', asyncHandler(activityController.createActivity));
router.put('/:id', asyncHandler(activityController.updateActivity));
router.delete('/:id', asyncHandler(activityController.deleteActivity));
router.post('/:id/lampiran', asyncHandler(activityController.addLampiran));
router.delete('/:id/lampiran/:lampiranId', asyncHandler(activityController.deleteLampiran));
router.post('/:id/anggota', asyncHandler(activityController.addMember));
router.delete('/:id/anggota/:anggotaId', asyncHandler(activityController.removeMember));
router.patch('/:id/partisipasi/:partisipasiId/terima', asyncHandler(activityController.acceptParticipation));
router.patch('/:id/partisipasi/:partisipasiId/tolak', asyncHandler(activityController.rejectParticipation));

export default router;
