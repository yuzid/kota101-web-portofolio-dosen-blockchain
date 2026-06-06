import { Router } from 'express';
import { HighlightController } from '../controllers/HighlightController';
import { HighlightService } from '../services/HighlightService';
import { HighlightRepository } from '../repositories/HighlightRepository';

const router = Router();
const highlightRepository = new HighlightRepository();
const highlightService = new HighlightService(highlightRepository);
const highlightController = new HighlightController(highlightService);

/**
 * These routes are accessible without authentication.
 * They are intended for use with shared document links.
 */
router.get('/highlights/:kepemilikanId', highlightController.getPublicHighlights);

export default router;
