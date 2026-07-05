/**
 * Test Suite: Dosen
 * Role: DOSEN biasa
 * Base Paths: /api/dosen/dokumen, /api/dosen/kegiatan, /api/dosen/highlights
 *
 * Strategi:
 * - Express app minimal dengan middleware auth asli.
 * - Service layer di-mock agar test fokus pada kontrak controller/route.
 * - JWT di-sign dengan secret test yang sama.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';

const mockActivityService = {
  getAllActivities: jest.fn(),
  getSummaryStats: jest.fn(),
  getTanpaBukti: jest.fn(),
  getActivityById: jest.fn(),
  getAuditTrail: jest.fn(),
  createActivity: jest.fn(),
  updateActivity: jest.fn(),
  deleteActivity: jest.fn(),
  addLampiran: jest.fn(),
  deleteLampiran: jest.fn(),
  getPendingConfirmations: jest.fn(),
  acceptParticipation: jest.fn(),
  rejectParticipation: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
};

const mockDocumentService = {
  getDosenDocuments: jest.fn(),
  uploadDosenDocument: jest.fn(),
  getDocumentPreview: jest.fn(),
  getDocumentContent: jest.fn(),
  updateMetadata: jest.fn(),
  replaceFile: jest.fn(),
  deleteDocument: jest.fn(),
};

const mockDistributionService = {
  getPendingRequests: jest.fn(),
  getDosenDistributionHistory: jest.fn(),
  acceptDocument: jest.fn(),
  rejectDocument: jest.fn(),
};

const mockHighlightService = {
  getHighlightsByDocument: jest.fn(),
  getHighlightsByDocumentAndDosen: jest.fn(),
  syncHighlights: jest.fn(),
  addHighlight: jest.fn(),
  updateHighlight: jest.fn(),
  deleteHighlight: jest.fn(),
};

jest.mock('../services/ActivityService', () => ({
  ActivityService: jest.fn().mockImplementation(() => mockActivityService),
}));

jest.mock('../services/DocumentService', () => ({
  DocumentService: jest.fn().mockImplementation(() => mockDocumentService),
}));

jest.mock('../services/DocumentDistributionService', () => ({
  DocumentDistributionService: jest.fn().mockImplementation(() => mockDistributionService),
}));

jest.mock('../services/HighlightService', () => ({
  HighlightService: jest.fn().mockImplementation(() => mockHighlightService),
}));

jest.mock('../repositories/ActivityRepository', () => ({
  ActivityRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repositories/DocumentRepository', () => ({
  DocumentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repositories/DistributionRepository', () => ({
  DistributionRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repositories/HighlightRepository', () => ({
  HighlightRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../services/FileStorageService', () => ({
  FileStorageService: jest.fn().mockImplementation(() => ({})),
}));

const JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_SECRET = JWT_SECRET;

const DOSEN_ID = 'dosen-uuid-001';
const TU_ID = 'tu-uuid-001';
const ADMIN_ID = 'admin-uuid-001';
const DOKUMEN_ID = 'dokumen-uuid-001';
const KEGIATAN_ID = 'kegiatan-uuid-001';
const KEPEMILIKAN_ID = 'kepemilikan-uuid-001';
const HIGHLIGHT_ID = 'highlight-uuid-001';
const PARTISIPASI_ID = 'partisipasi-uuid-001';

const makeDosenToken = () =>
  jwt.sign(
    {
      id: DOSEN_ID,
      email: 'dosen@example.com',
      role: 'DOSEN',
      name: 'Dosen Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const makeTUToken = () =>
  jwt.sign(
    {
      id: TU_ID,
      email: 'tu@example.com',
      role: 'TATA_USAHA',
      name: 'Staf TU Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const makeAdminToken = () =>
  jwt.sign(
    {
      id: ADMIN_ID,
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'Admin Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const makeExpiredToken = () =>
  jwt.sign(
    { id: DOSEN_ID, email: 'dosen@example.com', role: 'DOSEN' },
    JWT_SECRET,
    { expiresIn: '-1s' },
  );

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const { verifyToken, requireRole, errorHandler } = require('../middleware/authMiddleware');
  const documentRoutes = require('../routes/dosen/documentRoutes').default;
  const activityRoutes = require('../routes/dosen/activityRoutes').default;
  const highlightRoutes = require('../routes/dosen/highlightRoutes').default;

  app.use('/api/dosen/dokumen', verifyToken, requireRole(['dosen']), documentRoutes);
  app.use('/api/dosen/kegiatan', verifyToken, requireRole(['dosen']), activityRoutes);
  app.use('/api/dosen/highlights', verifyToken, requireRole(['dosen']), highlightRoutes);
  app.use('/api/tatausaha/dokumen', verifyToken, requireRole(['tata_usaha']), (_req, res) => {
    res.json({ status: 'success', data: [] });
  });
  app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), (_req, res) => {
    res.json({ status: 'success', data: [] });
  });

  app.use(errorHandler);
  return app;
}

describe('Dosen - Autentikasi & Access Control', () => {
  let app: express.Application;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    dosenToken = makeDosenToken();
  });

  it('TC-DS-AUTH-01: Token dosen valid membawa role DOSEN dan bukan jabatan struktural', () => {
    const decoded = jwt.verify(dosenToken, JWT_SECRET) as any;
    expect(decoded.role).toBe('DOSEN');
    expect(decoded.jabatan.is_kajur).toBe(false);
    expect(decoded.jabatan.is_kaprodi).toBe(false);
  });

  it('TC-DS-AUTH-02: Akses endpoint dosen tanpa token -> 401', async () => {
    const res = await request(app).get('/api/dosen/kegiatan');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token tidak ditemukan/);
  });

  it('TC-DS-AUTH-03: Token expired -> 401', async () => {
    const res = await request(app)
      .get('/api/dosen/dokumen')
      .set('Authorization', `Bearer ${makeExpiredToken()}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token tidak valid|sudah expired/);
  });

  it('TC-DS-FORBIDDEN-01: Token TU tidak bisa akses endpoint dosen -> 403', async () => {
    const res = await request(app)
      .get('/api/dosen/kegiatan')
      .set('Authorization', `Bearer ${makeTUToken()}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Akses ditolak/);
  });

  it('TC-DS-FORBIDDEN-02: Dosen tidak bisa akses endpoint TU -> 403', async () => {
    const res = await request(app)
      .get('/api/tatausaha/dokumen')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-DS-FORBIDDEN-03: Dosen tidak bisa akses endpoint admin jabatan -> 403', async () => {
    const res = await request(app)
      .get('/api/admin/jabatan')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-DS-FORBIDDEN-04: Admin tidak bisa akses endpoint dosen -> 403', async () => {
    const res = await request(app)
      .get('/api/dosen/dokumen')
      .set('Authorization', `Bearer ${makeAdminToken()}`);
    expect(res.status).toBe(403);
  });
});

describe('Dosen - Kegiatan Tridharma', () => {
  let app: express.Application;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    dosenToken = makeDosenToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockActivityService.getAllActivities.mockResolvedValue([{ id: KEGIATAN_ID, judul: 'Publikasi Test' }]);
    mockActivityService.getSummaryStats.mockResolvedValue({ total: 1, penelitian: 1 });
    mockActivityService.getTanpaBukti.mockResolvedValue([{ id: KEGIATAN_ID }]);
    mockActivityService.getActivityById.mockResolvedValue({ id: KEGIATAN_ID, judul: 'Publikasi Test' });
    mockActivityService.getAuditTrail.mockResolvedValue([{ action: 'CREATE' }]);
    mockActivityService.createActivity.mockResolvedValue({ id: KEGIATAN_ID });
    mockActivityService.updateActivity.mockResolvedValue({ id: KEGIATAN_ID, judul: 'Update' });
    mockActivityService.deleteActivity.mockResolvedValue(undefined);
    mockActivityService.addLampiran.mockResolvedValue({ id: 'lampiran-uuid-001' });
    mockActivityService.deleteLampiran.mockResolvedValue(undefined);
    mockActivityService.getPendingConfirmations.mockResolvedValue([{ id: PARTISIPASI_ID }]);
    mockActivityService.acceptParticipation.mockResolvedValue(undefined);
    mockActivityService.rejectParticipation.mockResolvedValue(undefined);
    mockActivityService.addMember.mockResolvedValue(undefined);
    mockActivityService.removeMember.mockResolvedValue(undefined);
  });

  it('TC-DS-KEG-01: Dosen mendapatkan daftar kegiatan -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/kegiatan')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(mockActivityService.getAllActivities).toHaveBeenCalledWith(DOSEN_ID);
  });

  it('TC-DS-KEG-02: Dosen mendapatkan statistik kegiatan -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/kegiatan/stats/summary')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(mockActivityService.getSummaryStats).toHaveBeenCalledWith(DOSEN_ID);
  });

  it('TC-DS-KEG-03: Dosen membuat kegiatan -> 201', async () => {
    const payload = {
      judul: 'Publikasi Test',
      kategori: 'PENELITIAN',
      tanggal: '2025-01-10',
    };
    const res = await request(app)
      .post('/api/dosen/kegiatan')
      .set('Authorization', `Bearer ${dosenToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(KEGIATAN_ID);
    expect(mockActivityService.createActivity).toHaveBeenCalledWith(DOSEN_ID, payload);
  });

  it('TC-DS-KEG-04: Validasi create kegiatan gagal -> 400', async () => {
    mockActivityService.createActivity.mockRejectedValueOnce(new Error('Judul kegiatan wajib diisi.'));
    const res = await request(app)
      .post('/api/dosen/kegiatan')
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Judul kegiatan wajib diisi/);
  });

  it('TC-DS-KEG-05: Dosen update kegiatan miliknya -> 200', async () => {
    const res = await request(app)
      .put(`/api/dosen/kegiatan/${KEGIATAN_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ judul: 'Update' });
    expect(res.status).toBe(200);
    expect(mockActivityService.updateActivity).toHaveBeenCalledWith(KEGIATAN_ID, DOSEN_ID, { judul: 'Update' });
  });

  it('TC-DS-KEG-06: Update kegiatan bukan milik dosen -> 403', async () => {
    mockActivityService.updateActivity.mockRejectedValueOnce(new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.'));
    const res = await request(app)
      .put(`/api/dosen/kegiatan/${KEGIATAN_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ judul: 'Update' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Akses ditolak/);
  });

  it('TC-DS-KEG-07: Dosen hapus kegiatan -> 200', async () => {
    const res = await request(app)
      .delete(`/api/dosen/kegiatan/${KEGIATAN_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/berhasil dihapus/);
    expect(mockActivityService.deleteActivity).toHaveBeenCalledWith(KEGIATAN_ID, DOSEN_ID);
  });

  it('TC-DS-KEG-08: Dosen menambah lampiran bukti -> 201', async () => {
    const res = await request(app)
      .post(`/api/dosen/kegiatan/${KEGIATAN_ID}/lampiran`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ dokumen_id: DOKUMEN_ID });
    expect(res.status).toBe(201);
    expect(mockActivityService.addLampiran).toHaveBeenCalledWith(KEGIATAN_ID, DOKUMEN_ID, DOSEN_ID);
  });

  it('TC-DS-KEG-09: Dosen melihat permintaan konfirmasi -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/kegiatan/permintaan-konfirmasi')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(PARTISIPASI_ID);
  });

  it('TC-DS-KEG-10: Dosen menerima partisipasi -> 200', async () => {
    const res = await request(app)
      .patch(`/api/dosen/kegiatan/${KEGIATAN_ID}/partisipasi/${PARTISIPASI_ID}/terima`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(mockActivityService.acceptParticipation).toHaveBeenCalledWith(PARTISIPASI_ID, DOSEN_ID);
  });

  it('TC-DS-KEG-11: Tambah anggota tanpa anggota_id -> 400', async () => {
    const res = await request(app)
      .post(`/api/dosen/kegiatan/${KEGIATAN_ID}/anggota`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/anggota_id wajib diisi/);
  });
});

describe('Dosen - Dokumen', () => {
  let app: express.Application;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    dosenToken = makeDosenToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentService.getDosenDocuments.mockResolvedValue([{ id: DOKUMEN_ID, nama: 'Dokumen Test' }]);
    mockDocumentService.uploadDosenDocument.mockResolvedValue({ id: DOKUMEN_ID });
    mockDocumentService.getDocumentPreview.mockResolvedValue({ url: 'https://s3.example.com/signed.pdf' });
    mockDocumentService.getDocumentContent.mockResolvedValue({
      contentType: 'application/pdf',
      contentLength: 7,
      fileName: 'test.pdf',
      contentHash: 'hash-test',
      bytes: Buffer.from('PDFTEST'),
    });
    mockDocumentService.updateMetadata.mockResolvedValue(undefined);
    mockDocumentService.replaceFile.mockResolvedValue({ id: DOKUMEN_ID, file_path: 'path/test.pdf', hash_file: 'hash-test' });
    mockDocumentService.deleteDocument.mockResolvedValue(undefined);
    mockDistributionService.getPendingRequests.mockResolvedValue([{ id: DOKUMEN_ID }]);
    mockDistributionService.getDosenDistributionHistory.mockResolvedValue([{ id: DOKUMEN_ID, status: 'DISETUJUI' }]);
    mockDistributionService.acceptDocument.mockResolvedValue({ message: 'Dokumen diterima.' });
    mockDistributionService.rejectDocument.mockResolvedValue({ message: 'Dokumen ditolak.' });
  });

  it('TC-DS-DOK-01: Dosen melihat dokumen miliknya -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/dokumen?tab=semua')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(DOKUMEN_ID);
    expect(mockDocumentService.getDosenDocuments).toHaveBeenCalledWith(DOSEN_ID, expect.objectContaining({ tab: 'semua' }));
  });

  it('TC-DS-DOK-02: Dosen upload dokumen mandiri PDF -> 201', async () => {
    const res = await request(app)
      .post('/api/dosen/dokumen/upload')
      .set('Authorization', `Bearer ${dosenToken}`)
      .attach('file', Buffer.from('%PDF-1.4 test'), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('nama', 'Dokumen Mandiri')
      .field('jenis_dokumen', 'SERTIFIKAT')
      .field('tanggal_upload', '2025-01-10');
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(DOKUMEN_ID);
    expect(mockDocumentService.uploadDosenDocument).toHaveBeenCalledWith(DOSEN_ID, expect.any(Object), expect.any(Object));
  });

  it('TC-DS-DOK-03: Upload format tidak valid -> 500 dari multer error handler', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(app)
      .post('/api/dosen/dokumen/upload')
      .set('Authorization', `Bearer ${dosenToken}`)
      .attach('file', Buffer.from('image data'), { filename: 'foto.png', contentType: 'image/png' })
      .field('nama', 'Foto');
    consoleErrorSpy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Format file tidak didukung/);
  });

  it('TC-DS-DOK-04: Preview dokumen -> 200', async () => {
    const res = await request(app)
      .get(`/api/dosen/dokumen/${DOKUMEN_ID}/preview`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/^https:\/\//);
  });

  it('TC-DS-DOK-05: Download content dokumen -> 200 dengan header hash', async () => {
    const res = await request(app)
      .get(`/api/dosen/dokumen/${DOKUMEN_ID}/content`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['x-content-sha256']).toBe('hash-test');
  });

  it('TC-DS-DOK-06: Update metadata dokumen bukan pemilik -> 403', async () => {
    mockDocumentService.updateMetadata.mockRejectedValueOnce(new Error('Akses ditolak. Anda bukan pemilik dokumen.'));
    const res = await request(app)
      .put(`/api/dosen/dokumen/${DOKUMEN_ID}/metadata`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ nama: 'Update' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/bukan pemilik/);
  });

  it('TC-DS-DOK-07: Dosen menerima dokumen distribusi -> 200', async () => {
    const res = await request(app)
      .patch(`/api/dosen/dokumen/${DOKUMEN_ID}/terima`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/diterima/);
    expect(mockDistributionService.acceptDocument).toHaveBeenCalledWith(DOSEN_ID, DOKUMEN_ID);
  });

  it('TC-DS-DOK-08: Dosen melihat riwayat distribusi -> 200', async () => {
    const res = await request(app)
      .get('/api/dosen/dokumen/riwayat-distribusi')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('DISETUJUI');
  });
});

describe('Dosen - Highlights Dokumen', () => {
  let app: express.Application;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    dosenToken = makeDosenToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHighlightService.getHighlightsByDocumentAndDosen.mockResolvedValue({
      kepemilikanId: KEPEMILIKAN_ID,
      highlights: [{ id: HIGHLIGHT_ID, text: 'catatan' }],
    });
    mockHighlightService.syncHighlights.mockResolvedValue([{ id: HIGHLIGHT_ID }]);
    mockHighlightService.addHighlight.mockResolvedValue({ id: HIGHLIGHT_ID });
    mockHighlightService.updateHighlight.mockResolvedValue({ id: HIGHLIGHT_ID, text: 'update' });
    mockHighlightService.deleteHighlight.mockResolvedValue(undefined);
  });

  it('TC-DS-HL-01: Dosen mengambil highlight berdasarkan dokumenId -> 200', async () => {
    const res = await request(app)
      .get(`/api/dosen/highlights?dokumenId=${DOKUMEN_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kepemilikanId).toBe(KEPEMILIKAN_ID);
    expect(mockHighlightService.getHighlightsByDocumentAndDosen).toHaveBeenCalledWith(DOKUMEN_ID, DOSEN_ID);
  });

  it('TC-DS-HL-02: Request highlight tanpa parameter -> 400', async () => {
    const res = await request(app)
      .get('/api/dosen/highlights')
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing kepemilikanId or dokumenId/);
  });

  it('TC-DS-HL-03: Dosen sinkronisasi highlights -> 200', async () => {
    const highlights = [{ text: 'catatan', page: 1 }];
    const res = await request(app)
      .post(`/api/dosen/highlights/${KEPEMILIKAN_ID}/sync`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ highlights });
    expect(res.status).toBe(200);
    expect(mockHighlightService.syncHighlights).toHaveBeenCalledWith(KEPEMILIKAN_ID, highlights, DOSEN_ID);
  });

  it('TC-DS-HL-04: Dosen tambah highlight -> 201', async () => {
    const payload = { text: 'catatan', page: 1 };
    const res = await request(app)
      .post(`/api/dosen/highlights/${KEPEMILIKAN_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(mockHighlightService.addHighlight).toHaveBeenCalledWith(KEPEMILIKAN_ID, payload, DOSEN_ID);
  });

  it('TC-DS-HL-05: Highlight bukan milik dosen -> 403', async () => {
    mockHighlightService.updateHighlight.mockRejectedValueOnce(new Error('Anda tidak memiliki akses ke highlight ini.'));
    const res = await request(app)
      .put(`/api/dosen/highlights/${HIGHLIGHT_ID}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ text: 'update' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/tidak memiliki akses/);
  });
});
