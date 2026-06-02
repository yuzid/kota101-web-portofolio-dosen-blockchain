import crypto from 'crypto';
import { JenisDokumen } from '@prisma/client';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileStorageService } from './FileStorageService';
import { UserRepository } from '../repositories/UserRepository';
import { Dokumen } from '../domain/Dokumen';
import { SumberDokumen as DomainSumberDokumen } from '../domain/types';

export class DocumentService {
  private documentRepository: DocumentRepository;
  private fileStorageService: FileStorageService;

  constructor(documentRepository: DocumentRepository, fileStorageService: FileStorageService) {
    this.documentRepository = documentRepository;
    this.fileStorageService = fileStorageService;
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
      hasHighlight: doc.lampiran_bukti.some(l => (l as any).highlight.length > 0)
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
    const filePath = await this.fileStorageService.uploadFile(file, `dosen_uploads/${dosenId}`);

    return await this.documentRepository.create({
      nama,
      jenis_dokumen: this.mapJenisToEnum(jenis_dokumen),
      file_path: filePath,
      hash_file: hashFile,
      sumber_dokumen: 'UPLOAD_PRIBADI',
      tanggal_upload: new Date(tanggal_dokumen),
    }, [dosenId]);
  }

  async uploadTUDocument(tuId: string, data: any, file: Express.Multer.File, userRepository: UserRepository) {
    const { nama, jenis_dokumen, tanggal_upload, dosen_penerima_ids } = data;
    if (!file || !nama || !jenis_dokumen || !tanggal_upload || !dosen_penerima_ids) throw new Error('Data formulir dan file wajib diisi.');

    const targetDosenIds: string[] = JSON.parse(dosen_penerima_ids);
    if (targetDosenIds.length === 0) throw new Error('Minimal pilih satu dosen penerima.');

    const tu = await userRepository.findTataUsahaById(tuId);
    if (!tu) throw new Error('Otentikasi TU tidak valid.');

    const recipients = await userRepository.findDosenByIds(targetDosenIds);

    const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const filePath = await this.fileStorageService.uploadFile(file, 'documents');

    const domainDoc = new Dokumen(
      nama,
      this.mapJenisToEnum(jenis_dokumen) as any,
      filePath,
      hashFile,
      DomainSumberDokumen.TATA_USAHA,
      new Date(tanggal_upload)
    );

    // Call domain logic
    tu.distribusiDokumen(recipients, domainDoc);

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
