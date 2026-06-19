import crypto from 'crypto';
import { JenisDokumen } from '@prisma/client';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileStorageService } from './FileStorageService';
import { MultiChainService } from './MultiChainService';
import { resolveBlockchainNode } from '../lib/blockchainNode';

export class DocumentService {
  private documentRepository: DocumentRepository;
  private fileStorageService: FileStorageService;
  private multiChainService: MultiChainService;

  constructor(
    documentRepository: DocumentRepository,
    fileStorageService: FileStorageService,
    multiChainService = new MultiChainService(),
  ) {
    this.documentRepository = documentRepository;
    this.fileStorageService = fileStorageService;
    this.multiChainService = multiChainService;
  }

  private canAccessDocument(document: any, currentUser: any) {
    if (currentUser.role?.toUpperCase() !== 'DOSEN') return true;

    const isOwner = document.kepemilikan.some((item: any) => item.dosen_id === currentUser.id);
    const isInLinkedActivity = document.lampiran_bukti.some((item: any) => {
      const activity = item.kegiatan;
      return activity.dosen_id === currentUser.id ||
        activity.partisipasi.some((participant: any) => participant.dosen_id === currentUser.id);
    });

    return isOwner || isInLinkedActivity;
  }

  private getMimeType(contentType: string, filePath: string) {
    if (contentType !== 'application/octet-stream') return contentType;
    if (filePath.toLowerCase().endsWith('.pdf')) return 'application/pdf';
    if (filePath.toLowerCase().endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    return contentType;
  }

  private async findBlockchainDocumentRecord(document: any, activityId?: string) {
    const linkedActivities = document.lampiran_bukti
      .map((item: any) => item.kegiatan)
      .filter((activity: any) => !activityId || activity.id === activityId);

    for (const activity of linkedActivities) {
      const node = resolveBlockchainNode(activity.dosen.program_studi);
      const items = await this.multiChainService.getJsonStreamItems(node, activity.id);

      for (const item of items) {
        const payload = item.data.json || {};
        const documents = Array.isArray(payload.dokumen_pendukung)
          ? payload.dokumen_pendukung as Array<Record<string, unknown>>
          : [];
        const blockchainDocument = documents.find(
          (entry) => entry.dokumen_id === document.id,
        );

        if (blockchainDocument && typeof blockchainDocument.hash_file === 'string') {
          return {
            activityId: activity.id,
            txId: item.txid,
            blockHeight: item.blockheight ?? null,
            confirmations: item.confirmations,
            hash: blockchainDocument.hash_file,
          };
        }
      }
    }

    return null;
  }

  async getDocumentContent(id: string, currentUser: any) {
    const document = await this.documentRepository.findPreviewById(id);
    if (!document || document.deleted_at) throw new Error('Dokumen tidak ditemukan.');
    if (!this.canAccessDocument(document, currentUser)) {
      throw new Error('Akses ditolak. Anda tidak memiliki akses ke dokumen ini.');
    }

    const file = await this.fileStorageService.getFile(document.file_path);
    return {
      ...file,
      contentType: this.getMimeType(file.contentType, document.file_path),
      fileName: document.nama,
      contentHash: crypto.createHash('sha256').update(file.bytes).digest('hex'),
    };
  }

  async getDocumentPreview(id: string, currentUser: any, activityId?: string) {
    const document = await this.documentRepository.findPreviewById(id);
    if (!document || document.deleted_at) throw new Error('Dokumen tidak ditemukan.');
    if (!this.canAccessDocument(document, currentUser)) {
      throw new Error('Akses ditolak. Anda tidak memiliki akses ke dokumen ini.');
    }

    const file = await this.fileStorageService.getFile(document.file_path);
    const servedHash = crypto.createHash('sha256').update(file.bytes).digest('hex');
    const blockchainRecord = await this.findBlockchainDocumentRecord(document, activityId);
    const blockchainHash = blockchainRecord?.hash || null;

    return {
      id: document.id,
      name: document.nama,
      jenis: document.jenis_dokumen,
      sumber: document.sumber_dokumen,
      tanggalUpload: document.tanggal_upload.toISOString(),
      contentType: this.getMimeType(file.contentType, document.file_path),
      size: file.contentLength,
      databaseHash: document.hash_file,
      contentHash: servedHash,
      contentMatchesDatabase: servedHash === document.hash_file,
      blockchainIntegrity: blockchainRecord ? {
        status: servedHash === blockchainHash ? 'valid' : 'invalid',
        blockchainHash,
        txId: blockchainRecord.txId,
        activityId: blockchainRecord.activityId,
        blockHeight: blockchainRecord.blockHeight,
        confirmations: blockchainRecord.confirmations,
        checkedAt: new Date().toISOString(),
      } : {
        status: 'not_recorded',
        blockchainHash: null,
        txId: null,
        activityId: activityId || null,
        blockHeight: null,
        confirmations: 0,
        checkedAt: new Date().toISOString(),
      },
    };
  }

  mapJenisToEnum(jenis: string): JenisDokumen {
    switch (jenis) {
      case 'SK': return JenisDokumen.SURAT_KEPUTUSAN;
      case 'Surat Tugas': return JenisDokumen.SURAT_TUGAS;
      case 'Laporan Kegiatan': return JenisDokumen.LAPORAN;
      case 'Sertifikat': return JenisDokumen.SERTIFIKAT;
      case 'KONTRAK_PENELITIAN': return JenisDokumen.KONTRAK_PENELITIAN;
      default: return JenisDokumen.BUKTI_PENDUKUNG_LAIN;
    }
  }

  private async getExistingFilePathOrUpload(file: Express.Multer.File, hashFile: string, folder: string) {
    const existingDocument = await this.documentRepository.findByHashFile(hashFile);
    if (existingDocument) return existingDocument.file_path;

    return await this.fileStorageService.uploadFile(file, folder);
  }

  async getDosenDocuments(dosenId: string, query: any) {
    const { tab, search, jenis } = query;
    let whereClause: any = {
      deleted_at: null,
      kepemilikan: { some: { dosen_id: dosenId } }
    };

    if (tab === 'tu') {
      whereClause.sumber_dokumen = 'TATA_USAHA';
    } else if (tab === 'dosen') {
      whereClause.sumber_dokumen = 'UPLOAD_PRIBADI';
    }

    if (search) {
      whereClause.nama = { contains: String(search), mode: 'insensitive' };
    }

    if (jenis && jenis !== 'all') {
      whereClause.jenis_dokumen = this.mapJenisToEnum(String(jenis));
    }

    const documents = await this.documentRepository.findAll(whereClause);
    return documents.map(doc => ({
      id: doc.id,
      name: doc.nama,
      jenis: doc.jenis_dokumen,
      tanggal: doc.tanggal_upload,
      asal: doc.sumber_dokumen === 'TATA_USAHA' ? 'tu' : 'dosen',
      size: 'Undetermined',
      hasHighlight: doc.kepemilikan.some(k => k.highlights.length > 0)
    }));
  }

  async getTUDocuments(currentUser: any) {
    let whereClause: any = {
      deleted_at: null,
      sumber_dokumen: 'TATA_USAHA'
    };

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      if (!currentUser.jurusan_id) throw new Error('Akses ditolak. Yurisdiksi jurusan tidak valid.');
      whereClause.kepemilikan = {
        some: { dosen: { program_studi: { jurusan_id: currentUser.jurusan_id } } }
      };
    }

    return await this.documentRepository.findAll(whereClause);
  }

