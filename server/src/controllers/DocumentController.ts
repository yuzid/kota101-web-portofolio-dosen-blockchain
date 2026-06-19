import { Response } from 'express';
import { DocumentService } from '../services/DocumentService';
import { DocumentDistributionService } from '../services/DocumentDistributionService';
import { AuthRequest } from '../middleware/authMiddleware';

export class DocumentController {
  private documentService: DocumentService;
  private distributionService: DocumentDistributionService;

  constructor(
    documentService: DocumentService,
    distributionService: DocumentDistributionService,
  ) {
    this.documentService = documentService;
    this.distributionService = distributionService;
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

  getDocumentPreview = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const preview = await this.documentService.getDocumentPreview(
        req.params.id as string,
        req.user,
        req.query.activityId as string | undefined,
      );
      res.json({ status: 'success', data: preview });
    } catch (error: any) {
      const status = error.message === 'Dokumen tidak ditemukan.' ? 404 :
                     error.message.includes('Akses ditolak') ? 403 : 502;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  getDocumentContent = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const file = await this.documentService.getDocumentContent(req.params.id as string, req.user);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', file.contentLength);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
      res.setHeader('X-Content-SHA256', file.contentHash);
      res.send(file.bytes);
    } catch (error: any) {
      const status = error.message === 'Dokumen tidak ditemukan.' ? 404 :
                     error.message.includes('Akses ditolak') ? 403 : 502;
      res.status(status).json({ status: 'error', error: error.message });
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
      const listDokumen = await this.distributionService.getTUDokumenWithDistribusi(currentUser);
      res.json({ status: 'success', data: listDokumen });
    } catch (error: any) {
      res.status(error.message.includes('Akses ditolak') ? 403 : 500).json({ status: 'error', error: error.message });
    }
  };

  saveDraft = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const result = await this.distributionService.saveDraft(req.body, req.file!);
      res.status(201).json({
        status: 'success',
        message: 'Dokumen berhasil disimpan sebagai Draft.',
        data: { id: result.id },
      });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  distributeDocument = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const result = await this.distributionService.distribute(req.user.id, req.body, req.file);
      res.status(201).json({
        status: 'success',
        message: 'Dokumen berhasil didistribusikan.',
        data: { id: result.id },
      });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  uploadTUDocument = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const result = await this.documentService.uploadTUDocument(req.body, req.file!);
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

  replaceFile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const result = await this.documentService.replaceFile(req.params.id as string, req.file!);
      res.json({
        status: 'success',
        message: 'File dokumen berhasil diganti.',
        data: { id: result.id, file_path: result.file_path, hash_file: result.hash_file },
      });
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

  // Distribution Handlers - Dosen Side
  getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const pending = await this.distributionService.getPendingRequests(dosenId);
      res.json({ status: 'success', data: pending });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getDosenDistributionHistory = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const history = await this.distributionService.getDosenDistributionHistory(dosenId);
      res.json({ status: 'success', data: history });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  acceptDocument = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const result = await this.distributionService.acceptDocument(dosenId, req.params.id as string);
      res.json({ status: 'success', message: result.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  rejectDocument = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const result = await this.distributionService.rejectDocument(dosenId, req.params.id as string);
      res.json({ status: 'success', message: result.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  // TU Distribution Tracking
  getDistribusiByDokumen = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const distribusi = await this.distributionService.getDistribusiByDokumen(req.params.id as string, req.user);
      res.json({ status: 'success', data: distribusi });
    } catch (error: any) {
      res.status(404).json({ status: 'error', error: error.message });
    }
  };

  getDokumenDetailWithDistribusi = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }
      const detail = await this.distributionService.getDokumenWithDistribusi(req.params.id as string);
      res.json({ status: 'success', data: detail });
    } catch (error: any) {
      res.status(404).json({ status: 'error', error: error.message });
    }
  };

  resendDistribution = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.distributionService.resendDistribution(req.params.distribusiId as string);
      res.json({ status: 'success', message: result.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  removeRecipient = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.distributionService.removeRecipient(req.params.distribusiId as string);
      res.json({ status: 'success', message: result.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };
}
