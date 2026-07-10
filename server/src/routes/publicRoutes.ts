import { Router } from 'express';
import { asyncHandler } from '../middleware/authMiddleware';
import { HighlightController } from '../controllers/HighlightController';
import { HighlightService } from '../services/HighlightService';
import { HighlightRepository } from '../repositories/HighlightRepository';
import { ActivityController } from '../controllers/ActivityController';
import { ActivityService } from '../services/ActivityService';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DocumentController } from '../controllers/DocumentController';
import { DocumentService } from '../services/DocumentService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileStorageService } from '../services/FileStorageService';
import { DocumentDistributionService } from '../services/DocumentDistributionService';
import { DistributionRepository } from '../repositories/DistributionRepository';

const router = Router();

// Highlight routes
const highlightRepository = new HighlightRepository();
const highlightService = new HighlightService(highlightRepository);
const highlightController = new HighlightController(highlightService);

// Activity routes
const activityRepository = new ActivityRepository();
const activityService = new ActivityService(activityRepository);
const activityController = new ActivityController(activityService);

// Document routes
const documentRepository = new DocumentRepository();
const distributionRepository = new DistributionRepository();
const fileStorageService = new FileStorageService();
const documentService = new DocumentService(documentRepository, fileStorageService);
const distributionService = new DocumentDistributionService(distributionRepository, documentRepository, fileStorageService);
const documentController = new DocumentController(documentService, distributionService);

/**
 * These routes are accessible without authentication.
 * They are intended for use with shared document links and public viewing.
 */

// Highlight routes
router.get('/highlights/:kepemilikanId', asyncHandler(highlightController.getPublicHighlights));

// Activity routes (public)
router.get('/kegiatan', asyncHandler(activityController.getPublicActivities));
router.get('/kegiatan/:id', asyncHandler(activityController.getPublicActivityById));
router.get('/kegiatan/:id/audit-trail', asyncHandler(activityController.getAuditTrail));
router.get('/kegiatan/:activityId/audit-trail/:txId/dokumen/:dokumenId/content', asyncHandler(documentController.getPublicSnapshotDocumentContent));

// Document routes (public)
router.get('/dokumen', asyncHandler(documentController.getPublicDocuments));
router.get('/dokumen/:id', asyncHandler(documentController.getPublicDocumentById));
router.get('/dokumen/:id/content', asyncHandler(documentController.getPublicDocumentContent));

export default router;
