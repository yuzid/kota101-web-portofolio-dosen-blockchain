/**
 * Unit tests: services
 * Fokus: public method service dipanggil langsung, dependency dimock.
 */

import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';

import { AkademikService } from '../services/AkademikService';
import { JabatanService } from '../services/JabatanService';
import { HighlightService } from '../services/HighlightService';
import { Kajur } from '../services/Kajur';
import { Kaprodi } from '../services/Kaprodi';
import { AuthService } from '../services/AuthService';
import { AdminUserService } from '../services/AdminUserService';
import { DocumentService } from '../services/DocumentService';
import { DocumentDistributionService } from '../services/DocumentDistributionService';
import { ActivityService } from '../services/ActivityService';
import { EmailService } from '../services/EmailService';
import { FileStorageService } from '../services/FileStorageService';
import { MultiChainService } from '../services/MultiChainService';

const mockRekapRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../repositories/RekapRepository', () => ({
  RekapRepository: jest.fn().mockImplementation(() => mockRekapRepository),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken,
    })),
    __mockVerifyIdToken: verifyIdToken,
  };
});

const sendMailMock = jest.fn();
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
  },
}));

const s3SendMock = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: s3SendMock })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ kind: 'put', input })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ kind: 'get', input })),
}));

const VALID_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';

const file = {
  originalname: 'test.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('PDFTEST'),
} as Express.Multer.File;

