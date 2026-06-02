import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { asyncHandler, AuthRequest } from '../middleware/authMiddleware';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const extractProfileData = (user: any) => {
  let nama = user.email.split('@')[0]; 
  let programStudi = null;

  const currentRole = user.role?.toUpperCase();

  if (currentRole === 'ADMIN' && user.admin) {
    nama = user.admin.nama;
  } else if (currentRole === 'TATA_USAHA' && user.tata_usaha) {
    nama = user.tata_usaha.nama;
  } else if (currentRole === 'DOSEN' && user.dosen) {
    nama = user.dosen.nama;
    programStudi = user.dosen.program_studi?.nama_prodi || null;
  }

  return { nama, programStudi };
};

//─────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
//─────────────────────────────────────────
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 'error', error: 'Email dan password wajib diisi.' });
    return;
  }

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      admin: { select: { nama: true } },
      tata_usaha:true,
      dosen: {
        include: {
          program_studi: { select: { nama_prodi: true } }, // Ambil nama prodi untuk dashboard
          jabatan_kajur: {
            where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
            select: { id: true, jurusan_id: true }
          },
          jabatan_kaprodi: {
            where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
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

  const isKajur = (user.dosen?.jabatan_kajur.length ?? 0) > 0;
  const isKaprodi = (user.dosen?.jabatan_kaprodi.length ?? 0) > 0;
  const profile = extractProfileData(user);

  const jabatanAktif = {
    is_kajur: isKajur,
    is_kaprodi: isKaprodi,
    jurusan_id: isKajur ? user.dosen?.jabatan_kajur[0].jurusan_id : null,
    program_studi_id: isKaprodi ? user.dosen?.jabatan_kaprodi[0].program_studi_id : null
  };

  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: profile.nama,
      programStudi: profile.programStudi,
      jurusan_id: user.role === 'TATA_USAHA' ? user.tata_usaha?.jurusan_id : null,
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
      name: profile.nama,
      programStudi: profile.programStudi,
      jabatan: jabatanAktif
    }
  });
}));

//─────────────────────────────────────────
// POST /api/auth/google-login
// Body: { idToken }
//─────────────────────────────────────────
router.post('/google-login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ status: 'error', error: 'ID Token wajib dikirimkan.' });
    return;
  }

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

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      admin: { select: { nama: true } },
      tata_usaha: { select: { nama: true } },
      dosen: {
        include: {
          program_studi: { select: { nama_prodi: true } },
          jabatan_kajur: {
            where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
            select: { id: true, jurusan_id: true }
          },
          jabatan_kaprodi: {
            where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
            select: { id: true, program_studi_id: true }
          }
        }
      }
    }
  });

  if (!user) {
    res.status(403).json({ 
      status: 'error', 
      error: 'Email Google Anda belum terdaftar di sistem. Silakan hubungi admin.' 
    });
    return;
  }

  const isKajur = (user.dosen?.jabatan_kajur.length ?? 0) > 0;
  const isKaprodi = (user.dosen?.jabatan_kaprodi.length ?? 0) > 0;
  const profile = extractProfileData(user);

  const jabatanAktif = {
    is_kajur: isKajur,
    is_kaprodi: isKaprodi,
    jurusan_id: isKajur ? user.dosen?.jabatan_kajur[0].jurusan_id : null,
    program_studi_id: isKaprodi ? user.dosen?.jabatan_kaprodi[0].program_studi_id : null
  };

  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: profile.nama,
      programStudi: profile.programStudi,
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
      name: profile.nama,
      programStudi: profile.programStudi,
      jabatan: jabatanAktif
    }
  });
}));

export default router;