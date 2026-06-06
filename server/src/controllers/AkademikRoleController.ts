import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { Kajur } from '../services/Kajur';
import { Kaprodi } from '../services/Kaprodi';
import { KegiatanFilter, PageRequest } from '../types/activity';
import { prisma } from '../lib/prisma';

export class AkademikRoleController {
  private activityRepository: ActivityRepository;

  constructor() {
    this.activityRepository = new ActivityRepository();
  }

  getJurusanActivities = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }

      // Ambil jabatan kajur aktif untuk user ini
      const jabatan = await prisma.jabatanKajur.findFirst({
        where: {
          dosen_id: userId,
          periode_mulai: { lte: new Date() },
          periode_selesai: { gte: new Date() }
        }
      });

      if (!jabatan) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Jurusan aktif.' });
        return;
      }

      const filter: KegiatanFilter = {
        tanggalAwal: req.query.tanggalAwal as string,
        tanggalAkhir: req.query.tanggalAkhir as string,
        jenis: req.query.jenis as any,
        kategori: req.query.kategori as any,
        search: req.query.search as string,
        prodiId: req.query.prodiId as string,
        dosenId: req.query.dosenId as string,
        status: req.query.status as any,
      };

      const pageRequest: PageRequest = {
        page: parseInt(req.query.page as string) || 1,
        size: parseInt(req.query.size as string) || 10,
      };

      const kajurService = new Kajur(this.activityRepository, jabatan.jurusan_id);
      const result = await kajurService.getDaftarKegiatanTridharmaJurusan(filter, pageRequest);

      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getProdiActivities = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }

      // Ambil jabatan kaprodi aktif untuk user ini
      const jabatan = await prisma.jabatanKaprodi.findFirst({
        where: {
          dosen_id: userId,
          periode_mulai: { lte: new Date() },
          periode_selesai: { gte: new Date() }
        }
      });

      if (!jabatan) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Program Studi aktif.' });
        return;
      }

      const filter: KegiatanFilter = {
        tanggalAwal: req.query.tanggalAwal as string,
        tanggalAkhir: req.query.tanggalAkhir as string,
        jenis: req.query.jenis as any,
        kategori: req.query.kategori as any,
        search: req.query.search as string,
      };

      const pageRequest: PageRequest = {
        page: parseInt(req.query.page as string) || 1,
        size: parseInt(req.query.size as string) || 10,
      };

      const kaprodiService = new Kaprodi(this.activityRepository, jabatan.program_studi_id);
      const result = await kaprodiService.getDaftarKegiatanTridharmaProdi(filter, pageRequest);

      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getJurusanSummaryStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }

      const jabatan = await prisma.jabatanKajur.findFirst({
        where: {
          dosen_id: userId,
          periode_mulai: { lte: new Date() },
          periode_selesai: { gte: new Date() }
        }
      });

      if (!jabatan) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak.' });
        return;
      }

      const filter: KegiatanFilter = {
        tanggalAwal: req.query.tanggalAwal as string,
        tanggalAkhir: req.query.tanggalAkhir as string,
        search: req.query.search as string,
        prodiId: req.query.prodiId as string,
        dosenId: req.query.dosenId as string,
        status: req.query.status as any,
      };

      const result = await this.activityRepository.findJurusanSummaryStats(jabatan.jurusan_id, filter);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getProdiSummaryStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
        return;
      }

      const jabatan = await prisma.jabatanKaprodi.findFirst({
        where: {
          dosen_id: userId,
          periode_mulai: { lte: new Date() },
          periode_selesai: { gte: new Date() }
        }
      });

      if (!jabatan) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak.' });
        return;
      }

      const filter: KegiatanFilter = {
        tanggalAwal: req.query.tanggalAwal as string,
        tanggalAkhir: req.query.tanggalAkhir as string,
        search: req.query.search as string,
        dosenId: req.query.dosenId as string,
        status: req.query.status as any,
      };

      const result = await this.activityRepository.findProdiSummaryStats(jabatan.program_studi_id, filter);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };
}
