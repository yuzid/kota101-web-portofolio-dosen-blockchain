/**
 * Test Suite: General Features (Authentication)
 * Path: /api/auth/*
 */

import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';

// ─── Mocking Dependencies ──────────────────────────────────────────────────────

const mockPrismaUser = {
  findUnique: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

// ─── Express App Builder ──────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const authRoutes = require('../routes/authRoutes').default;
  const { errorHandler } = require('../middleware/authMiddleware');

  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('General — Form Login', () => {
  let app: express.Application;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-GEN-AUTH-01: Login sukses dengan email dan password valid → 200', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      email: 'dosen@example.com',
      password_hash: 'hashed_password_123',
      role: 'DOSEN',
      dosen: {
        nama: 'Dosen Test',
        program_studi: { nama_prodi: 'Teknik Informatika' },
        jabatan_kajur: [],
        jabatan_kaprodi: [],
      },
    };

    mockPrismaUser.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dosen@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('dosen@example.com');
    expect(res.body.data.role).toBe('DOSEN');
    expect(res.body.data.name).toBe('Dosen Test');
    expect(res.body.data.token).toBeDefined();
  });

  it('TC-GEN-AUTH-02: Login gagal karena password salah → 401', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      email: 'dosen@example.com',
      password_hash: 'hashed_password_123',
      role: 'DOSEN',
    };

    mockPrismaUser.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dosen@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/Email atau password salah/);
  });

  it('TC-GEN-AUTH-03: Login gagal karena email belum terdaftar → 401', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/Email atau password salah/);
  });

  it('TC-GEN-AUTH-04: Bad Request jika email atau password kosong → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/wajib diisi/);
  });
});

describe('General — Google OAuth Login', () => {
  let app: express.Application;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-GEN-GGL-01: Login sukses dengan ID Token Google valid → 200', async () => {
    const mockGooglePayload = {
      email: 'dosen@example.com',
      name: 'Google User',
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload,
    });

    const mockUser = {
      id: 'user-uuid-123',
      email: 'dosen@example.com',
      password_hash: 'hashed_password_123',
      role: 'DOSEN',
      dosen: {
        nama: 'Dosen Test',
        program_studi: { nama_prodi: 'Teknik Informatika' },
        jabatan_kajur: [],
        jabatan_kaprodi: [],
      },
    };

    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ idToken: 'valid-google-id-token-123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('dosen@example.com');
    expect(res.body.data.token).toBeDefined();
  });

  it('TC-GEN-GGL-02: Login ditolak jika email Google belum terdaftar → 403', async () => {
    const mockGooglePayload = {
      email: 'unregistered@example.com',
      name: 'Unregistered User',
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload,
    });

    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ idToken: 'unregistered-google-id-token' });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/belum terdaftar di sistem/);
  });

  it('TC-GEN-GGL-03: Login gagal karena ID Token tidak valid → 401', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token signature'));

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ idToken: 'invalid-token-abc' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/Token Google tidak valid atau kedaluwarsa/);
  });

  it('TC-GEN-GGL-04: Bad Request jika idToken tidak dikirim → 400', async () => {
    const res = await request(app)
      .post('/api/auth/google-login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/ID Token wajib dikirimkan/);
  });
});
