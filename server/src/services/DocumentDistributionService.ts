import crypto from 'crypto';
import { DistributionRepository } from '../repositories/DistributionRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileStorageService } from './FileStorageService';

export class DocumentDistributionService {
  private distributionRepository: DistributionRepository;
  private documentRepository: DocumentRepository;
  private fileStorageService: FileStorageService;

  constructor(
    distributionRepository: DistributionRepository,
    documentRepository: DocumentRepository,
    fileStorageService: FileStorageService,
  ) {
    this.distributionRepository = distributionRepository;
    this.documentRepository = documentRepository;
    this.fileStorageService = fileStorageService;
  }

  async saveDraft(data: any, file: Express.Multer.File) {
    const { nama, jenis_dokumen, tanggal_upload } = data;
    if (!file || !nama || !jenis_dokumen || !tanggal_upload) {
      throw new Error('Nama, jenis dokumen, tanggal, dan file wajib diisi.');
    }

    const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const filePath = await this.fileStorageService.uploadFile(file, 'documents');

    return await this.documentRepository.create({
      nama,
      jenis_dokumen,
      file_path: filePath,
      hash_file: hashFile,
      sumber_dokumen: 'TATA_USAHA',
      tanggal_upload: new Date(tanggal_upload),
    }, []);
  }

  async distribute(tuUserId: string, data: any, file?: Express.Multer.File) {
    const { nama, jenis_dokumen, tanggal_upload, dosen_penerima_ids, dokumen_id } = data;

    if (!dosen_penerima_ids) throw new Error('Penerima dokumen wajib dipilih.');
    const targetDosenIds: string[] = typeof dosen_penerima_ids === 'string'
      ? JSON.parse(dosen_penerima_ids)
      : dosen_penerima_ids;
    if (targetDosenIds.length === 0) throw new Error('Minimal pilih satu dosen penerima.');

    let docId = dokumen_id;

    if (dokumen_id) {
      const existing = await this.documentRepository.findById(dokumen_id);
      if (!existing) throw new Error('Dokumen tidak ditemukan.');
      docId = dokumen_id;
    } else {
      if (!file || !nama || !jenis_dokumen || !tanggal_upload) {
        throw new Error('Nama, jenis dokumen, tanggal, dan file wajib diisi.');
      }
      const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const filePath = await this.fileStorageService.uploadFile(file, 'documents');

      const doc = await this.documentRepository.create({
        nama,
        jenis_dokumen,
        file_path: filePath,
        hash_file: hashFile,
        sumber_dokumen: 'TATA_USAHA',
        tanggal_upload: new Date(tanggal_upload),
      }, []);
      docId = doc.id;
    }

    await this.distributionRepository.createMany(docId, targetDosenIds, tuUserId);

    return { id: docId };
  }

  async getDistribusiByDokumen(dokumenId: string, currentUser: any) {
    const doc = await this.documentRepository.findById(dokumenId);
    if (!doc) throw new Error('Dokumen tidak ditemukan.');

    return await this.distributionRepository.findByDokumen(dokumenId);
  }

  async getDokumenWithDistribusi(dokumenId: string) {
    const doc = await this.documentRepository.findById(dokumenId);
    if (!doc) throw new Error('Dokumen tidak ditemukan.');

    const distribusi = await this.distributionRepository.findByDokumen(dokumenId);
    return { ...doc, distribusi };
  }

  async getTUDokumenWithDistribusi(currentUser: any) {
    let whereClause: any = {
      deleted_at: null,
      sumber_dokumen: 'TATA_USAHA',
    };

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      whereClause.kepemilikan = {
        some: { dosen: { program_studi: { jurusan_id: currentUser.jurusan_id } } },
      };
    }

    const docs = await this.documentRepository.findAll(whereClause);

    const result = await Promise.all(
      docs.map(async (doc: any) => {
        const distribusi = await this.distributionRepository.findByDokumen(doc.id);
        return { ...doc, distribusi };
      })
    );

    return result;
  }

  async getPendingRequests(dosenId: string) {
    return await this.distributionRepository.findPendingByDosen(dosenId);
  }

  async getDosenDistributionHistory(dosenId: string) {
    const distribusi = await this.distributionRepository.findByDosen(dosenId);

    return distribusi.map(d => {
      const doc: any = d.dokumen;
      const tu = (d.didistribusikan_oleh as any)?.tata_usaha;
      return {
        id: d.id,
        dokumenId: d.dokumen_id,
        namaDokumen: doc?.nama || 'Unknown',
        jenisDokumen: doc?.jenis_dokumen || '',
        tanggalDistribusi: d.tanggal_distribusi,
        tanggalKeputusan: d.tanggal_keputusan,
        status: d.status,
        pengirim: tu ? tu.nama : 'Tata Usaha',
        sudahDiklaim: !!d.kepemilikan_id,
      };
    });
  }

  async acceptDocument(dosenId: string, dokumenId: string) {
    const distribusi = await this.distributionRepository.findDistributionByDosenAndDokumen(dosenId, dokumenId);
    if (!distribusi) throw new Error('Distribusi dokumen tidak ditemukan.');
    if (distribusi.status !== 'MENUNGGU_KONFIRMASI') throw new Error('Dokumen sudah diproses.');

    const doc = await this.documentRepository.findById(dokumenId);
    if (!doc) throw new Error('Dokumen tidak ditemukan.');

    const existingKepemilikan = await this.documentRepository.findKepemilikan(dosenId, dokumenId);
    let kepemilikanId: string;

    if (existingKepemilikan) {
      kepemilikanId = existingKepemilikan.id;
    } else {
      const newKepemilikan = await this.documentRepository.createKepemilikan(dosenId, dokumenId);
      kepemilikanId = newKepemilikan.id;
    }

    await this.distributionRepository.updateStatus(distribusi.id, 'DISETUJUI');
    await this.distributionRepository.linkKepemilikan(distribusi.id, kepemilikanId);

    return { message: 'Dokumen berhasil diterima.' };
  }

  async rejectDocument(dosenId: string, dokumenId: string) {
    const distribusi = await this.distributionRepository.findDistributionByDosenAndDokumen(dosenId, dokumenId);
    if (!distribusi) throw new Error('Distribusi dokumen tidak ditemukan.');
    if (distribusi.status !== 'MENUNGGU_KONFIRMASI') throw new Error('Dokumen sudah diproses.');

    await this.distributionRepository.updateStatus(distribusi.id, 'DITOLAK');

    return { message: 'Dokumen berhasil ditolak.' };
  }

  async resendDistribution(distribusiId: string) {
    const distribusi = await this.distributionRepository.findById(distribusiId);
    if (!distribusi) throw new Error('Distribusi tidak ditemukan.');

    await this.distributionRepository.resetStatus(distribusiId);

    return { message: 'Dokumen berhasil dikirim ulang.' };
  }

  async removeRecipient(distribusiId: string) {
    const distribusi = await this.distributionRepository.findById(distribusiId);
    if (!distribusi) throw new Error('Distribusi tidak ditemukan.');

    await this.distributionRepository.deleteById(distribusiId);

    return { message: 'Penerima berhasil dihapus.' };
  }
}