  async uploadDosenDocument(dosenId: string, data: any, file: Express.Multer.File) {
    const { nama, jenis_dokumen, tanggal_dokumen } = data;
    if (!file || !nama || !jenis_dokumen || !tanggal_dokumen) throw new Error('Semua komponen data formulir wajib diisi.');

    const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const filePath = await this.getExistingFilePathOrUpload(file, hashFile, `dosen_uploads/${dosenId}`);

    return await this.documentRepository.create({
      nama,
      jenis_dokumen: this.mapJenisToEnum(jenis_dokumen),
      file_path: filePath,
      hash_file: hashFile,
      sumber_dokumen: 'UPLOAD_PRIBADI',
      tanggal_upload: new Date(tanggal_dokumen),
    }, [dosenId]);
  }

  async uploadTUDocument(data: any, file: Express.Multer.File) {
    const { nama, jenis_dokumen, tanggal_upload, dosen_penerima_ids } = data;
    if (!file || !nama || !jenis_dokumen || !tanggal_upload || !dosen_penerima_ids) throw new Error('Data formulir dan file wajib diisi.');

    const targetDosenIds: string[] = JSON.parse(dosen_penerima_ids);
    if (targetDosenIds.length === 0) throw new Error('Minimal pilih satu dosen penerima.');

    const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const filePath = await this.getExistingFilePathOrUpload(file, hashFile, 'documents');

    return await this.documentRepository.create({
      nama,
      jenis_dokumen,
      file_path: filePath,
      hash_file: hashFile,
      sumber_dokumen: 'TATA_USAHA',
      tanggal_upload: new Date(tanggal_upload),
    }, targetDosenIds);
  }

  async updateMetadata(id: string, data: any) {
    const { nama, jenis_dokumen, tanggal_upload } = data;
    const existing = await this.documentRepository.findById(id);
    if (!existing) throw new Error('Dokumen tidak ditemukan.');

    return await this.documentRepository.update(id, {
      nama,
      jenis_dokumen,
      tanggal_upload: new Date(tanggal_upload)
    });
  }

  async deleteDocument(id: string, currentUser: any) {
    const targetDoc = await this.documentRepository.findById(id);
    if (!targetDoc) throw new Error('Dokumen tidak ditemukan.');

    if (currentUser.role.toUpperCase() === 'DOSEN') {
      if (targetDoc.sumber_dokumen === 'TATA_USAHA') throw new Error('Akses ditolak. Anda tidak diperbolehkan menghapus dokumen resmi dari Tata Usaha.');
      const isOwner = targetDoc.kepemilikan.some(k => k.dosen_id === currentUser.id);
      if (!isOwner) throw new Error('Akses ilegal. Anda bukan pemilik dokumen ini.');
    }

    return await this.documentRepository.softDelete(id);
  }
}
