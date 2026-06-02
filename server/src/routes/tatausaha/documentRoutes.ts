import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/authMiddleware';
import { DocumentController } from '../../controllers/DocumentController';
import { DocumentService } from '../../services/DocumentService';
import { DocumentRepository } from '../../repositories/DocumentRepository';
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
const fileStorageService = new FileStorageService();
const documentService = new DocumentService(documentRepository, fileStorageService);
const documentController = new DocumentController(documentService);

router.get('/', asyncHandler(documentController.getTUDocuments));
router.post('/upload', upload.single('file'), asyncHandler(documentController.uploadTUDocument));
router.put('/:id/metadata', asyncHandler(documentController.updateMetadata));
router.delete('/:id', asyncHandler(documentController.deleteDocument));

export default router;
