import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { Kajur } from '../services/Kajur';
import { Kaprodi } from '../services/Kaprodi';
import { RekapService } from '../services/RekapService';
import { DocumentService } from '../services/DocumentService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileStorageService } from '../services/FileStorageService';
import { KegiatanFilter, PageRequest } from '../types/activity';
import { prisma } from '../lib/prisma';

export class AkademikRoleController {
  private activityRepository: ActivityRepository;
  private rekapService: RekapService;
  private documentService: DocumentService;

  constructor() {
    this.activityRepository = new ActivityRepository();
    this.rekapService = new RekapService();
    const documentRepository = new DocumentRepository();
    const fileStorageService = new FileStorageService();
    this.documentService = new DocumentService(documentRepository, fileStorageService);
  }

  getJurusanActivities = async (req: AuthRequest, res: Response) => {
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
        periode: req.query.periode as string,
        semester: req.query.semester as string,
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
        dosenId: req.query.dosenId as string,
        status: req.query.status as any,
        periode: req.query.periode as string,
        semester: req.query.semester as string,
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
        periode: req.query.periode as string,
        semester: req.query.semester as string,
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
        periode: req.query.periode as string,
        semester: req.query.semester as string,
      };

      const result = await this.activityRepository.findProdiSummaryStats(jabatan.program_studi_id, filter);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  createJurusanRekap = async (req: AuthRequest, res: Response) => {
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

      const { nama, tanggalPerekapan, filter, kegiatanData } = req.body;

      const result = await this.rekapService.createRekap({
        nama,
        tanggalPerekapan: new Date(tanggalPerekapan),
        dibuatOlehId: userId,
        jurusanId: jabatan.jurusan_id,
        filter,
        kegiatanData
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getJurusanRekaps = async (req: AuthRequest, res: Response) => {
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

      const result = await this.rekapService.getAllRekap({ jurusan_id: jabatan.jurusan_id });
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getKajurAllRekaps = async (req: AuthRequest, res: Response) => {
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
        res.status(403).json({ status: 'error', error: 'Anda bukan Ketua Jurusan aktif.' });
        return;
      }

      const prodiList = await prisma.programStudi.findMany({
        where: { jurusan_id: jabatan.jurusan_id },
        select: { id: true }
      });
      const prodiIds = prodiList.map(p => p.id);

      const result = await this.rekapService.getAllRekap({
        OR: [
          { jurusan_id: jabatan.jurusan_id },
          { prodi_id: { in: prodiIds } }
        ]
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  createProdiRekap = async (req: AuthRequest, res: Response) => {
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

      const { nama, tanggalPerekapan, filter, kegiatanData } = req.body;

      const result = await this.rekapService.createRekap({
        nama,
        tanggalPerekapan: new Date(tanggalPerekapan),
        dibuatOlehId: userId,
        prodiId: jabatan.program_studi_id,
        filter,
        kegiatanData
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getProdiRekaps = async (req: AuthRequest, res: Response) => {
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

      const result = await this.rekapService.getAllRekap({ prodi_id: jabatan.program_studi_id });
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  getRekapDetail = async (req: AuthRequest, res: Response) => {
    try {
      const  id  = req.params.id as string;
      const result = await this.rekapService.getRekapDetail(id);
      if (!result) {
        res.status(404).json({ status: 'error', error: 'Rekap tidak ditemukan.' });
        return;
      }
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  updateRekap = async (req: AuthRequest, res: Response) => {
    try {
      const  id  = req.params.id as string;
      const { nama, tanggalPerekapan, filter, kegiatanData } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        include: { dosen: true, admin: true, tata_usaha: true }
      });
      const userName = user?.dosen?.nama || user?.admin?.nama || user?.tata_usaha?.nama || user?.email || 'Unknown';

      const result = await this.rekapService.updateRekap(id, {
        nama,
        tanggalPerekapan: tanggalPerekapan ? new Date(tanggalPerekapan) : undefined,
        filter,
        kegiatanData,
        dilakukanOlehName: userName
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  deleteRekap = async (req: AuthRequest, res: Response) => {
    try {
      const  id  = req.params.id as string;
      await this.rekapService.deleteRekap(id);
      res.status(200).json({ status: 'success', message: 'Rekap berhasil dihapus.' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  // Lampiran preview dan content endpoints untuk Kajur
  getJurusanLampiranPreview = async (req: AuthRequest, res: Response) => {
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
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Jurusan aktif.' });
        return;
      }

      const lampiranId = req.params.lampiranId as string;
      const kegiatanId = req.params.kegiatanId as string;

      // Verify the activity belongs to this jurusan via KepemilikanDokumen
      const lampiran = await prisma.kepemilikanDokumen.findUnique({
        where: { id: lampiranId },
        include: {
          kegiatan: {
            include: { dosen: { include: { program_studi: true } } }
          },
          dokumen: true
        }
      });

      if (!lampiran) {
        res.status(404).json({ status: 'error', error: 'Lampiran tidak ditemukan.' });
        return;
      }

      if (!lampiran.kegiatan || lampiran.kegiatan.id !== kegiatanId) {
        res.status(400).json({ status: 'error', error: 'ID kegiatan tidak sesuai.' });
        return;
      }

      if (lampiran.kegiatan.dosen.program_studi.jurusan_id !== jabatan.jurusan_id) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Kegiatan tidak berada dalam yurisdiksi Anda.' });
        return;
      }

      const preview = await this.documentService.getDocumentPreview(lampiran.dokumen_id, req.user, kegiatanId);
      res.json({ status: 'success', data: preview });
    } catch (error: any) {
      const status = error.message === 'Dokumen tidak ditemukan.' ? 404 :
                     error.message.includes('Akses ditolak') ? 403 : 502;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  getJurusanLampiranContent = async (req: AuthRequest, res: Response) => {
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
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Jurusan aktif.' });
        return;
      }

      const lampiranId = req.params.lampiranId as string;
      const kegiatanId = req.params.kegiatanId as string;

      // Verify the activity belongs to this jurusan via KepemilikanDokumen
      const lampiran = await prisma.kepemilikanDokumen.findUnique({
        where: { id: lampiranId },
        include: {
          kegiatan: {
            include: { dosen: { include: { program_studi: true } } }
          },
          dokumen: true
        }
      });

      if (!lampiran) {
        res.status(404).json({ status: 'error', error: 'Lampiran tidak ditemukan.' });
        return;
      }

      if (!lampiran.kegiatan || lampiran.kegiatan.id !== kegiatanId) {
        res.status(400).json({ status: 'error', error: 'ID kegiatan tidak sesuai.' });
        return;
      }

      if (lampiran.kegiatan.dosen.program_studi.jurusan_id !== jabatan.jurusan_id) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Kegiatan tidak berada dalam yurisdiksi Anda.' });
        return;
      }

      const file = await this.documentService.getDocumentContent(lampiran.dokumen_id, req.user);
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

  // Lampiran preview dan content endpoints untuk Kaprodi
  getProdiLampiranPreview = async (req: AuthRequest, res: Response) => {
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
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Program Studi aktif.' });
        return;
      }

      const lampiranId = req.params.lampiranId as string;
      const kegiatanId = req.params.kegiatanId as string;

      // Verify the activity belongs to this prodi via KepemilikanDokumen
      const lampiran = await prisma.kepemilikanDokumen.findUnique({
        where: { id: lampiranId },
        include: {
          kegiatan: {
            include: { dosen: true }
          },
          dokumen: true
        }
      });

      if (!lampiran) {
        res.status(404).json({ status: 'error', error: 'Lampiran tidak ditemukan.' });
        return;
      }

      if (!lampiran.kegiatan || lampiran.kegiatan.id !== kegiatanId) {
        res.status(400).json({ status: 'error', error: 'ID kegiatan tidak sesuai.' });
        return;
      }

      if (lampiran.kegiatan.dosen.program_studi_id !== jabatan.program_studi_id) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Kegiatan tidak berada dalam yurisdiksi Anda.' });
        return;
      }

      const preview = await this.documentService.getDocumentPreview(lampiran.dokumen_id, req.user, kegiatanId);
      res.json({ status: 'success', data: preview });
    } catch (error: any) {
      const status = error.message === 'Dokumen tidak ditemukan.' ? 404 :
                     error.message.includes('Akses ditolak') ? 403 : 502;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  getProdiLampiranContent = async (req: AuthRequest, res: Response) => {
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
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan Ketua Program Studi aktif.' });
        return;
      }

      const lampiranId = req.params.lampiranId as string;
      const kegiatanId = req.params.kegiatanId as string;

      // Verify the activity belongs to this prodi via KepemilikanDokumen
      const lampiran = await prisma.kepemilikanDokumen.findUnique({
        where: { id: lampiranId },
        include: {
          kegiatan: {
            include: { dosen: true }
          },
          dokumen: true
        }
      });

      if (!lampiran) {
        res.status(404).json({ status: 'error', error: 'Lampiran tidak ditemukan.' });
        return;
      }

      if (!lampiran.kegiatan || lampiran.kegiatan.id !== kegiatanId) {
        res.status(400).json({ status: 'error', error: 'ID kegiatan tidak sesuai.' });
        return;
      }

      if (lampiran.kegiatan.dosen.program_studi_id !== jabatan.program_studi_id) {
        res.status(403).json({ status: 'error', error: 'Akses ditolak. Kegiatan tidak berada dalam yurisdiksi Anda.' });
        return;
      }

      const file = await this.documentService.getDocumentContent(lampiran.dokumen_id, req.user);
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
}
