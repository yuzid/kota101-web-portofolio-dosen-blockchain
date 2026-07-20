/**
 * Test Suite: Kaprodi (Ketua Program Studi)
 * Role: DOSEN dengan JabatanKaprodi aktif
 * Base Path: /api/dosen/akademik-role/prodi/*
 *
 * Strategi:
 * - Kaprodi adalah dosen biasa dengan jabatan struktural aktif
 * - Middleware hanya cek role 'dosen', controller cek JabatanKaprodi aktif di DB
 * - Prisma di-mock, sehingga kita kontrol apakah jabatan aktif ditemukan atau tidak
 * - Test yurisdiksi (lampiran dari prodi lain harus ditolak)
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';

// ─── Mock eksternal dependencies ─────────────────────────────────────────────

// Mock prisma
const mockPrismaJabatanKaprodi = { findFirst: jest.fn() };
const mockPrismaJabatanKajur = { findFirst: jest.fn() };
const mockPrismaKepemilikanDokumen = { findUnique: jest.fn(), findFirst: jest.fn() };
const mockPrismaRekapLaporan = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
const mockPrismaProgramStudi = { findMany: jest.fn() };
const mockPrismaUser = { findUnique: jest.fn() };

jest.mock('../lib/prisma', () => ({
  prisma: {
    jabatanKaprodi: mockPrismaJabatanKaprodi,
    jabatanKajur: mockPrismaJabatanKajur,
    kepemilikanDokumen: mockPrismaKepemilikanDokumen,
    rekapLaporan: mockPrismaRekapLaporan,
    user: mockPrismaUser,
    programStudi: mockPrismaProgramStudi,
  },
}));

// Mock ActivityRepository agar tidak butuh DB
jest.mock('../repositories/ActivityRepository', () => ({
  ActivityRepository: jest.fn().mockImplementation(() => ({
    findByProdi: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, size: 10 }),
    findProdiSummaryStats: jest.fn().mockResolvedValue({ totalKegiatan: 0, perKategori: {} }),
    findByJurusan: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, size: 10 }),
    findJurusanSummaryStats: jest.fn().mockResolvedValue({ totalKegiatan: 0 }),
  })),
}));

// Mock RekapService
jest.mock('../services/RekapService', () => ({
  RekapService: jest.fn().mockImplementation(() => ({
    createRekap: jest.fn().mockResolvedValue({ id: 'rekap-new-001', nama: 'Rekap Test' }),
    getAllRekap: jest.fn().mockImplementation(() => mockPrismaRekapLaporan.findMany()),
    getRekapDetail: jest.fn().mockResolvedValue(null),
    updateRekap: jest.fn().mockResolvedValue({ id: 'rekap-001' }),
    deleteRekap: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock DocumentService (untuk lampiran)
jest.mock('../services/DocumentService', () => ({
  DocumentService: jest.fn().mockImplementation(() => ({
    getDocumentPreview: jest.fn().mockResolvedValue({ url: 'https://s3.example.com/doc.pdf' }),
    getDocumentContent: jest.fn().mockResolvedValue({
      contentType: 'application/pdf',
      contentLength: 1024,
      fileName: 'test.pdf',
      contentHash: 'abc123',
      bytes: Buffer.from('PDF content'),
    }),
  })),
}));

jest.mock('../repositories/DocumentRepository', () => ({
  DocumentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../services/FileStorageService', () => ({
  FileStorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue('https://s3.example.com/file.pdf'),
    getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/signed'),
    getFileContent: jest.fn().mockResolvedValue({ Body: Buffer.from('content'), ContentType: 'application/pdf' }),
  })),
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_SECRET = JWT_SECRET;

const KAPRODI_USER_ID = 'kaprodi-dosen-uuid-001';
const KAJUR_USER_ID = 'kajur-dosen-uuid-002';
const DOSEN_BIASA_ID = 'dosen-biasa-uuid-003';
const PRODI_ID = 'prodi-uuid-001';
const PRODI_LAIN_ID = 'prodi-lain-uuid-002';
const JURUSAN_ID = 'jurusan-uuid-001';
const REKAP_ID = 'rekap-uuid-001';
const KEGIATAN_ID = 'kegiatan-uuid-001';
const LAMPIRAN_ID = 'lampiran-uuid-001';
const DOKUMEN_ID = 'dokumen-uuid-001';

// Jabatan Kaprodi aktif (periode mencakup saat ini)
const JABATAN_KAPRODI_AKTIF = {
  id: 'jabatan-kaprodi-001',
  dosen_id: KAPRODI_USER_ID,
  program_studi_id: PRODI_ID,
  periode_mulai: new Date('2024-01-01'),
  periode_selesai: new Date('2026-12-31'),
};

// ─── Token Generators ─────────────────────────────────────────────────────────

const makeKaprodiToken = () =>
  jwt.sign(
    {
      id: KAPRODI_USER_ID,
      email: 'kaprodi@example.com',
      role: 'DOSEN',
      name: 'Dr. Kaprodi Test',
      programStudi: 'Teknik Informatika',
      jabatan: {
        is_kajur: false,
        is_kaprodi: true,
        jurusan_id: null,
        program_studi_id: PRODI_ID,
      },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeDosenBiasaToken = () =>
  jwt.sign(
    {
      id: DOSEN_BIASA_ID,
      email: 'dosen.biasa@example.com',
      role: 'DOSEN',
      name: 'Dosen Biasa Test',
      jabatan: {
        is_kajur: false,
        is_kaprodi: false,
        jurusan_id: null,
        program_studi_id: null,
      },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeKajurToken = () =>
  jwt.sign(
    {
      id: KAJUR_USER_ID,
      email: 'kajur@example.com',
      role: 'DOSEN',
      name: 'Dr. Kajur Test',
      jabatan: {
        is_kajur: true,
        is_kaprodi: false,
        jurusan_id: JURUSAN_ID,
        program_studi_id: null,
      },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeTUToken = () =>
  jwt.sign(
    {
      id: 'tu-uuid-001',
      email: 'tu@example.com',
      role: 'TATA_USAHA',
      jurusan_id: JURUSAN_ID,
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

// ─── Express App Builder ──────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const { verifyToken, requireRole, errorHandler } = require('../middleware/authMiddleware');
  const akademikRoleRoutes = require('../routes/dosen/akademikRoleRoutes').default;
  const tatausahaRoutes = require('../routes/tatausaha/documentRoutes').default;
  const adminJabatanRoutes = require('../routes/admin/jabatan').default;

  app.use('/api/dosen/akademik-role', verifyToken, requireRole(['dosen']), akademikRoleRoutes);
  app.use('/api/tatausaha/dokumen', verifyToken, requireRole(['tata_usaha']), tatausahaRoutes);
  app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), adminJabatanRoutes);

  app.use(errorHandler);
  return app;
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('Kaprodi — Autentikasi & Token JWT', () => {
  it('TC-KP-AUTH-02: Dosen biasa → jabatan.is_kaprodi harus false di token', () => {
    const token = makeDosenBiasaToken();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.jabatan.is_kaprodi).toBe(false);
    expect(decoded.jabatan.program_studi_id).toBeNull();
  });

  it('TC-KP-AUTH-01: Kaprodi token → jabatan.is_kaprodi harus true dengan program_studi_id', () => {
    const token = makeKaprodiToken();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.jabatan.is_kaprodi).toBe(true);
    expect(decoded.jabatan.program_studi_id).toBe(PRODI_ID);
    expect(decoded.role).toBe('DOSEN');
  });
});

describe('Kaprodi — Kegiatan Prodi', () => {
  let app: express.Application;
  let kaprodiToken: string;
  let dosenBiasaToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kaprodiToken = makeKaprodiToken();
    dosenBiasaToken = makeDosenBiasaToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: Kaprodi punya jabatan aktif
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(JABATAN_KAPRODI_AKTIF);
  });

  it('TC-KP-KEG-01: Kaprodi mendapatkan kegiatan prodi → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    // Verifikasi bahwa jabatanKaprodi.findFirst dipanggil dengan benar
    expect(mockPrismaJabatanKaprodi.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dosen_id: KAPRODI_USER_ID,
        }),
      })
    );
  });

  it('TC-KP-KEG-02: Kaprodi filter by kategori → 200 (query diteruskan)', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan?kategori=PENELITIAN')
      .set('Authorization', `Bearer ${kaprodiToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('TC-KP-KEG-03: Kaprodi filter by tanggal → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan?tanggalAwal=2024-01-01&tanggalAkhir=2024-12-31')
      .set('Authorization', `Bearer ${kaprodiToken}`);
    expect(res.status).toBe(200);
  });

  it('TC-KP-KEG-05: Kaprodi pagination → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan?page=2&size=5')
      .set('Authorization', `Bearer ${kaprodiToken}`);
    expect(res.status).toBe(200);
  });

  it('TC-KP-KEG-06: Dosen biasa (non-Kaprodi) diblokir → 403', async () => {
    // Dosen biasa: tidak ada jabatan kaprodi aktif
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan')
      .set('Authorization', `Bearer ${dosenBiasaToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/Anda bukan Ketua Program Studi aktif/);
  });

  it('TC-SEC-01: Token TU tidak bisa akses endpoint Kaprodi → 403 (middleware level)', async () => {
    const tuToken = makeTUToken();
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan')
      .set('Authorization', `Bearer ${tuToken}`);
    // TU tidak memiliki role 'dosen' → ditolak di middleware requireRole
    expect(res.status).toBe(403);
  });

  it('TC-KP-KEG-01b: Tanpa token → 401', async () => {
    const res = await request(app).get('/api/dosen/akademik-role/prodi/kegiatan');
    expect(res.status).toBe(401);
  });
});

describe('Kaprodi — Statistik Prodi', () => {
  let app: express.Application;
  let kaprodiToken: string;
  let dosenBiasaToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kaprodiToken = makeKaprodiToken();
    dosenBiasaToken = makeDosenBiasaToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(JABATAN_KAPRODI_AKTIF);
  });

  it('TC-KP-STAT-01: Kaprodi mendapatkan statistik prodi → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/stats')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
  });

  it('TC-KP-STAT-02: Statistik dengan filter tanggal → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/stats?tanggalAwal=2024-01-01&tanggalAkhir=2024-12-31')
      .set('Authorization', `Bearer ${kaprodiToken}`);
    expect(res.status).toBe(200);
  });

  it('TC-KP-STAT-04: Dosen biasa tidak bisa akses statistik prodi → 403', async () => {
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/stats')
      .set('Authorization', `Bearer ${dosenBiasaToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
  });
});

describe('Kaprodi — Rekap Laporan Prodi', () => {
  let app: express.Application;
  let kaprodiToken: string;
  let dosenBiasaToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kaprodiToken = makeKaprodiToken();
    dosenBiasaToken = makeDosenBiasaToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(JABATAN_KAPRODI_AKTIF);
    mockPrismaRekapLaporan.findMany.mockResolvedValue([]);
    // Mock user lookup untuk updateRekap
    mockPrismaUser.findUnique.mockResolvedValue({
      id: KAPRODI_USER_ID,
      dosen: { nama: 'Dr. Kaprodi Test' },
    });
  });

  it('TC-KP-REKAP-01: Kaprodi membuat rekap prodi → 201', async () => {
    const res = await request(app)
      .post('/api/dosen/akademik-role/prodi/rekap')
      .set('Authorization', `Bearer ${kaprodiToken}`)
      .send({
        nama: 'Rekap Semester Ganjil 2024',
        tanggalPerekapan: '2024-12-31',
        filter: { kategori: 'PENELITIAN' },
        kegiatanData: { items: [] },
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('id');
  });

  it('TC-KP-REKAP-03: Kaprodi mendapatkan daftar rekap prodi → 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/rekap')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('TC-KP-REKAP-05: Detail rekap tidak ditemukan → 404', async () => {
    const { RekapService } = require('../services/RekapService');
    // Override untuk test ini
    RekapService.mockImplementationOnce(() => ({
      getRekapDetail: jest.fn().mockResolvedValue(null),
      createRekap: jest.fn(),
      getAllRekap: jest.fn(),
      updateRekap: jest.fn(),
      deleteRekap: jest.fn(),
    }));

    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/rekap/non-existent-id')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Rekap tidak ditemukan/);
  });

  it('TC-KP-REKAP-06: Kaprodi mengupdate rekap → 200', async () => {
    const res = await request(app)
      .put(`/api/dosen/akademik-role/prodi/rekap/${REKAP_ID}`)
      .set('Authorization', `Bearer ${kaprodiToken}`)
      .send({
        nama: 'Rekap Revisi',
        tanggalPerekapan: '2025-01-05',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('TC-KP-REKAP-07: Kaprodi menghapus rekap → 200', async () => {
    const res = await request(app)
      .delete(`/api/dosen/akademik-role/prodi/rekap/${REKAP_ID}`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/berhasil dihapus/);
  });

  it('TC-KP-REKAP-08: Dosen biasa tidak bisa membuat rekap prodi → 403', async () => {
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/dosen/akademik-role/prodi/rekap')
      .set('Authorization', `Bearer ${dosenBiasaToken}`)
      .send({
        nama: 'Rekap Test',
        tanggalPerekapan: '2024-12-31',
        filter: {},
        kegiatanData: {},
      });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
  });
});

describe('Kaprodi — Lampiran Preview & Content (Yurisdiksi)', () => {
  let app: express.Application;
  let kaprodiToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kaprodiToken = makeKaprodiToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(JABATAN_KAPRODI_AKTIF);
  });

  it('TC-KP-LAMP-01: Kaprodi preview lampiran di prodinya → 200', async () => {
    // Mock: lampiran ditemukan, kegiatan dari prodi yang sama
    mockPrismaKepemilikanDokumen.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi_id: PRODI_ID }, // ← prodi sama
      },
      dokumen: { id: DOKUMEN_ID, nama: 'test.pdf' },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/prodi/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('TC-KP-LAMP-03: Kaprodi preview lampiran dari prodi LAIN → 403', async () => {
    // Mock: lampiran dari prodi berbeda
    mockPrismaKepemilikanDokumen.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi_id: PRODI_LAIN_ID }, // ← prodi BERBEDA
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/prodi/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Kegiatan tidak berada dalam yurisdiksi Anda/);
  });

  it('TC-KP-LAMP-04: Lampiran tidak ditemukan → 404', async () => {
    // Mock: lampiran tidak ada
    mockPrismaKepemilikanDokumen.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/dosen/akademik-role/prodi/kegiatan/${KEGIATAN_ID}/lampiran/non-existent/preview`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Lampiran tidak ditemukan/);
  });

  it('TC-KP-LAMP-05: kegiatan ID tidak cocok dengan lampiran → 400', async () => {
    const KEGIATAN_ID_SALAH = 'kegiatan-salah-uuid';
    // Mock: lampiran ada tapi kegiatan_id berbeda dengan param
    mockPrismaKepemilikanDokumen.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID, // kegiatan_id asli
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi_id: PRODI_ID },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/prodi/kegiatan/${KEGIATAN_ID_SALAH}/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID kegiatan tidak sesuai/);
  });

  it('TC-KP-LAMP-02: Kaprodi download content lampiran di prodinya → 200 dengan headers', async () => {
    mockPrismaKepemilikanDokumen.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi_id: PRODI_ID },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/prodi/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/content`)
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['x-content-sha256']).toBeDefined();
  });
});

describe('Kaprodi — Access Control (Endpoint Terlarang)', () => {
  let app: express.Application;
  let kaprodiToken: string;
  let tuToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kaprodiToken = makeKaprodiToken();
    tuToken = makeTUToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-KP-FORBIDDEN-01: Kaprodi tidak bisa akses endpoint Kajur (jurusan) → 403', async () => {
    // Tidak ada jabatan kajur → controller menolak
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/kegiatan')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Anda bukan Ketua Jurusan aktif/);
  });

  it('TC-KP-FORBIDDEN-02: Kaprodi tidak bisa akses endpoint TU (upload dokumen TU) → 403', async () => {
    const res = await request(app)
      .post('/api/tatausaha/dokumen/upload')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Akses ditolak/);
  });

  it('TC-KP-FORBIDDEN-03: Kaprodi tidak bisa akses endpoint admin jabatan → 403', async () => {
    const res = await request(app)
      .get('/api/admin/jabatan')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
  });

  it('TC-KP-FORBIDDEN-04: Kaprodi tidak bisa melihat dokumen TU list → 403', async () => {
    const res = await request(app)
      .get('/api/tatausaha/dokumen')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
  });

  it('TC-SEC-02: Token TU mencoba akses endpoint Kaprodi (statistik prodi) → 403', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/stats')
      .set('Authorization', `Bearer ${tuToken}`);

    // TU role bukan 'dosen' → middleware menolak
    expect(res.status).toBe(403);
  });
});

describe('Kajur — Monitoring Rekap Semua Prodi & Jurusan', () => {
  let app: express.Application;
  let kajurToken: string;
  let kaprodiToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kajurToken = makeKajurToken();
    kaprodiToken = makeKaprodiToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-KJ-REKAP-01: Kajur mengambil seluruh rekap (jurusan + semua prodi di bawahnya) → 200', async () => {
    // Mock JabatanKajur aktif
    mockPrismaJabatanKajur.findFirst.mockResolvedValue({
      id: 'jabatan-kajur-001',
      dosen_id: KAJUR_USER_ID,
      jurusan_id: JURUSAN_ID,
      periode_mulai: new Date('2024-01-01'),
      periode_selesai: new Date('2026-12-31'),
    });

    // Mock ProgramStudi under jurusan
    mockPrismaProgramStudi.findMany.mockResolvedValue([
      { id: PRODI_ID, nama_prodi: 'Prodi Informatika', jurusan_id: JURUSAN_ID }
    ]);

    // Mock Rekap Laporan
    mockPrismaRekapLaporan.findMany.mockResolvedValue([
      { id: 'rekap-jurusan-1', nama: 'Rekap Jurusan', jurusan_id: JURUSAN_ID, prodi_id: null },
      { id: 'rekap-prodi-1', nama: 'Rekap Prodi', jurusan_id: null, prodi_id: PRODI_ID },
    ]);

    const res = await request(app)
      .get('/api/dosen/akademik-role/kajur/rekap/semua')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].nama).toBe('Rekap Jurusan');
    expect(res.body.data[1].nama).toBe('Rekap Prodi');
  });

  it('TC-KJ-REKAP-02: Kaprodi (bukan Kajur) diblokir dari endpoint rekap semua → 403', async () => {
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/kajur/rekap/semua')
      .set('Authorization', `Bearer ${kaprodiToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Anda bukan Ketua Jurusan aktif/);
  });
});

