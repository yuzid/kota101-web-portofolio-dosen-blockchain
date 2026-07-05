/**
 * Test Suite: Admin Features
 * Roles: ADMIN, TATA_USAHA, DOSEN
 * Base Paths: /api/admin/users, /api/admin/akademik, /api/admin/jabatan
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import bcrypt from 'bcrypt';

// ─── Mocking External Dependencies ─────────────────────────────────────────────

const mockPrismaUser = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaDosen = {
  findUnique: jest.fn(),
};

const mockPrismaJurusan = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaProgramStudi = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaJabatanKajur = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaJabatanKaprodi = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
    dosen: mockPrismaDosen,
    jurusan: mockPrismaJurusan,
    programStudi: mockPrismaProgramStudi,
    jabatanKajur: mockPrismaJabatanKajur,
    jabatanKaprodi: mockPrismaJabatanKaprodi,
  },
}));

// Mock blockchain services
jest.mock('../services/MultiChainService', () => {
  return {
    MultiChainService: jest.fn().mockImplementation(() => ({
      createPublisherAddress: jest.fn().mockResolvedValue('0xMockBlockchainPublisherAddress123'),
    })),
  };
});

jest.mock('../lib/blockchainNode', () => ({
  resolveBlockchainNode: jest.fn().mockReturnValue('mockNode'),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed_password_mock'),
}));

// ─── Constants & Token Generators ─────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_SECRET = JWT_SECRET;

const makeAdminToken = () =>
  jwt.sign(
    {
      id: 'admin-uuid-001',
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'Admin Test',
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeTUToken = (jurusanId = 'jurusan-uuid-001') =>
  jwt.sign(
    {
      id: 'tu-uuid-001',
      email: 'tu@example.com',
      role: 'TATA_USAHA',
      name: 'TU Test',
      jurusan_id: jurusanId,
      jabatan: { is_kajur: false, is_kaprodi: false, jurusan_id: null, program_studi_id: null },
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeDosenToken = () =>
  jwt.sign(
    {
      id: 'dosen-uuid-001',
      email: 'dosen@example.com',
      role: 'DOSEN',
      name: 'Dosen Test',
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
  const adminUserRoutes = require('../routes/admin/userRoutes').default;
  const adminAkademikRoutes = require('../routes/admin/akademik').default;
  const adminJabatanRoutes = require('../routes/admin/jabatan').default;

  app.use('/api/admin/users', verifyToken, requireRole(['admin', 'tata_usaha', 'dosen']), adminUserRoutes);
  app.use('/api/admin/akademik', verifyToken, requireRole(['admin', 'tata_usaha', 'dosen']), adminAkademikRoutes);
  app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), adminJabatanRoutes);

  app.use(errorHandler);
  return app;
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('Admin — User CRUD Management', () => {
  let app: express.Application;
  let adminToken: string;
  let tuToken: string;

  beforeAll(() => {
    app = buildTestApp();
    adminToken = makeAdminToken();
    tuToken = makeTUToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-ADM-USR-01: Admin mengambil seluruh daftar user → 200', async () => {
    mockPrismaUser.findMany.mockResolvedValue([
      { id: '1', email: 'dosen1@example.com', role: 'DOSEN' },
      { id: '2', email: 'admin@example.com', role: 'ADMIN' },
    ]);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBe(2);
  });

  it('TC-ADM-USR-02: Admin membuat akun Dosen baru (data valid) → 201', async () => {
    // Mock user email check
    mockPrismaUser.findUnique.mockResolvedValueOnce(null); // findByEmail
    // Mock program studi check
    mockPrismaProgramStudi.findUnique.mockResolvedValue({ id: 'prodi-001', nama_prodi: 'Informatika' });
    // Mock user create
    mockPrismaUser.create.mockResolvedValue({
      id: 'dosen-new-001',
      email: 'newdosen@example.com',
      role: 'DOSEN',
    });

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newdosen@example.com',
        password: 'securepassword123',
        role: 'DOSEN',
        nama: 'Dosen Baru',
        nip: '198701012025011001',
        nidn: '0401018701',
        program_studi_id: 'prodi-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe('dosen-new-001');
  });

  it('TC-ADM-USR-03: Validasi password kurang dari 8 karakter → 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'short@example.com',
        password: 'short',
        role: 'DOSEN',
        nama: 'Short Pwd Dosen',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password minimal 8 karakter/);
  });

  it('TC-ADM-USR-07: Admin mencoba menghapus akunnya sendiri → 403', async () => {
    // Current admin user id is 'admin-uuid-001' from makeAdminToken()
    const res = await request(app)
      .delete('/api/admin/users/admin-uuid-001')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Tidak bisa menghapus akun sendiri/);
  });
});

describe('Admin — Academic Management (Jurusan & Prodi)', () => {
  let app: express.Application;
  let adminToken: string;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    adminToken = makeAdminToken();
    dosenToken = makeDosenToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-ADM-JUR-01: Semua user bisa mengambil data jurusan → 200', async () => {
    mockPrismaJurusan.findMany.mockResolvedValue([
      { id: 'j-1', kode_jurusan: 'TE', nama_jurusan: 'Teknik Elektro' },
    ]);

    const res = await request(app)
      .get('/api/admin/akademik/jurusan')
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('TC-ADM-JUR-02: Admin bisa membuat Jurusan baru → 201', async () => {
    mockPrismaJurusan.findUnique.mockResolvedValue(null); // no duplicate code
    mockPrismaJurusan.create.mockResolvedValue({
      id: 'j-new',
      kode_jurusan: 'TI',
      nama_jurusan: 'Teknologi Informasi',
    });

    const res = await request(app)
      .post('/api/admin/akademik/jurusan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kode_jurusan: 'TI', nama_jurusan: 'Teknologi Informasi' });

    expect(res.status).toBe(201);
    expect(res.body.data.kode_jurusan).toBe('TI');
  });

  it('TC-ADM-JUR-03: Validasi kode jurusan duplikat → 409', async () => {
    mockPrismaJurusan.findUnique.mockResolvedValue({ id: 'existing-j-1', kode_jurusan: 'TI' });

    const res = await request(app)
      .post('/api/admin/akademik/jurusan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kode_jurusan: 'TI', nama_jurusan: 'Teknologi Informasi Baru' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Kode jurusan sudah digunakan/);
  });

  it('TC-ADM-JUR-06: Validasi hapus jurusan yang masih memiliki prodi → 400', async () => {
    mockPrismaJurusan.findUnique.mockResolvedValue({
      id: 'j-1',
      kode_jurusan: 'TI',
      program_studi: [{ id: 'p-1' }], // has prodi
    });

    const res = await request(app)
      .delete('/api/admin/akademik/jurusan/j-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tidak bisa dihapus karena masih memiliki/);
  });
});

describe('Admin — Jabatan Management (Kajur & Kaprodi)', () => {
  let app: express.Application;
  let adminToken: string;

  beforeAll(() => {
    app = buildTestApp();
    adminToken = makeAdminToken();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-ADM-JAB-01: Admin menugaskan Dosen sebagai Kajur baru → 201', async () => {
    mockPrismaDosen.findUnique.mockResolvedValue({ id: 'dosen-1', nama: 'Dosen Satu' });
    mockPrismaJabatanKajur.findFirst.mockResolvedValue(null); // no overlap
    mockPrismaJabatanKajur.create.mockResolvedValue({
      id: 'kajur-new-id',
      dosen_id: 'dosen-1',
      jurusan_id: 'j-1',
      periode_mulai: new Date('2026-01-01'),
      periode_selesai: new Date('2030-01-01'),
    });

    const res = await request(app)
      .post('/api/admin/jabatan/kajur')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dosen_id: 'dosen-1',
        jurusan_id: 'j-1',
        periode_mulai: '2026-01-01',
        periode_selesai: '2030-01-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('TC-ADM-JAB-02: Validasi assign Kajur baru pada periode tumpang tindih (overlap) → 409', async () => {
    mockPrismaDosen.findUnique.mockResolvedValue({ id: 'dosen-2', nama: 'Dosen Dua' });
    // Overlapping record found
    mockPrismaJabatanKajur.findFirst.mockResolvedValue({
      id: 'existing-kajur-id',
      jurusan_id: 'j-1',
    });

    const res = await request(app)
      .post('/api/admin/jabatan/kajur')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dosen_id: 'dosen-2',
        jurusan_id: 'j-1',
        periode_mulai: '2026-06-01',
        periode_selesai: '2028-06-01',
      });

    // controller throws error: 'Jurusan ini sudah memiliki Kajur aktif pada periode tersebut.'
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/sudah memiliki Kajur aktif/);
  });
});

describe('Admin — Access Control Enforcement', () => {
  let app: express.Application;
  let dosenToken: string;

  beforeAll(() => {
    app = buildTestApp();
    dosenToken = makeDosenToken();
  });

  it('TC-ADM-SEC-02: Dosen biasa dilarang menugaskan Kajur / Kaprodi → 403', async () => {
    const res = await request(app)
      .post('/api/admin/jabatan/kajur')
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({
        dosen_id: 'dosen-1',
        jurusan_id: 'j-1',
        periode_mulai: '2026-01-01',
        periode_selesai: '2030-01-01',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Akses ditolak/);
  });
});
