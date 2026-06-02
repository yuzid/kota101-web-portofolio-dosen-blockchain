import { Response } from 'express';
import { JabatanService } from '../services/JabatanService';
import { AuthRequest } from '../middleware/authMiddleware';

export class JabatanController {
  private jabatanService: JabatanService;

  constructor(jabatanService: JabatanService) {
    this.jabatanService = jabatanService;
  }

  // Kajur Handlers
  getAllKajur = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.jabatanService.getAllKajur(req.query);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  createKajur = async (req: AuthRequest, res: Response) => {
    try {
      const jabatan = await this.jabatanService.createKajur(req.body);
      res.status(201).json({ status: 'success', data: jabatan });
    } catch (error: any) {
      const status = error.message.includes('sudah memiliki') ? 409 : 
                     error.message === 'Dosen tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  updateKajur = async (req: AuthRequest, res: Response) => {
    try {
      const updated = await this.jabatanService.updateKajur(req.params.id as string, req.body);
      res.json({ status: 'success', data: updated });
    } catch (error: any) {
      const status = error.message.includes('sudah memiliki') ? 409 : 
                     error.message === 'Jabatan tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteKajur = async (req: AuthRequest, res: Response) => {
    try {
      await this.jabatanService.deleteKajur(req.params.id as string);
      res.json({ status: 'success', message: 'Jabatan Kajur berhasil dihapus.' });
    } catch (error: any) {
      res.status(error.message === 'Jabatan tidak ditemukan.' ? 404 : 500).json({ status: 'error', error: error.message });
    }
  };

  // Kaprodi Handlers
  getAllKaprodi = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.jabatanService.getAllKaprodi(req.query);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  createKaprodi = async (req: AuthRequest, res: Response) => {
    try {
      const jabatan = await this.jabatanService.createKaprodi(req.body);
      res.status(201).json({ status: 'success', data: jabatan });
    } catch (error: any) {
      const status = error.message.includes('sudah memiliki') ? 409 : 
                     error.message === 'Dosen tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  updateKaprodi = async (req: AuthRequest, res: Response) => {
    try {
      const updated = await this.jabatanService.updateKaprodi(req.params.id as string, req.body);
      res.json({ status: 'success', data: updated });
    } catch (error: any) {
      const status = error.message.includes('sudah memiliki') ? 409 : 
                     error.message === 'Jabatan tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteKaprodi = async (req: AuthRequest, res: Response) => {
    try {
      await this.jabatanService.deleteKaprodi(req.params.id as string);
      res.json({ status: 'success', message: 'Jabatan Kaprodi berhasil dihapus.' });
    } catch (error: any) {
      res.status(error.message === 'Jabatan tidak ditemukan.' ? 404 : 500).json({ status: 'error', error: error.message });
    }
  };
}