function makeActivity(overrides: any = {}) {
  return {
    id: VALID_ID,
    dosen_id: VALID_ID,
    nama_kegiatan: 'Kegiatan Test',
    kategori_tridharma: 'PENELITIAN',
    jenis_kegiatan: 'PENELITIAN',
    tanggal_mulai: new Date('2025-01-01'),
    tanggal_selesai: new Date('2025-01-02'),
    periode: '2024/2025',
    semester: 'GANJIL',
    tx_id: 'tx-old',
    jenis_bukti: 'BERSAMA',
    dosen: {
      id: VALID_ID,
      nip: '123',
      nidn: '456',
      nama: 'Dosen Owner',
      chain_address: 'addr-owner',
      program_studi: { id: 'prodi-1', kode_prodi: 'D4-TI', nama_prodi: 'D4 Teknik Informatika', blockchain_node: 'D4' },
      user: { email: 'owner@example.com' },
    },
    partisipasi: [
      {
        id: 'part-owner',
        dosen_id: VALID_ID,
        kegiatan_tridharma_id: VALID_ID,
        peran: 'KETUA',
        status: 'DITERIMA',
        dosen: { nama: 'Dosen Owner', nip: '123', nidn: '456', user: { email: 'owner@example.com' } },
      },
    ],
    lampiran_bukti: [
      {
        id: OTHER_ID,
        dokumen_id: 'doc-1',
        dokumen: {
          id: 'doc-1',
          nama: 'Dokumen Test',
          jenis_dokumen: 'SERTIFIKAT',
          sumber_dokumen: 'UPLOAD_PRIBADI',
          tanggal_upload: new Date('2025-01-03'),
          hash_file: 'hash-db',
          kepemilikan: [{ dosen_id: VALID_ID, highlights: [{ id: 'hl-1' }] }],
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.AUDIT_STREAM_NAME = 'audit';
  process.env.MULTICHAIN_N1_IP = '127.0.0.1';
  process.env.MULTICHAIN_N1_RPC_PORT = '1234';
  process.env.MULTICHAIN_N1_RPC_USERNAME = 'user';
  process.env.MULTICHAIN_N1_RPC_PASSWORD = 'pass';
  process.env.MULTICHAIN_N2_IP = '127.0.0.2';
  process.env.MULTICHAIN_N2_RPC_PORT = '1234';
  process.env.MULTICHAIN_N2_RPC_USERNAME = 'user';
  process.env.MULTICHAIN_N2_RPC_PASSWORD = 'pass';
  process.env.MULTICHAIN_N3_IP = '127.0.0.3';
  process.env.MULTICHAIN_N3_RPC_PORT = '1234';
  process.env.MULTICHAIN_N3_RPC_USERNAME = 'user';
  process.env.MULTICHAIN_N3_RPC_PASSWORD = 'pass';
  (prisma.lampiranBukti.findFirst as jest.Mock).mockResolvedValue(null);
});

describe('AkademikService unit', () => {
  let repo: any;
  let service: AkademikService;

  beforeEach(() => {
    repo = {
      findAllJurusan: jest.fn().mockResolvedValue([]),
      findJurusanById: jest.fn().mockResolvedValue({ id: 'jurusan-1', kode_jurusan: 'TI', program_studi: [] }),
      findJurusanByKode: jest.fn().mockResolvedValue(null),
      createJurusan: jest.fn().mockResolvedValue({ id: 'jurusan-1' }),
      updateJurusan: jest.fn().mockResolvedValue({ id: 'jurusan-1' }),
      deleteJurusan: jest.fn().mockResolvedValue({}),
      findAllProdi: jest.fn().mockResolvedValue([]),
      findProdiById: jest.fn().mockResolvedValue({ id: 'prodi-1', kode_prodi: 'IF', dosen: [] }),
      findProdiByKode: jest.fn().mockResolvedValue(null),
      createProdi: jest.fn().mockResolvedValue({ id: 'prodi-1' }),
      updateProdi: jest.fn().mockResolvedValue({ id: 'prodi-1' }),
      deleteProdi: jest.fn().mockResolvedValue({}),
    };
    service = new AkademikService(repo);
  });

  it('menjalankan semua method jurusan dan prodi', async () => {
    await service.getAllJurusan();
    await service.getJurusanById('jurusan-1');
    await service.createJurusan({ kode_jurusan: 'TI', nama_jurusan: 'Teknik' });
    await service.updateJurusan('jurusan-1', { nama_jurusan: 'Teknik Baru' });
    await service.deleteJurusan('jurusan-1');
    await service.getAllProdi('jurusan-1');
    await service.getProdiById('prodi-1');
    await service.createProdi({ kode_prodi: 'IF', nama_prodi: 'Informatika', jurusan_id: 'jurusan-1' });
    await service.updateProdi('prodi-1', { nama_prodi: 'Informatika Baru' });
    await service.deleteProdi('prodi-1');

    expect(repo.createJurusan).toHaveBeenCalledWith({ kode_jurusan: 'TI', nama_jurusan: 'Teknik' });
    expect(repo.findAllProdi).toHaveBeenCalledWith({ jurusan_id: 'jurusan-1' });
  });

  it('melempar error validasi duplikat dan data tidak ditemukan', async () => {
    repo.findJurusanByKode.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.createJurusan({ kode_jurusan: 'TI', nama_jurusan: 'Teknik' })).rejects.toThrow(/sudah digunakan/);

    repo.findProdiById.mockResolvedValueOnce(null);
    await expect(service.getProdiById('missing')).rejects.toThrow(/tidak ditemukan/);
  });
});

describe('JabatanService unit', () => {
  let repo: any;
  let service: JabatanService;

  beforeEach(() => {
    repo = {
      findAllKajur: jest.fn().mockResolvedValue([]),
      findKajurById: jest.fn().mockResolvedValue({ id: 'kajur-1', dosen_id: 'dosen-1', jurusan_id: 'jurusan-1', periode_mulai: new Date('2025-01-01'), periode_selesai: new Date('2025-12-31') }),
      findOverlapKajur: jest.fn().mockResolvedValue(null),
      createKajur: jest.fn().mockResolvedValue({ id: 'kajur-1' }),
      updateKajur: jest.fn().mockResolvedValue({ id: 'kajur-1' }),
      deleteKajur: jest.fn().mockResolvedValue({}),
      findAllKaprodi: jest.fn().mockResolvedValue([]),
      findKaprodiById: jest.fn().mockResolvedValue({ id: 'kaprodi-1', dosen_id: 'dosen-1', program_studi_id: 'prodi-1', periode_mulai: new Date('2025-01-01'), periode_selesai: new Date('2025-12-31') }),
      findOverlapKaprodi: jest.fn().mockResolvedValue(null),
      createKaprodi: jest.fn().mockResolvedValue({ id: 'kaprodi-1' }),
      updateKaprodi: jest.fn().mockResolvedValue({ id: 'kaprodi-1' }),
      deleteKaprodi: jest.fn().mockResolvedValue({}),
      findDosenById: jest.fn().mockResolvedValue({ id: 'dosen-1' }),
    };
    service = new JabatanService(repo);
  });

  it('menjalankan semua method kajur dan kaprodi', async () => {
    await service.getAllKajur({ jurusan_id: 'jurusan-1' });
    await service.createKajur({ dosen_id: 'dosen-1', jurusan_id: 'jurusan-1', periode_mulai: '2025-01-01', periode_selesai: '2025-12-31' });
    await service.updateKajur('kajur-1', { dosen_id: 'dosen-2' });
    await service.deleteKajur('kajur-1');
    await service.getAllKaprodi({ program_studi_id: 'prodi-1' });
    await service.createKaprodi({ dosen_id: 'dosen-1', program_studi_id: 'prodi-1', periode_mulai: '2025-01-01', periode_selesai: '2025-12-31' });
    await service.updateKaprodi('kaprodi-1', { dosen_id: 'dosen-2' });
    await service.deleteKaprodi('kaprodi-1');

    expect(repo.findAllKajur).toHaveBeenCalledWith({ jurusan_id: 'jurusan-1' });
    expect(repo.findAllKaprodi).toHaveBeenCalledWith({ program_studi_id: 'prodi-1' });
  });

  it('menolak periode tidak valid', async () => {
    await expect(service.createKajur({ dosen_id: 'dosen-1', jurusan_id: 'jurusan-1', periode_mulai: '2025-12-31', periode_selesai: '2025-01-01' })).rejects.toThrow(/harus sebelum/);
  });
});

describe('AuthService unit', () => {
  let repo: any;
  let service: AuthService;

  beforeEach(() => {
    repo = {
      findByEmail: jest.fn().mockResolvedValue({
        id: VALID_ID,
        email: 'dosen@example.com',
        password_hash: 'hash',
        role: 'DOSEN',
        dosen: { nama: 'Dosen', program_studi: { nama_prodi: 'Informatika' }, jabatan_kajur: [], jabatan_kaprodi: [] },
      }),
    };
    service = new AuthService(repo);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('login sukses menghasilkan token', async () => {
    const result = await service.login('dosen@example.com', 'password');
    expect(result?.token).toBeDefined();
    expect(result?.role).toBe('DOSEN');
  });

  it('login mengembalikan null saat user/password salah', async () => {
    repo.findByEmail.mockResolvedValueOnce(null);
    await expect(service.login('missing@example.com', 'password')).resolves.toBeNull();

    repo.findByEmail.mockResolvedValueOnce({ email: 'x', password_hash: 'hash', role: 'ADMIN' });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.login('x@example.com', 'wrong')).resolves.toBeNull();
  });

  it('googleLogin sukses dan error saat email belum terdaftar', async () => {
    const verifyIdToken = require('google-auth-library').__mockVerifyIdToken;
    verifyIdToken.mockResolvedValueOnce({ getPayload: () => ({ email: 'dosen@example.com' }) });
    await expect(service.googleLogin('google-token')).resolves.toMatchObject({ email: 'dosen@example.com' });

    verifyIdToken.mockResolvedValueOnce({ getPayload: () => ({ email: 'missing@example.com' }) });
    repo.findByEmail.mockResolvedValueOnce(null);
    await expect(service.googleLogin('google-token')).rejects.toThrow(/belum terdaftar/);
  });
});

describe('AdminUserService unit', () => {
  let repo: any;
  let service: AdminUserService;

  beforeEach(() => {
    repo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: 'user-1', role: 'DOSEN', dosen: { program_studi: { jurusan_id: 'jurusan-1' } } }),
      findByIdWithDosen: jest.fn().mockResolvedValue({ id: 'user-1', email: 'a@example.com', role: 'DOSEN', dosen: { program_studi: { jurusan_id: 'jurusan-1' } } }),
      findByEmail: jest.fn().mockResolvedValue(null),
      findProgramStudi: jest.fn().mockResolvedValue({ id: 'prodi-1', kode_prodi: 'D4-TI', nama_prodi: 'D4 Teknik Informatika', blockchain_node: 'D4' }),
      findProgramStudiById: jest.fn().mockResolvedValue({ id: 'prodi-1', kode_prodi: 'D4-TI', nama_prodi: 'D4 Teknik Informatika', blockchain_node: 'D4' }),
      create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new AdminUserService(repo);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  it('menjalankan semua method user management', async () => {
    await service.getAllUsers({ role: 'ADMIN' }, 'dosen');
    await service.getUserById('user-1', { role: 'ADMIN' });
    await service.createUser({ email: 'dosen@example.com', password: 'password123', role: 'DOSEN', nama: 'Dosen', nip: '123', nidn: '456', program_studi_id: 'prodi-1' }, { role: 'ADMIN' });
    await service.updateUser('user-1', { email: 'baru@example.com', nama: 'Dosen', nip: '123', nidn: '456' }, { role: 'ADMIN' });
    await service.deleteUser('user-1', { id: 'admin-1', role: 'ADMIN' });

    expect(repo.findAll).toHaveBeenCalledWith({ role: 'DOSEN' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      dosen: {
        create: {
          nip: '123',
          nidn: '456',
          nama: 'Dosen',
          program_studi_id: 'prodi-1',
          chain_address: 'UNUSED_LEGACY_FIELD',
        },
      },
    }));
    expect(repo.delete).toHaveBeenCalledWith('user-1');
  });

  it('menolak hapus akun sendiri', async () => {
    await expect(service.deleteUser('user-1', { id: 'user-1', role: 'ADMIN' })).rejects.toThrow(/akun sendiri/);
  });
});

describe('HighlightService unit', () => {
  let repo: any;
  let activity: any;
  let service: HighlightService;

  beforeEach(() => {
    repo = {
      findByKepemilikanId: jest.fn().mockResolvedValue([{ id: 'hl-1' }]),
      findKepemilikanId: jest.fn().mockResolvedValue('kep-1'),
      verifyKepemilikanOwnership: jest.fn().mockResolvedValue(true),
      deleteByKepemilikanId: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      findById: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      verifyOwnership: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      findDocumentIdByKepemilikanId: jest.fn().mockResolvedValue('doc-1'),
      findDocumentIdByHighlightId: jest.fn().mockResolvedValue('doc-1'),
    };
    activity = { publishDocumentChangeSnapshots: jest.fn().mockResolvedValue([]) };
    service = new HighlightService(repo, activity);
  });

  it('menjalankan semua method highlight', async () => {
    await service.getHighlightsByDocument('kep-1');
    await service.getHighlightsByDocumentAndDosen('doc-1', 'dosen-1');
    await service.syncHighlights('kep-1', [{ page_number: 1, highlighted_text: 'teks', highlight_rect: [{ x1: 1, x2: 2, y1: 3, y2: 4, width: 1, height: 1 }] }], 'dosen-1');
    await service.addHighlight('kep-1', { page_number: 1, highlighted_text: 'teks', highlight_rect: [] }, 'dosen-1');
    await service.updateHighlight('hl-1', { highlighted_text: 'baru' }, 'dosen-1');
    await service.deleteHighlight('hl-1', 'dosen-1');

    expect(repo.deleteByKepemilikanId).toHaveBeenCalledWith('kep-1');
    expect(repo.update).toHaveBeenCalledWith('hl-1', { highlighted_text: 'baru' });
    expect(activity.publishDocumentChangeSnapshots).toHaveBeenCalled();
  });

  it('menolak highlight bukan pemilik', async () => {
    repo.verifyOwnership.mockResolvedValueOnce(false);
    await expect(service.updateHighlight('hl-1', {}, 'dosen-lain')).rejects.toThrow(/tidak memiliki akses/);
  });
});

describe('Kajur dan Kaprodi service unit', () => {
  it('mendelegasikan filter ke ActivityRepository', async () => {
    const repo = {
      findByJurusan: jest.fn().mockResolvedValue({ data: [] }),
      findByProdi: jest.fn().mockResolvedValue({ data: [] }),
    };

    await new Kajur(repo as any, 'jurusan-1').getDaftarKegiatanTridharmaJurusan({ search: 'x' } as any, { page: 1, size: 10 });
    await new Kaprodi(repo as any, 'prodi-1').getDaftarKegiatanTridharmaProdi({ search: 'x' } as any, { page: 1, size: 10 });

    expect(repo.findByJurusan).toHaveBeenCalledWith('jurusan-1', { search: 'x' }, { page: 1, size: 10 });
    expect(repo.findByProdi).toHaveBeenCalledWith('prodi-1', { search: 'x' }, { page: 1, size: 10 });
  });
});

describe('DocumentService unit', () => {
  let repo: any;
  let storage: any;
  let chain: any;
  let activity: any;
  let service: DocumentService;
  const doc = {
    id: 'doc-1',
    nama: 'Dokumen.pdf',
    jenis_dokumen: 'SERTIFIKAT',
    sumber_dokumen: 'UPLOAD_PRIBADI',
    tanggal_upload: new Date('2025-01-01'),
    file_path: 'folder/file.pdf',
    hash_file: 'hash-db',
    deleted_at: null,
    kepemilikan: [{ dosen_id: VALID_ID, highlights: [{ id: 'hl-1' }] }],
    lampiran_bukti: [],
  };

  beforeEach(() => {
    repo = {
      findPreviewById: jest.fn().mockResolvedValue(doc),
      findByHashFile: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      findAll: jest.fn().mockResolvedValue([doc]),
      findById: jest.fn().mockResolvedValue(doc),
      update: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      softDelete: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      findAllPublic: jest.fn().mockResolvedValue([doc]),
      findByIdPublic: jest.fn().mockResolvedValue(doc),
    };
    storage = {
      getFile: jest.fn().mockResolvedValue({ bytes: Buffer.from('PDFTEST'), contentType: 'application/octet-stream', contentLength: 7 }),
      uploadFile: jest.fn().mockResolvedValue('folder/upload.pdf'),
    };
    chain = { getJsonStreamItems: jest.fn().mockResolvedValue([]) };
    activity = { publishDocumentChangeSnapshots: jest.fn().mockResolvedValue([]) };
    service = new DocumentService(repo, storage, chain, activity);
  });

  it('menjalankan semua method dokumen', async () => {
    const user = { id: VALID_ID, role: 'DOSEN', jabatan: {} };

    await service.getDocumentContent('doc-1', user);
    await service.getDocumentPreview('doc-1', user);
    expect(service.mapJenisToEnum(' Sertifikat ')).toBe('SERTIFIKAT');
    await service.getDosenDocuments(VALID_ID, { tab: 'dosen', search: 'Dok', jenis: 'SERTIFIKAT' });
    await service.getTUDocuments({ role: 'ADMIN' });
    await service.uploadDosenDocument(VALID_ID, { nama: 'Dok', jenis_dokumen: 'SERTIFIKAT', tanggal_dokumen: '2025-01-01' }, file);
    await service.uploadTUDocument({ nama: 'Dok', jenis_dokumen: 'SK', tanggal_upload: '2025-01-01', dosen_penerima_ids: JSON.stringify([VALID_ID]) }, file);
    await service.updateMetadata('doc-1', { nama: 'Baru', jenis_dokumen: 'SK', tanggal_upload: '2025-02-01' }, user);
    await expect(service.replaceFile('doc-1', file, user)).rejects.toThrow(/tidak diperbolehkan/);
    await service.deleteDocument('doc-1', user);
    await service.getPublicDocuments();
    await service.getPublicDocumentById('doc-1');
    await service.getPublicDocumentContent('doc-1');

    expect(repo.create).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalled();
    expect(activity.publishDocumentChangeSnapshots).toHaveBeenCalledWith('doc-1', 'DOKUMEN_METADATA_UPDATED');
    expect(repo.softDelete).toHaveBeenCalledWith('doc-1');
  });

  it('menolak akses dokumen dosen bukan pemilik', async () => {
    await expect(service.getDocumentContent('doc-1', { id: OTHER_ID, role: 'DOSEN', jabatan: {} })).rejects.toThrow(/Akses ditolak/);
  });
});

describe('DocumentDistributionService unit', () => {
  let distributionRepo: any;
  let documentRepo: any;
  let storage: any;
  let email: any;
  let service: DocumentDistributionService;

  beforeEach(() => {
    distributionRepo = {
      findDistributedDosenIds: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findDosenRecipientsByIds: jest.fn().mockResolvedValue([{ nama: 'Dosen', user: { email: 'dosen@example.com' } }]),
      findTataUsahaSenderByUserId: jest.fn().mockResolvedValue({ tata_usaha: { nama: 'TU' } }),
      findByDokumen: jest.fn().mockResolvedValue([{ id: 'dist-1' }]),
      findPendingByDosen: jest.fn().mockResolvedValue([{ id: 'dist-1' }]),
      findByDosen: jest.fn().mockResolvedValue([{ id: 'dist-1', dokumen_id: 'doc-1', dokumen: { nama: 'Dok', jenis_dokumen: 'SK' }, didistribusikan_oleh: { tata_usaha: { nama: 'TU' } }, status: 'DISETUJUI' }]),
      findDistributionByDosenAndDokumen: jest.fn().mockResolvedValue({ id: 'dist-1', status: 'MENUNGGU_KONFIRMASI' }),
      updateStatus: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({ id: 'dist-1' }),
      resetStatus: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };
    documentRepo = {
      create: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      findById: jest.fn().mockResolvedValue({ id: 'doc-1', nama: 'Dokumen' }),
      findAll: jest.fn().mockResolvedValue([{ id: 'doc-1' }]),
    };
    storage = { uploadFile: jest.fn().mockResolvedValue('folder/file.pdf') };
    email = { notifyDocumentDistribution: jest.fn().mockResolvedValue(undefined) };
    service = new DocumentDistributionService(distributionRepo, documentRepo, storage, email);
  });

  it('menjalankan semua method distribusi dokumen', async () => {
    await service.saveDraft({ nama: 'Dok', jenis_dokumen: 'SK', tanggal_upload: '2025-01-01' }, file);
    await service.distribute('tu-1', { nama: 'Dok', jenis_dokumen: 'SK', tanggal_upload: '2025-01-01', dosen_penerima_ids: JSON.stringify([VALID_ID]) }, file);
    await service.getDistribusiByDokumen('doc-1', { role: 'ADMIN' });
    await service.getDokumenWithDistribusi('doc-1');
    await service.getTUDokumenWithDistribusi({ role: 'TATA_USAHA', jurusan_id: 'jurusan-1' });
    await service.getPendingRequests(VALID_ID);
    await service.getDosenDistributionHistory(VALID_ID);
    await service.acceptDocument(VALID_ID, 'doc-1');
    await service.rejectDocument(VALID_ID, 'doc-1');
    await service.resendDistribution('tu-1', 'dist-1');
    await service.deleteDistribution('tu-1', 'dist-1');

    expect(distributionRepo.createMany).toHaveBeenCalled();
    expect(distributionRepo.updateStatus).toHaveBeenCalledWith('dist-1', 'DITOLAK');
    expect(distributionRepo.delete).toHaveBeenCalledWith('dist-1');
  });

  it('menolak distribusi tanpa penerima', async () => {
    await expect(service.distribute('tu-1', {}, undefined)).rejects.toThrow(/Penerima dokumen wajib dipilih/);
  });
});

describe('ActivityService unit', () => {
  let repo: any;
  let chain: any;
  let email: any;
  let service: ActivityService;

  beforeEach(() => {
    repo = {
      findAll: jest.fn().mockResolvedValue([makeActivity()]),
      findSummaryStats: jest.fn().mockResolvedValue({ activities: [makeActivity()], total_dokumen: 1 }),
      findTanpaBukti: jest.fn().mockResolvedValue([makeActivity()]),
      findById: jest.fn().mockResolvedValue(makeActivity()),
      create: jest.fn().mockResolvedValue({ id: VALID_ID }),
      update: jest.fn().mockResolvedValue({ id: VALID_ID }),
      updateTransactionId: jest.fn().mockResolvedValue({ id: VALID_ID, tx_id: 'tx-new' }),
      delete: jest.fn().mockResolvedValue({}),
      createLampiran: jest.fn().mockResolvedValue({ id: OTHER_ID }),
      deleteLampiran: jest.fn().mockResolvedValue({}),
      findPendingConfirmations: jest.fn().mockResolvedValue([{ id: 'part-1', kegiatan_tridharma_id: VALID_ID, kegiatan_tridharma: { nama_kegiatan: 'Kegiatan', dosen: { nama: 'Owner' } }, status: 'MENUNGGU_KONFIRMASI' }]),
      findParticipationById: jest.fn().mockResolvedValue({ id: OTHER_ID, dosen_id: VALID_ID, kegiatan_tridharma_id: VALID_ID, dosen: { nama: 'Anggota' }, kegiatan_tridharma: { nama_kegiatan: 'Kegiatan', dosen: { nama: 'Owner', user: { email: 'owner@example.com' } } } }),
      updateParticipationStatus: jest.fn().mockResolvedValue({ id: OTHER_ID }),
      getActivityDocumentIds: jest.fn().mockResolvedValue(['doc-1']),
      createKepemilikanIfNotExists: jest.fn().mockResolvedValue(undefined),
      getDiterimaMemberIds: jest.fn().mockResolvedValue([VALID_ID]),
      createParticipation: jest.fn().mockResolvedValue({ id: 'part-new' }),
      deleteParticipation: jest.fn().mockResolvedValue({ count: 1 }),
      findAllPublic: jest.fn().mockResolvedValue([makeActivity()]),
      findByIdPublic: jest.fn().mockResolvedValue(makeActivity()),
    };
    chain = {
      publishJson: jest.fn().mockResolvedValue('tx-new'),
      getJsonStreamItems: jest.fn().mockResolvedValue([{ txid: 'tx-1', confirmations: 1, publishers: ['addr'], keys: [VALID_ID], data: { json: { event_type: 'TEST', pencatat: { nama: 'Dosen' }, kegiatan: { nama_kegiatan: 'Kegiatan' }, dokumen_pendukung: [] } }, valid: true }]),
    };
    email = {
      sendMany: jest.fn().mockResolvedValue(undefined),
      notifyActivityDecision: jest.fn().mockResolvedValue(undefined),
    };
    service = new ActivityService(repo, chain, email);
  });

  it('menjalankan helper public dan method read', async () => {
    expect(service.isValidUUID(VALID_ID)).toBe(true);
    expect(service.isValidUUID('bad-id')).toBe(false);
    expect(String(service.mapKategoriTridharma('penelitian'))).toBe('PENELITIAN');
    expect(String(service.mapJenisKegiatan('publikasi jurnal'))).toBe('PUBLIKASI_KARYA');

    await service.getAllActivities(VALID_ID);
    await service.getSummaryStats(VALID_ID);
    await service.getTanpaBukti(VALID_ID);
    await service.getActivityById(VALID_ID, VALID_ID);
    await service.getAuditTrail(VALID_ID);
    await service.getPendingConfirmations(VALID_ID);
    await service.getPublicActivities();
    await service.getPublicActivityById(VALID_ID);

    expect(repo.findAll).toHaveBeenCalledWith(VALID_ID);
    expect(chain.getJsonStreamItems).toHaveBeenCalled();
  });

  it('menjalankan method mutasi activity', async () => {
    await service.createActivity(VALID_ID, {
      namaKegiatan: 'Kegiatan',
      jenisTridharma: 'penelitian',
      kategori: 'penelitian',
      tanggalMulai: '2025-01-01',
      tanggalSelesai: '2025-01-02',
      tahunAkademik: '2024/2025',
      semester: 'ganjil',
      anggota_ids: [OTHER_ID],
      lampiran_ids: ['doc-1'],
      jenisBukti: 'BERSAMA',
    });
    await service.updateActivity(VALID_ID, VALID_ID, { namaKegiatan: 'Update' });
    await service.deleteActivity(VALID_ID, VALID_ID);
    await service.addLampiran(VALID_ID, OTHER_ID, VALID_ID);
    await service.deleteLampiran(VALID_ID, OTHER_ID, VALID_ID);
    await service.acceptParticipation(OTHER_ID, VALID_ID);
    await service.rejectParticipation(OTHER_ID, VALID_ID);
    await service.addMember(VALID_ID, VALID_ID, OTHER_ID);
    await service.removeMember(VALID_ID, VALID_ID, OTHER_ID);

    expect(repo.create).toHaveBeenCalled();
    expect(repo.updateTransactionId).toHaveBeenCalled();
    expect(repo.deleteParticipation).toHaveBeenCalledWith(OTHER_ID, VALID_ID);
  });

  it('melempar error format id invalid', async () => {
    await expect(service.getActivityById('bad-id')).rejects.toThrow(/Format ID/);
  });
});

describe('RekapService unit', () => {
  it('menjalankan semua method rekap', async () => {
    const { RekapService } = await import('../services/RekapService');
    const service = new RekapService();
    mockRekapRepository.create.mockResolvedValue({ id: 'rekap-1' });
    mockRekapRepository.findAll.mockResolvedValue([{ id: 'rekap-1' }]);
    mockRekapRepository.findById.mockResolvedValue({ id: 'rekap-1', nama: 'Lama', riwayat: [] });
    mockRekapRepository.update.mockResolvedValue({ id: 'rekap-1', nama: 'Baru' });
    mockRekapRepository.delete.mockResolvedValue({ id: 'rekap-1' });

    await service.createRekap({ nama: 'Rekap', tanggalPerekapan: new Date('2025-01-01'), dibuatOlehId: VALID_ID, filter: {}, kegiatanData: [] });
    await service.getAllRekap({ jurusan_id: 'jurusan-1' } as any);
    await service.getRekapDetail('rekap-1');
    await service.updateRekap('rekap-1', { nama: 'Baru', dilakukanOlehName: 'Dosen' });
    await service.deleteRekap('rekap-1');

    expect(mockRekapRepository.create).toHaveBeenCalled();
    expect(mockRekapRepository.update).toHaveBeenCalledWith('rekap-1', expect.objectContaining({ nama: 'Baru' }));
  });
});

describe('EmailService unit', () => {
  it('send, sendMany, dan notifikasi mengirim email saat SMTP lengkap', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_FROM = 'noreply@example.com';

    const service = new EmailService();
    await service.send({ to: { email: 'a@example.com', nama: 'A' }, subject: 'Subjek', text: 'Isi' });
    await service.sendMany([{ to: { email: 'b@example.com' }, subject: 'S', text: 'T' }]);
    await service.notifyDocumentDistribution([{ email: 'c@example.com', nama: 'C' }], 'Dokumen', 'TU');
    await service.notifyActivityInvitation({ email: 'd@example.com', nama: 'D' }, 'Kegiatan', 'Owner');
    await service.notifyActivityDecision({ email: 'e@example.com', nama: 'E' }, 'Kegiatan', 'Anggota', 'DITERIMA');

    expect((nodemailer as any).createTransport).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
  });
});

describe('FileStorageService unit', () => {
  it('uploadFile dan getFile memakai S3 client', async () => {
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.AWS_S3_BUCKET = 'bucket-test';
    s3SendMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: { transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array(Buffer.from('PDF'))) },
        ContentType: 'application/pdf',
        ContentLength: 3,
      });

    const service = new FileStorageService();
    await expect(service.uploadFile(file, 'documents')).resolves.toMatch(/^https:\/\/bucket-test/);
    await expect(service.getFile('https://bucket-test.s3.ap-southeast-1.amazonaws.com/documents/test.pdf')).resolves.toMatchObject({ contentType: 'application/pdf', contentLength: 3 });

    expect(S3Client).toHaveBeenCalled();
    expect(PutObjectCommand).toHaveBeenCalled();
    expect(GetObjectCommand).toHaveBeenCalled();
  });
});

