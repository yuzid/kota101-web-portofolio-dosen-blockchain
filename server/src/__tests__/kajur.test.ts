/**
 * Test Suite: Kajur (Ketua Jurusan)
 * Role: DOSEN dengan JabatanKajur aktif
 * Base Path: /api/dosen/akademik-role/jurusan/*
 *
 * Strategi:
 * - Middleware hanya cek base role 'dosen'.
 * - Controller memverifikasi JabatanKajur aktif melalui Prisma.
 * - Repository/service eksternal di-mock agar test fokus pada kontrak role Kajur.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';

const mockPrismaJabatanKajur = { findFirst: jest.fn() };
const mockPrismaJabatanKaprodi = { findFirst: jest.fn() };
const mockPrismaLampiranBukti = { findUnique: jest.fn() };
const mockPrismaProgramStudi = { findMany: jest.fn() };
const mockPrismaUser = { findUnique: jest.fn() };

jest.mock('../lib/prisma', () => ({
  prisma: {
    jabatanKajur: mockPrismaJabatanKajur,
    jabatanKaprodi: mockPrismaJabatanKaprodi,
    lampiranBukti: mockPrismaLampiranBukti,
    programStudi: mockPrismaProgramStudi,
    user: mockPrismaUser,
  },
}));

const mockActivityRepositoryMethods = {
  findByJurusan: jest.fn(),
  findJurusanSummaryStats: jest.fn(),
  findByProdi: jest.fn(),
  findProdiSummaryStats: jest.fn(),
};

jest.mock('../repositories/ActivityRepository', () => ({
  ActivityRepository: jest.fn().mockImplementation(() => mockActivityRepositoryMethods),
}));

const mockRekapServiceMethods = {
  createRekap: jest.fn(),
  getAllRekap: jest.fn(),
  getRekapDetail: jest.fn(),
  updateRekap: jest.fn(),
  deleteRekap: jest.fn(),
};

jest.mock('../services/RekapService', () => ({
  RekapService: jest.fn().mockImplementation(() => mockRekapServiceMethods),
}));

const mockDocumentServiceMethods = {
  getDocumentPreview: jest.fn(),
  getDocumentContent: jest.fn(),
};

jest.mock('../services/DocumentService', () => ({
  DocumentService: jest.fn().mockImplementation(() => mockDocumentServiceMethods),
}));

jest.mock('../repositories/DocumentRepository', () => ({
  DocumentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../services/FileStorageService', () => ({
  FileStorageService: jest.fn().mockImplementation(() => ({})),
}));

const JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_SECRET = JWT_SECRET;

const KAJUR_USER_ID = 'kajur-dosen-uuid-001';
const KAPRODI_USER_ID = 'kaprodi-dosen-uuid-002';
const DOSEN_BIASA_ID = 'dosen-biasa-uuid-003';
const TU_USER_ID = 'tu-uuid-001';
const JURUSAN_ID = 'jurusan-uuid-001';
const JURUSAN_LAIN_ID = 'jurusan-lain-uuid-002';
const PRODI_ID = 'prodi-uuid-001';
const PRODI_LAIN_ID = 'prodi-lain-uuid-002';
const REKAP_ID = 'rekap-uuid-001';
const KEGIATAN_ID = 'kegiatan-uuid-001';
const LAMPIRAN_ID = 'lampiran-uuid-001';
const DOKUMEN_ID = 'dokumen-uuid-001';

const JABATAN_KAJUR_AKTIF = {
  id: 'jabatan-kajur-001',
  dosen_id: KAJUR_USER_ID,
  jurusan_id: JURUSAN_ID,
  periode_mulai: new Date('2024-01-01'),
  periode_selesai: new Date('2027-12-31'),
};

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
    { expiresIn: '8h' },
  );

const makeKaprodiToken = () =>
  jwt.sign(
    {
      id: KAPRODI_USER_ID,
      email: 'kaprodi@example.com',
      role: 'DOSEN',
      name: 'Dr. Kaprodi Test',
      jabatan: {
        is_kajur: false,
        is_kaprodi: true,
        jurusan_id: null,
        program_studi_id: PRODI_ID,
      },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const makeDosenBiasaToken = () =>
  jwt.sign(
    {
      id: DOSEN_BIASA_ID,
      email: 'dosen@example.com',
      role: 'DOSEN',
      name: 'Dosen Biasa Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const makeTUToken = () =>
  jwt.sign(
    {
      id: TU_USER_ID,
      email: 'tu@example.com',
      role: 'TATA_USAHA',
      name: 'Staf TU Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const { verifyToken, requireRole, errorHandler } = require('../middleware/authMiddleware');
  const akademikRoleRoutes = require('../routes/dosen/akademikRoleRoutes').default;

  app.use('/api/dosen/akademik-role', verifyToken, requireRole(['dosen']), akademikRoleRoutes);
  app.use('/api/tatausaha/dokumen', verifyToken, requireRole(['tata_usaha']), (_req, res) => {
    res.json({ status: 'success', data: [] });
  });
  app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), (_req, res) => {
    res.json({ status: 'success', data: [] });
  });

  app.use(errorHandler);
  return app;
}

describe('Kajur - Autentikasi & Token JWT', () => {
  it('TC-KJ-AUTH-01: Kajur token membawa jabatan.is_kajur dan jurusan_id', () => {
    const decoded = jwt.verify(makeKajurToken(), JWT_SECRET) as any;
    expect(decoded.role).toBe('DOSEN');
    expect(decoded.jabatan.is_kajur).toBe(true);
    expect(decoded.jabatan.jurusan_id).toBe(JURUSAN_ID);
    expect(decoded.jabatan.is_kaprodi).toBe(false);
  });

  it('TC-KJ-AUTH-02: Dosen biasa tidak membawa flag Kajur', () => {
    const decoded = jwt.verify(makeDosenBiasaToken(), JWT_SECRET) as any;
    expect(decoded.jabatan.is_kajur).toBe(false);
    expect(decoded.jabatan.jurusan_id).toBeNull();
  });
});

describe('Kajur - Kegiatan Jurusan', () => {
  let app: express.Application;
  let kajurToken: string;
  let dosenBiasaToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kajurToken = makeKajurToken();
    dosenBiasaToken = makeDosenBiasaToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(JABATAN_KAJUR_AKTIF);
    mockActivityRepositoryMethods.findByJurusan.mockResolvedValue({
      data: [{ id: KEGIATAN_ID, judul: 'Kegiatan Jurusan' }],
      total: 1,
      page: 1,
      size: 10,
    });
  });

  it('TC-KJ-KEG-01: Kajur mendapatkan kegiatan jurusan -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/kegiatan')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.total).toBe(1);
    expect(mockPrismaJabatanKajur.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dosen_id: KAJUR_USER_ID }),
      }),
    );
    expect(mockActivityRepositoryMethods.findByJurusan).toHaveBeenCalledWith(
      JURUSAN_ID,
      expect.any(Object),
      expect.objectContaining({ page: 1, size: 10 }),
    );
  });

  it('TC-KJ-KEG-02: Kajur filter kegiatan berdasarkan prodi, status, dan pagination -> 200', async () => {
    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan?prodiId=${PRODI_ID}&status=VALID&page=2&size=5`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(mockActivityRepositoryMethods.findByJurusan).toHaveBeenCalledWith(
      JURUSAN_ID,
      expect.objectContaining({ prodiId: PRODI_ID, status: 'VALID' }),
      expect.objectContaining({ page: 2, size: 5 }),
    );
  });

  it('TC-KJ-KEG-03: Dosen biasa ditolak dari kegiatan jurusan -> 403', async () => {
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/kegiatan')
      .set('Authorization', `Bearer ${dosenBiasaToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Anda bukan Ketua Jurusan aktif/);
  });

  it('TC-KJ-KEG-04: Token TU ditolak di middleware role dosen -> 403', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/kegiatan')
      .set('Authorization', `Bearer ${makeTUToken()}`);
    expect(res.status).toBe(403);
  });

  it('TC-KJ-KEG-05: Tanpa token -> 401', async () => {
    const res = await request(app).get('/api/dosen/akademik-role/jurusan/kegiatan');
    expect(res.status).toBe(401);
  });
});

describe('Kajur - Statistik Jurusan', () => {
  let app: express.Application;
  let kajurToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kajurToken = makeKajurToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(JABATAN_KAJUR_AKTIF);
    mockActivityRepositoryMethods.findJurusanSummaryStats.mockResolvedValue({
      totalKegiatan: 8,
      totalDosen: 4,
      perProdi: { [PRODI_ID]: 8 },
    });
  });

  it('TC-KJ-STAT-01: Kajur mendapatkan statistik jurusan -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/stats')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalKegiatan).toBe(8);
    expect(mockActivityRepositoryMethods.findJurusanSummaryStats).toHaveBeenCalledWith(JURUSAN_ID, expect.any(Object));
  });

  it('TC-KJ-STAT-02: Statistik jurusan dengan filter tanggal dan prodi -> 200', async () => {
    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/stats?tanggalAwal=2025-01-01&tanggalAkhir=2025-12-31&prodiId=${PRODI_ID}`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(mockActivityRepositoryMethods.findJurusanSummaryStats).toHaveBeenCalledWith(
      JURUSAN_ID,
      expect.objectContaining({
        tanggalAwal: '2025-01-01',
        tanggalAkhir: '2025-12-31',
        prodiId: PRODI_ID,
      }),
    );
  });

  it('TC-KJ-STAT-03: Non-Kajur tidak bisa akses statistik jurusan -> 403', async () => {
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/stats')
      .set('Authorization', `Bearer ${makeDosenBiasaToken()}`);

    expect(res.status).toBe(403);
  });
});

describe('Kajur - Rekap Laporan Jurusan', () => {
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
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(JABATAN_KAJUR_AKTIF);
    mockRekapServiceMethods.createRekap.mockResolvedValue({ id: REKAP_ID, nama: 'Rekap Jurusan' });
    mockRekapServiceMethods.getAllRekap.mockResolvedValue([{ id: REKAP_ID, nama: 'Rekap Jurusan' }]);
    mockRekapServiceMethods.getRekapDetail.mockResolvedValue({ id: REKAP_ID, nama: 'Rekap Jurusan' });
    mockRekapServiceMethods.updateRekap.mockResolvedValue({ id: REKAP_ID, nama: 'Rekap Revisi' });
    mockRekapServiceMethods.deleteRekap.mockResolvedValue(undefined);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: KAJUR_USER_ID,
      email: 'kajur@example.com',
      dosen: { nama: 'Dr. Kajur Test' },
      admin: null,
      tata_usaha: null,
    });
  });

  it('TC-KJ-REKAP-01: Kajur membuat rekap jurusan -> 201', async () => {
    const payload = {
      nama: 'Rekap Jurusan Semester Ganjil',
      tanggalPerekapan: '2025-12-31',
      filter: { prodiId: PRODI_ID },
      kegiatanData: { items: [] },
    };

    const res = await request(app)
      .post('/api/dosen/akademik-role/jurusan/rekap')
      .set('Authorization', `Bearer ${kajurToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(REKAP_ID);
    expect(mockRekapServiceMethods.createRekap).toHaveBeenCalledWith(
      expect.objectContaining({
        nama: payload.nama,
        dibuatOlehId: KAJUR_USER_ID,
        jurusanId: JURUSAN_ID,
        filter: payload.filter,
      }),
    );
  });

  it('TC-KJ-REKAP-02: Kajur mendapatkan daftar rekap jurusan -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/rekap')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(REKAP_ID);
    expect(mockRekapServiceMethods.getAllRekap).toHaveBeenCalledWith({ jurusan_id: JURUSAN_ID });
  });

  it('TC-KJ-REKAP-03: Kajur mendapatkan detail rekap -> 200', async () => {
    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/rekap/${REKAP_ID}`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.nama).toBe('Rekap Jurusan');
  });

  it('TC-KJ-REKAP-04: Detail rekap tidak ditemukan -> 404', async () => {
    mockRekapServiceMethods.getRekapDetail.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/dosen/akademik-role/jurusan/rekap/tidak-ada')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Rekap tidak ditemukan/);
  });

  it('TC-KJ-REKAP-05: Kajur update rekap -> 200', async () => {
    const res = await request(app)
      .put(`/api/dosen/akademik-role/jurusan/rekap/${REKAP_ID}`)
      .set('Authorization', `Bearer ${kajurToken}`)
      .send({ nama: 'Rekap Revisi' });

    expect(res.status).toBe(200);
    expect(mockRekapServiceMethods.updateRekap).toHaveBeenCalledWith(
      REKAP_ID,
      expect.objectContaining({ nama: 'Rekap Revisi', dilakukanOlehName: 'Dr. Kajur Test' }),
    );
  });

  it('TC-KJ-REKAP-06: Kajur hapus rekap -> 200', async () => {
    const res = await request(app)
      .delete(`/api/dosen/akademik-role/jurusan/rekap/${REKAP_ID}`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/berhasil dihapus/);
  });

  it('TC-KJ-REKAP-07: Kajur mengambil semua rekap jurusan dan prodi di bawahnya -> 200', async () => {
    mockPrismaProgramStudi.findMany.mockResolvedValue([
      { id: PRODI_ID },
      { id: PRODI_LAIN_ID },
    ]);
    mockRekapServiceMethods.getAllRekap.mockResolvedValue([
      { id: 'rekap-jurusan', jurusan_id: JURUSAN_ID, prodi_id: null },
      { id: 'rekap-prodi', jurusan_id: null, prodi_id: PRODI_ID },
    ]);

    const res = await request(app)
      .get('/api/dosen/akademik-role/kajur/rekap/semua')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(mockRekapServiceMethods.getAllRekap).toHaveBeenCalledWith({
      OR: [
        { jurusan_id: JURUSAN_ID },
        { prodi_id: { in: [PRODI_ID, PRODI_LAIN_ID] } },
      ],
    });
  });

  it('TC-KJ-REKAP-08: Kaprodi bukan Kajur ditolak dari rekap jurusan -> 403', async () => {
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/dosen/akademik-role/jurusan/rekap')
      .set('Authorization', `Bearer ${kaprodiToken}`)
      .send({ nama: 'Rekap Test', tanggalPerekapan: '2025-12-31' });

    expect(res.status).toBe(403);
  });
});

describe('Kajur - Lampiran Preview & Content Yurisdiksi Jurusan', () => {
  let app: express.Application;
  let kajurToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kajurToken = makeKajurToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(JABATAN_KAJUR_AKTIF);
    mockDocumentServiceMethods.getDocumentPreview.mockResolvedValue({ url: 'https://s3.example.com/preview.pdf' });
    mockDocumentServiceMethods.getDocumentContent.mockResolvedValue({
      contentType: 'application/pdf',
      contentLength: 7,
      fileName: 'lampiran.pdf',
      contentHash: 'hash-lampiran',
      bytes: Buffer.from('PDFTEST'),
    });
  });

  it('TC-KJ-LAMP-01: Kajur preview lampiran dalam jurusannya -> 200', async () => {
    mockPrismaLampiranBukti.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi: { jurusan_id: JURUSAN_ID } },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/^https:\/\//);
    expect(mockDocumentServiceMethods.getDocumentPreview).toHaveBeenCalledWith(DOKUMEN_ID, expect.any(Object), KEGIATAN_ID);
  });

  it('TC-KJ-LAMP-02: Kajur download content lampiran dalam jurusannya -> 200', async () => {
    mockPrismaLampiranBukti.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi: { jurusan_id: JURUSAN_ID } },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/content`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['x-content-sha256']).toBe('hash-lampiran');
  });

  it('TC-KJ-LAMP-03: Lampiran dari jurusan lain ditolak -> 403', async () => {
    mockPrismaLampiranBukti.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi: { jurusan_id: JURUSAN_LAIN_ID } },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan/${KEGIATAN_ID}/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Kegiatan tidak berada dalam yurisdiksi Anda/);
  });

  it('TC-KJ-LAMP-04: Lampiran tidak ditemukan -> 404', async () => {
    mockPrismaLampiranBukti.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan/${KEGIATAN_ID}/lampiran/tidak-ada/preview`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Lampiran tidak ditemukan/);
  });

  it('TC-KJ-LAMP-05: kegiatanId param tidak sesuai lampiran -> 400', async () => {
    mockPrismaLampiranBukti.findUnique.mockResolvedValue({
      id: LAMPIRAN_ID,
      kegiatan_id: KEGIATAN_ID,
      dokumen_id: DOKUMEN_ID,
      kegiatan: {
        id: KEGIATAN_ID,
        dosen: { program_studi: { jurusan_id: JURUSAN_ID } },
      },
      dokumen: { id: DOKUMEN_ID },
    });

    const res = await request(app)
      .get(`/api/dosen/akademik-role/jurusan/kegiatan/kegiatan-salah/lampiran/${LAMPIRAN_ID}/preview`)
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID kegiatan tidak sesuai/);
  });
});

describe('Kajur - Access Control Endpoint Terlarang', () => {
  let app: express.Application;
  let kajurToken: string;

  beforeAll(() => {
    app = buildTestApp();
    kajurToken = makeKajurToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaJabatanKaprodi.findFirst.mockResolvedValue(null);
  });

  it('TC-KJ-FORBIDDEN-01: Kajur tidak bisa akses endpoint Kaprodi bila bukan Kaprodi aktif -> 403', async () => {
    const res = await request(app)
      .get('/api/dosen/akademik-role/prodi/kegiatan')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Anda bukan Ketua Program Studi aktif/);
  });

  it('TC-KJ-FORBIDDEN-02: Kajur tidak bisa akses endpoint TU -> 403', async () => {
    const res = await request(app)
      .get('/api/tatausaha/dokumen')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(403);
  });

  it('TC-KJ-FORBIDDEN-03: Kajur tidak bisa akses endpoint admin jabatan -> 403', async () => {
    const res = await request(app)
      .get('/api/admin/jabatan')
      .set('Authorization', `Bearer ${kajurToken}`);

    expect(res.status).toBe(403);
  });
});
