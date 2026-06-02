import { Response } from 'express';
import { DocumentService } from '../services/DocumentService';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRepository } from '../repositories/UserRepository';

export class DocumentController {
  private documentService: DocumentService;

  constructor(documentService: DocumentService) {
    this.documentService = documentService;
  }

  // Dosen Handlers
  getDosenDocuments = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const documents = await this.documentService.getDosenDocuments(dosenId, req.query);
      res.json({ status: 'success', data: documents });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  uploadDosenDocument = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const result = await this.documentService.uploadDosenDocument(dosenId, req.body, req.file!);
      res.status(201).json({ status: 'success', message: 'Dokumen mandiri berhasil disimpan.', data: { id: result.id } });
    } catch (error: any) {
      res.status(error.message.includes('Sesi tidak valid') ? 401 : 400).json({ status: 'error', error: error.message });
    }
  };

  // TU Handlers
  getTUDocuments = async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const listDokumen = await this.documentService.getTUDocuments(currentUser);
      res.json({ status: 'success', data: listDokumen });
    } catch (error: any) {
      res.status(error.message.includes('Akses ditolak') ? 403 : 500).json({ status: 'error', error: error.message });
    }
  };

  uploadTUDocument = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const userRepository = new UserRepository();
      const result = await this.documentService.uploadTUDocument(req.user.id, req.body, req.file!, userRepository);
      res.status(201).json({
        status: 'success',
        message: 'Dokumen berhasil diunggah ke S3 dan disimpan di database.',
        data: { id: result.id, file_path: result.file_path, hash_file: result.hash_file }
      });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  updateMetadata = async (req: AuthRequest, res: Response) => {
    try {
      await this.documentService.updateMetadata(req.params.id as string, req.body);
      res.json({ status: 'success', message: 'Metadata dokumen berhasil diperbarui di database.' });
    } catch (error: any) {
      res.status(error.message === 'Dokumen tidak ditemukan.' ? 404 : 400).json({ status: 'error', error: error.message });
    }
  };

  // Common
  deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      await this.documentService.deleteDocument(req.params.id as string, currentUser);
      res.json({ status: 'success', message: 'Dokumen berhasil dihapus/disembunyikan.' });
    } catch (error: any) {
      const status = error.message === 'Dokumen tidak ditemukan.' ? 404 :
                     error.message.includes('Akses ditolak') || error.message.includes('bukan pemilik') ? 403 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };
}
