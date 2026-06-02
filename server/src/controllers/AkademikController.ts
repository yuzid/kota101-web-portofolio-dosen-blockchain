import { Response } from 'express';
import { AkademikService } from '../services/AkademikService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AkademikController {
  private akademikService: AkademikService;

  constructor(akademikService: AkademikService) {
    this.akademikService = akademikService;
  }

  // Jurusan
  getAllJurusan = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.getAllJurusan();
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getJurusanById = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.getJurusanById(req.params.id as string);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(error.message === 'Jurusan tidak ditemukan.' ? 404 : 500).json({ status: 'error', error: error.message });
    }
  };

  createJurusan = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.createJurusan(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error: any) {
      res.status(error.message.includes('sudah digunakan') ? 409 : 400).json({ status: 'error', error: error.message });
    }
  };

  updateJurusan = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.updateJurusan(req.params.id as string, req.body);
      res.json({ status: 'success', data });
    } catch (error: any) {
      const status = error.message === 'Jurusan tidak ditemukan.' ? 404 :
                     error.message.includes('sudah digunakan') ? 409 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteJurusan = async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await this.akademikService.deleteJurusan(req.params.id as string);
      res.json({ status: 'success', message: `Jurusan "${deleted.nama_jurusan}" berhasil dihapus.` });
    } catch (error: any) {
      const status = error.message === 'Jurusan tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  // Prodi
  getAllProdi = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.getAllProdi(req.query.jurusan_id as string);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getProdiById = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.getProdiById(req.params.id as string);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(error.message === 'Program studi tidak ditemukan.' ? 404 : 500).json({ status: 'error', error: error.message });
    }
  };

  createProdi = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.createProdi(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error: any) {
      const status = error.message === 'Jurusan tidak ditemukan.' ? 404 :
                     error.message.includes('sudah digunakan') ? 409 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  updateProdi = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.akademikService.updateProdi(req.params.id as string, req.body);
      res.json({ status: 'success', data });
    } catch (error: any) {
      const status = error.message.includes('tidak ditemukan') ? 404 :
                     error.message.includes('sudah digunakan') ? 409 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteProdi = async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await this.akademikService.deleteProdi(req.params.id as string);
      res.json({ status: 'success', message: `Program studi "${deleted.nama_prodi}" berhasil dihapus.` });
    } catch (error: any) {
      const status = error.message === 'Program studi tidak ditemukan.' ? 404 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };
}
