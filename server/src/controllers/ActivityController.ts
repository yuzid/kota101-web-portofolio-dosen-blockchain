import { Response } from 'express';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';

export class ActivityController {
  private activityService: ActivityService;

  constructor(activityService: ActivityService) {
    this.activityService = activityService;
  }

  getAllActivities = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const activities = await this.activityService.getAllActivities(dosenId);
      res.status(200).json({ status: 'success', data: activities });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getSummaryStats = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const stats = await this.activityService.getSummaryStats(dosenId);
      res.status(200).json({ status: 'success', data: stats });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getTanpaBukti = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const formatted = await this.activityService.getTanpaBukti(dosenId);
      res.status(200).json({ status: 'success', data: formatted });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getActivityById = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const dosenId = req.user?.id;
      const detail = await this.activityService.getActivityById(id, dosenId);
      res.status(200).json({ status: 'success', data: detail });
    } catch (error: any) {
      const status = error.message.includes('Format ID') ? 400 :
                     error.message === 'Kegiatan tidak ditemukan.' ? 404 : 500;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  getAuditTrail = async (req: AuthRequest, res: Response) => {
    try {
      const auditTrail = await this.activityService.getAuditTrail(req.params.id as string);
      res.status(200).json({ status: 'success', data: auditTrail });
    } catch (error: any) {
      const status = error.message.includes('Format ID') ? 400 :
                     error.message === 'Kegiatan tidak ditemukan.' ? 404 : 502;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  createActivity = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const newActivity = await this.activityService.createActivity(dosenId, req.body);
      res.status(201).json({ status: 'success', data: newActivity });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  updateActivity = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const updated = await this.activityService.updateActivity(req.params.id as string, dosenId, req.body);
      res.status(200).json({ status: 'success', data: updated });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 :
                     error.message === 'Kegiatan tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteActivity = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      await this.activityService.deleteActivity(req.params.id as string, dosenId);
      res.status(200).json({ status: 'success', message: 'Kegiatan berhasil dihapus.' });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 :
                     error.message === 'Kegiatan tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  addLampiran = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }

      const lampiran = await this.activityService.addLampiran(
        req.params.id as string,
        req.body.dokumen_id,
        dosenId,
      );
      res.status(201).json({ status: 'success', data: lampiran });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 :
                     error.message.includes('Format ID') ? 400 :
                     error.message === 'Kegiatan tidak ditemukan.' ? 404 : 500;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteLampiran = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      await this.activityService.deleteLampiran(
        req.params.id as string,
        req.params.lampiranId as string,
        dosenId,
      );
      res.status(200).json({ status: 'success', message: 'Dokumen berhasil dihapus.' });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 :
                     error.message.includes('Format ID') ? 400 : 500;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  getPendingConfirmations = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const pending = await this.activityService.getPendingConfirmations(dosenId);
      res.status(200).json({ status: 'success', data: pending });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  acceptParticipation = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      await this.activityService.acceptParticipation(req.params.partisipasiId as string, dosenId);
      res.status(200).json({ status: 'success', message: 'Partisipasi diterima.' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  rejectParticipation = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      await this.activityService.rejectParticipation(req.params.partisipasiId as string, dosenId);
      res.status(200).json({ status: 'success', message: 'Partisipasi ditolak.' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  addMember = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      const { anggota_id } = req.body;
      if (!anggota_id) {
        res.status(400).json({ status: 'error', error: 'anggota_id wajib diisi.' });
        return;
      }
      await this.activityService.addMember(req.params.id as string, dosenId, anggota_id);
      res.status(201).json({ status: 'success', message: 'Anggota berhasil ditambahkan.' });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  removeMember = async (req: AuthRequest, res: Response) => {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }
      await this.activityService.removeMember(req.params.id as string, dosenId, req.params.anggotaId as string);
      res.status(200).json({ status: 'success', message: 'Anggota berhasil dihapus.' });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };
}
