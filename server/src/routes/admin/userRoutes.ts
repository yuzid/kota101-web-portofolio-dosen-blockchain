import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AuthRequest, asyncHandler } from '../../middleware/authMiddleware';


const router = Router();

// Helper: ambil profile berdasarkan role
const userSelect = {
  id: true,
  email: true,
  role: true,
  admin: { select: { nama: true } },
  tata_usaha: { select: { nip: true, nama: true } },
  dosen: {
    select: {
      nip: true, nidn: true, nama: true,
      program_studi: { select: { id: true, nama_prodi: true } }
    }
  },
};

// ───────────────────────────────────────────
// GET /api/admin/users — list semua user
// ───────────────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.query;

  const users = await prisma.user.findMany({
    where: role ? { role: String(role).toUpperCase() } : undefined,
    select: userSelect,
    orderBy: { email: 'asc' },
  });

  res.json({ status: 'success', data: users });
}));

// ───────────────────────────────────────────
// GET /api/admin/users/:id — detail satu user
// ───────────────────────────────────────────
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
    
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  res.json({ status: 'success', data: user });
}));

// ───────────────────────────────────────────
// POST /api/admin/users — buat user baru
// Body untuk ADMIN:      { email, password, role: 'ADMIN', nama }
// Body untuk TATA_USAHA: { email, password, role: 'TATA_USAHA', nama, nip }
// Body untuk DOSEN:      { email, password, role: 'DOSEN', nama, nip, nidn, program_studi_id }
// ───────────────────────────────────────────
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role, nama, nip, nidn, program_studi_id } = req.body;

  // Validasi umum
  if (!email || !password || !role || !nama) {
    res.status(400).json({ status: 'error', error: 'email, password, role, dan nama wajib diisi.' });
    return;
  }

  const validRoles = ['ADMIN', 'TATA_USAHA', 'DOSEN'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ status: 'error', error: `Role tidak valid. Pilihan: ${validRoles.join(', ')}` });
    return;
  }

  // Validasi per-role
  if (role === 'TATA_USAHA' && !nip) {
    res.status(400).json({ status: 'error', error: 'NIP wajib diisi untuk Tata Usaha.' });
    return;
  }
  if (role === 'DOSEN' && (!nip || !nidn || !program_studi_id)) {
    res.status(400).json({ status: 'error', error: 'NIP, NIDN, dan program_studi_id wajib diisi untuk Dosen.' });
    return;
  }

  // Cek email duplikat
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ status: 'error', error: 'Email sudah terdaftar.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Buat user + profile sekaligus (transaction implisit via nested create)
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role,
      ...(role === 'ADMIN' && {
        admin: { create: { nama } }
      }),
      ...(role === 'TATA_USAHA' && {
        tata_usaha: { create: { nip, nama } }
      }),
      ...(role === 'DOSEN' && {
        dosen: { create: { nip, nidn, nama, program_studi_id } }
      }),
    },
    select: userSelect,
  });

  res.status(201).json({ status: 'success', data: user });
}));

// ───────────────────────────────────────────
// PATCH /api/admin/users/:id — update user
// ───────────────────────────────────────────
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { email, password, nama, nip, nidn, program_studi_id } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  // Cek email duplikat jika email diubah
  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      res.status(409).json({ status: 'error', error: 'Email sudah digunakan user lain.' });
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (email) updateData.email = email;
  if (password) updateData.password_hash = await bcrypt.hash(password, 12);

  // Update user + profile dalam satu transaksi
  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.user.update({ where: { id }, data: updateData });
    }

    const profileData: Record<string, unknown> = {};
    if (nama) profileData.nama = nama;

    if (existing.role === 'TATA_USAHA' && (nama || nip)) {
      if (nip) profileData.nip = nip;
      await tx.tataUsaha.update({ where: { id }, data: profileData });
    }

    if (existing.role === 'DOSEN' && (nama || nip || nidn || program_studi_id)) {
      if (nip) profileData.nip = nip;
      if (nidn) profileData.nidn = nidn;
      if (program_studi_id) profileData.program_studi_id = program_studi_id;
      await tx.dosen.update({ where: { id }, data: profileData });
    }

    if (existing.role === 'ADMIN' && nama) {
      await tx.admin.update({ where: { id }, data: { nama } });
    }
  });

  const updated = await prisma.user.findUnique({ where: { id }, select: userSelect });
  res.json({ status: 'success', data: updated });
}));

// ───────────────────────────────────────────
// DELETE /api/admin/users/:id — hapus user
// ───────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  // Cegah admin hapus akun sendiri
  if (req.user?.id === id) {
    res.status(400).json({ status: 'error', error: 'Tidak bisa menghapus akun sendiri.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  // onDelete: Cascade di schema akan hapus profile (admin/dosen/tata_usaha) otomatis
  await prisma.user.delete({ where: { id } });

  res.json({ status: 'success', message: `User ${existing.email} berhasil dihapus.` });
}));

export default router;