describe('MultiChainService unit', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('menjalankan semua RPC public method', async () => {
    const responses = [
      'tx-publish',
      'tx-publish-2',
      'tx-publish-3',
      [
        { txid: 'tx-1', confirmations: 1, blocktime: 2, publishers: ['addr'], keys: ['k'], data: { json: { a: 1 } }, valid: true },
        { txid: 'tx-0', confirmations: 1, blocktime: 1, publishers: ['addr'], keys: ['k'], data: { json: { a: 0 } }, valid: true },
      ],
    ];

    (global.fetch as jest.Mock).mockImplementation(() => {
      const result = responses.shift();
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ result }) });
    });

    const service = new MultiChainService();
    await expect(service.publishJson('key-1', { ok: true })).resolves.toBe('tx-publish');
    await expect(service.publishJson('key-2', { ok: true })).resolves.toBe('tx-publish-2');
    await expect(service.publishJson('key-3', { ok: true })).resolves.toBe('tx-publish-3');
    await expect(service.getJsonStreamItems('key')).resolves.toHaveLength(2);

    expect(global.fetch).toHaveBeenCalled();
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe('http://127.0.0.1:1234');
    expect(calls[1][0]).toBe('http://127.0.0.2:1234');
    expect(calls[2][0]).toBe('http://127.0.0.3:1234');
    expect(JSON.parse(calls[0][1].body)).toMatchObject({
      method: 'publish',
      params: ['audit', 'key-1', { json: { ok: true } }],
    });
  });
});
