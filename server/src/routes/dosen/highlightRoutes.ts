import { Router } from 'express';
import { HighlightController } from '../../controllers/HighlightController';
import { HighlightService } from '../../services/HighlightService';
import { HighlightRepository } from '../../repositories/HighlightRepository';

const router = Router();
const highlightRepository = new HighlightRepository();
const highlightService = new HighlightService(highlightRepository);
const highlightController = new HighlightController(highlightService);

router.get('/', highlightController.getHighlights);
router.get('/:kepemilikanId', highlightController.getHighlights);
router.post('/:kepemilikanId/sync', highlightController.syncHighlights);
router.post('/:kepemilikanId', highlightController.addHighlight);
router.put('/:id', highlightController.updateHighlight);
router.delete('/:id', highlightController.deleteHighlight);

export default router;
