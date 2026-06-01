import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/authMiddleware';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 'error', error: 'Email dan password wajib diisi.' });
    return;
  }

  const now = new Date();

  // Mengambil data user beserta jabatan kajur/kaprodi yang aktif di periode sekarang
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      dosen: {
        include: {
          jabatan_kajur: {
            where: {
              periode_mulai: { lte: now },
              periode_selesai: { gte: now },
            },
            select: { id: true, jurusan_id: true }
          },
          jabatan_kaprodi: {
            where: {
              periode_mulai: { lte: now },
              periode_selesai: { gte: now },
            },
            select: { id: true, program_studi_id: true }
          }
        }
      }
    }
  });

  if (!user) {
    res.status(401).json({ status: 'error', error: 'Email atau password salah.' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ status: 'error', error: 'Email atau password salah.' });
    return;
  }

  // Menentukan status jabatan aktif
  const isKajur = (user.dosen?.jabatan_kajur.length ?? 0) > 0;
  const isKaprodi = (user.dosen?.jabatan_kaprodi.length ?? 0) > 0;

  // Informasi tambahan entitas terkait jika diperlukan oleh frontend/middleware
  const jabatanAktif = {
    is_kajur: isKajur,
    is_kaprodi: isKaprodi,
    jurusan_id: isKajur ? user.dosen?.jabatan_kajur[0].jurusan_id : null,
    program_studi_id: isKaprodi ? user.dosen?.jabatan_kaprodi[0].program_studi_id : null
  };

  // Memasukkan status jabatan aktif ke dalam payload JWT
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      jabatan: jabatanAktif
    },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  res.status(200).json({
    status: 'success',
    data: { 
      token, 
      role: user.role, 
      email: user.email,
      jabatan: jabatanAktif
    }
  });
}));

// POST /api/auth/google-login
router.post('/google-login', asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ status: 'error', error: 'ID Token wajib dikirimkan.' });
    return;
  }

  // 1. Verifikasi token Google
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    res.status(401).json({ status: 'error', error: 'Token Google tidak valid atau kedaluwarsa.' });
    return;
  }

  if (!payload || !payload.email) {
    res.status(400).json({ status: 'error', error: 'Gagal mendapatkan informasi email dari Google.' });
    return;
  }

  const email = payload.email;
  const now = new Date();

  // 2. Cek apakah email terdaftar di database local
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      dosen: {
        include: {
          jabatan_kajur: {
            where: {
              periode_mulai: { lte: now },
              periode_selesai: { gte: now },
            },
            select: { id: true, jurusan_id: true }
          },
          jabatan_kaprodi: {
            where: {
              periode_mulai: { lte: now },
              periode_selesai: { gte: now },
            },
            select: { id: true, program_studi_id: true }
          }
        }
      }
    }
  });

  // Jika email tidak ditemukan, tolak login (karena akun harus didaftarkan admin terlebih dahulu)
  if (!user) {
    res.status(403).json({ 
      status: 'error', 
      error: 'Email Google Anda belum terdaftar di sistem. Silakan hubungi admin.' 
    });
    return;
  }

  // 3. Menentukan status jabatan aktif jika user adalah dosen
  const isKajur = (user.dosen?.jabatan_kajur.length ?? 0) > 0;
  const isKaprodi = (user.dosen?.jabatan_kaprodi.length ?? 0) > 0;

  const jabatanAktif = {
    is_kajur: isKajur,
    is_kaprodi: isKaprodi,
    jurusan_id: isKajur ? user.dosen?.jabatan_kajur[0].jurusan_id : null,
    program_studi_id: isKaprodi ? user.dosen?.jabatan_kaprodi[0].program_studi_id : null
  };

  // 4. Generate JWT Token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      jabatan: jabatanAktif
    },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  res.status(200).json({
    status: 'success',
    data: { 
      token, 
      role: user.role, 
      email: user.email,
      jabatan: jabatanAktif
    }
  });
}));

export default router;