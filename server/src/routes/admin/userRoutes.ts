import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AuthRequest, asyncHandler } from '../../middleware/authMiddleware';

const router = Router();

const userSelect = {
  id: true,
  email: true,
  role: true,
  admin: { select: { nama: true } },
  tata_usaha: { select: { nip: true, nama: true, jurusan_id: true } },
  dosen: {
    select: {
      nip: true,
      nidn: true,
      nama: true,
      program_studi: { select: { id: true, nama_prodi: true, jurusan_id: true } }
    }
  },
};

// ───────────────────────────────────────────
// GET /api/admin/users — list semua user (Scoped)
// ───────────────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.query;
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  let whereClause: any = {};

  // Filter global berdasarkan query parameter role jika ada
  if (role) {
    whereClause.role = String(role).toUpperCase();
  }

  // Jika diakses oleh Tata Usaha, batasi hanya untuk Dosen di Jurusan yang sama
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    if (!currentUser.jurusan_id) {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Akun TU Anda tidak terikat ke jurusan mana pun.' });
      return;
    }

    whereClause.role = 'DOSEN'; // Paksa hanya bisa melihat DOSEN
    whereClause.dosen = {
      program_studi: {
        jurusan_id: currentUser.jurusan_id
      }
    };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: userSelect,
    orderBy: { email: 'asc' },
  });

  res.json({ status: 'success', data: users });
}));

// ───────────────────────────────────────────
// GET /api/admin/users/:id — detail satu user (Scoped)
// ───────────────────────────────────────────
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  // Validasi Otoritas Tata Usaha lintas jurusan
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    const isDosenInSameJurusan = user.dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
    if (user.role !== 'DOSEN' || !isDosenInSameJurusan) {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda tidak berwenang melihat data di luar jurusan Anda.' });
      return;
    }
  }

  res.json({ status: 'success', data: user });
}));

// ───────────────────────────────────────────
// POST /api/admin/users — buat user baru (Validated)
// ───────────────────────────────────────────
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role, nama, nip, nidn, program_studi_id, jurusan_id } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  // Batasan Aksi Kerja Tata Usaha
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    if (role?.toUpperCase() !== 'DOSEN') {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Tata Usaha hanya diizinkan membuat akun DOSEN.' });
      return;
    }

    // Validasi apakah prodi yang dipilih berada di bawah Jurusan milik TU tersebut
    const targetProdi = await prisma.programStudi.findFirst({
      where: { id: program_studi_id, jurusan_id: currentUser.jurusan_id! }
    });

    if (!targetProdi) {
      res.status(400).json({ status: 'error', error: 'Program studi yang dipilih tidak valid atau berada di luar yurisdiksi jurusan Anda.' });
      return;
    }
  }

  // Validasi umum
  if (!email || !password || !role || !nama) {
    res.status(400).json({ status: 'error', error: 'email, password, role, dan nama wajib diisi.' });
    return;
  }

  const validRoles = ['ADMIN', 'TATA_USAHA', 'DOSEN'];
  if (!validRoles.includes(role.toUpperCase())) {
    res.status(400).json({ status: 'error', error: `Role tidak valid. Pilihan: ${validRoles.join(', ')}` });
    return;
  }

  if (role === 'TATA_USAHA' && !nip) {
    res.status(400).json({ status: 'error', error: 'NIP wajib diisi untuk Tata Usaha.' });
    return;
  }
  if (role === 'DOSEN' && (!nip || !nidn || !program_studi_id)) {
    res.status(400).json({ status: 'error', error: 'NIP, NIDN, dan program_studi_id wajib diisi untuk Dosen.' });
    return;
  }
  if (role === 'TATA_USAHA' && !jurusan_id) {
    res.status(400).json({ status: 'error', error: 'Jurusan_id wajib diisi untuk Tata Usaha.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ status: 'error', error: 'Email sudah terdaftar.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role: role.toUpperCase(),
      ...(role.toUpperCase() === 'ADMIN' && { admin: { create: { nama } } }),
      ...(role.toUpperCase() === 'TATA_USAHA' && { tata_usaha: { create: { nip, nama, jurusan_id } } }),
      ...(role.toUpperCase() === 'DOSEN' && { dosen: { create: { nip, nidn, nama, program_studi_id } } }),
    },
    select: userSelect,
  });

  res.status(201).json({ status: 'success', data: user });
}));

// ───────────────────────────────────────────
// PATCH /api/admin/users/:id — update user (Validated)
// ───────────────────────────────────────────
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { email, password, nama, nip, nidn, program_studi_id, jurusan_id } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  const existing = await prisma.user.findUnique({ 
    where: { id },
    include: { dosen: { include: { program_studi: true } } } 
  });
  
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  // Validasi Cakupan Hak Akses Terstruktur Tata Usaha
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    const isDosenInSameJurusan = existing.dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
    if (existing.role !== 'DOSEN' || !isDosenInSameJurusan) {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda tidak berwenang mengubah data user di luar jurusan Anda.' });
      return;
    }

    // Jika TU mengubah program studi dosen, pastikan target prodi baru tetap se-jurusan
    if (program_studi_id) {
      const validProdi = await prisma.programStudi.findFirst({
        where: { id: program_studi_id, jurusan_id: currentUser.jurusan_id! }
      });
      if (!validProdi) {
        res.status(400).json({ status: 'error', error: 'Program studi baru berada di luar yurisdiksi jurusan Anda.' });
        return;
      }
    }
  }

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

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.user.update({ where: { id }, data: updateData });
    }

    const profileData: Record<string, unknown> = {};
    if (nama) profileData.nama = nama;

    if (existing.role === 'TATA_USAHA' && (nama || nip || jurusan_id)) {
      if (nip) profileData.nip = nip;
      if (jurusan_id) profileData.jurusan_id = jurusan_id;
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
// DELETE /api/admin/users/:id — hapus user (Validated)
// ───────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  if (currentUser.id === id) {
    res.status(400).json({ status: 'error', error: 'Tidak bisa menghapus akun sendiri.' });
    return;
  }

  const existing = await prisma.user.findUnique({ 
    where: { id },
    include: { dosen: { include: { program_studi: true } } }
  });

  if (!existing) {
    res.status(404).json({ status: 'error', error: 'User tidak ditemukan.' });
    return;
  }

  // Validasi Penghapusan oleh Tata Usaha
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    const isDosenInSameJurusan = existing.dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
    if (existing.role !== 'DOSEN' || !isDosenInSameJurusan) {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda tidak berwenang menghapus data user di luar jurusan Anda.' });
      return;
    }
  }

  await prisma.user.delete({ where: { id } });
  res.json({ status: 'success', message: `User ${existing.email} berhasil dihapus.` });
}));

export default router;