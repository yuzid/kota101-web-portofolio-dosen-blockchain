import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/authMiddleware';
import { DocumentController } from '../../controllers/DocumentController';
import { DocumentService } from '../../services/DocumentService';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { DistributionRepository } from '../../repositories/DistributionRepository';
import { DocumentDistributionService } from '../../services/DocumentDistributionService';
import { FileStorageService } from '../../services/FileStorageService';

const router = Router();

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung! Hanya menerima PDF atau DOCX.'));
    }
  }
});

const documentRepository = new DocumentRepository();
const distributionRepository = new DistributionRepository();
const fileStorageService = new FileStorageService();
const documentService = new DocumentService(documentRepository, fileStorageService);
const distributionService = new DocumentDistributionService(distributionRepository, documentRepository, fileStorageService);
const documentController = new DocumentController(documentService, distributionService);

router.get('/', asyncHandler(documentController.getTUDocuments));
router.get('/:id/preview', asyncHandler(documentController.getDocumentPreview));
router.get('/:id/content', asyncHandler(documentController.getDocumentContent));
router.get('/:id/distribusi', asyncHandler(documentController.getDistribusiByDokumen));
router.get('/:id/detail', asyncHandler(documentController.getDokumenDetailWithDistribusi));
router.post('/upload', upload.single('file'), asyncHandler(documentController.uploadTUDocument));
router.post('/draft', upload.single('file'), asyncHandler(documentController.saveDraft));
router.post('/distribute', upload.single('file'), asyncHandler(documentController.distributeDocument));
router.put('/:id/metadata', asyncHandler(documentController.updateMetadata));
router.put('/:id/replace-file', upload.single('file'), asyncHandler(documentController.replaceFile));
router.delete('/:id', asyncHandler(documentController.deleteDocument));

export default router;
