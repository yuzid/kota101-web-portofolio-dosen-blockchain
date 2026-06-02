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
router.get('/:id', asyncHandler(activityController.getActivityById));
router.post('/', asyncHandler(activityController.createActivity));
router.put('/:id', asyncHandler(activityController.updateActivity));
router.delete('/:id', asyncHandler(activityController.deleteActivity));
router.post('/:id/lampiran', asyncHandler(activityController.addLampiran));

export default router;
