// routes/admin/akademik.ts
import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthRequest, asyncHandler } from '../../middleware/authMiddleware';

const router = Router();

// ═══════════════════════════════════════════════════════
// JURUSAN
// ═══════════════════════════════════════════════════════

// GET /api/admin/akademik/jurusan
router.get('/jurusan', asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await prisma.jurusan.findMany({
    include: {
      program_studi: {
        select: { id: true, kode_prodi: true, nama_prodi: true },
      },
    },
    orderBy: { kode_jurusan: 'asc' },
  });
  res.json({ status: 'success', data });
}));

// GET /api/admin/akademik/jurusan/:id
router.get('/jurusan/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const data = await prisma.jurusan.findUnique({
    where: { id },
    include: {
      program_studi: {
        select: { id: true, kode_prodi: true, nama_prodi: true },
      },
    },
  });

  if (!data) {
    res.status(404).json({ status: 'error', error: 'Jurusan tidak ditemukan.' });
    return;
  }

  res.json({ status: 'success', data });
}));

// POST /api/admin/akademik/jurusan
// Body: { kode_jurusan, nama_jurusan }
router.post('/jurusan', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { kode_jurusan, nama_jurusan } = req.body;

  if (!kode_jurusan || !nama_jurusan) {
    res.status(400).json({ status: 'error', error: 'kode_jurusan dan nama_jurusan wajib diisi.' });
    return;
  }

  const existing = await prisma.jurusan.findUnique({ where: { kode_jurusan } });
  if (existing) {
    res.status(409).json({ status: 'error', error: 'Kode jurusan sudah digunakan.' });
    return;
  }

  const data = await prisma.jurusan.create({
    data: { kode_jurusan, nama_jurusan },
    include: {
      program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
    },
  });

  res.status(201).json({ status: 'success', data });
}));

// PATCH /api/admin/akademik/jurusan/:id
// Body: { kode_jurusan?, nama_jurusan? }
router.patch('/jurusan/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;
  const { kode_jurusan, nama_jurusan } = req.body;

  const existing = await prisma.jurusan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jurusan tidak ditemukan.' });
    return;
  }

  // Cek duplikat kode jika diubah
  if (kode_jurusan && kode_jurusan !== existing.kode_jurusan) {
    const taken = await prisma.jurusan.findUnique({ where: { kode_jurusan } });
    if (taken) {
      res.status(409).json({ status: 'error', error: 'Kode jurusan sudah digunakan.' });
      return;
    }
  }

  const data = await prisma.jurusan.update({
    where: { id },
    data: {
      ...(kode_jurusan && { kode_jurusan }),
      ...(nama_jurusan && { nama_jurusan }),
    },
    include: {
      program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
    },
  });

  res.json({ status: 'success', data });
}));

// DELETE /api/admin/akademik/jurusan/:id
router.delete('/jurusan/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const existing = await prisma.jurusan.findUnique({
    where: { id },
    include: { program_studi: { select: { id: true } } },
  });

  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jurusan tidak ditemukan.' });
    return;
  }

  // Cegah hapus jurusan yang masih punya prodi
  if (existing.program_studi.length > 0) {
    res.status(400).json({
      status: 'error',
      error: `Jurusan tidak bisa dihapus karena masih memiliki ${existing.program_studi.length} program studi.`,
    });
    return;
  }

  await prisma.jurusan.delete({ where: { id } });
  res.json({ status: 'success', message: `Jurusan "${existing.nama_jurusan}" berhasil dihapus.` });
}));

// ═══════════════════════════════════════════════════════
// PROGRAM STUDI
// ═══════════════════════════════════════════════════════

// GET /api/admin/akademik/prodi?jurusan_id=...
router.get('/prodi', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jurusan_id } = req.query;

  const data = await prisma.programStudi.findMany({
    where: jurusan_id ? { jurusan_id: String(jurusan_id) } : undefined,
    include: {
      jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
    },
    orderBy: { kode_prodi: 'asc' },
  });

  res.json({ status: 'success', data });
}));

// GET /api/admin/akademik/prodi/:id
router.get('/prodi/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const data = await prisma.programStudi.findUnique({
    where: { id },
    include: {
      jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
    },
  });

  if (!data) {
    res.status(404).json({ status: 'error', error: 'Program studi tidak ditemukan.' });
    return;
  }

  res.json({ status: 'success', data });
}));

// POST /api/admin/akademik/prodi
// Body: { kode_prodi, nama_prodi, jurusan_id }
router.post('/prodi', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { kode_prodi, nama_prodi, jurusan_id } = req.body;

  if (!kode_prodi || !nama_prodi || !jurusan_id) {
    res.status(400).json({ status: 'error', error: 'kode_prodi, nama_prodi, dan jurusan_id wajib diisi.' });
    return;
  }

  // Pastikan jurusan ada
  const jurusan = await prisma.jurusan.findUnique({ where: { id: jurusan_id } });
  if (!jurusan) {
    res.status(404).json({ status: 'error', error: 'Jurusan tidak ditemukan.' });
    return;
  }

  // Cek kode prodi duplikat
  const existing = await prisma.programStudi.findUnique({ where: { kode_prodi } });
  if (existing) {
    res.status(409).json({ status: 'error', error: 'Kode program studi sudah digunakan.' });
    return;
  }

  const data = await prisma.programStudi.create({
    data: { kode_prodi, nama_prodi, jurusan_id },
    include: {
      jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
    },
  });

  res.status(201).json({ status: 'success', data });
}));

// PATCH /api/admin/akademik/prodi/:id
// Body: { kode_prodi?, nama_prodi?, jurusan_id? }
router.patch('/prodi/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;
  const { kode_prodi, nama_prodi, jurusan_id } = req.body;

  const existing = await prisma.programStudi.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Program studi tidak ditemukan.' });
    return;
  }

  // Cek duplikat kode jika diubah
  if (kode_prodi && kode_prodi !== existing.kode_prodi) {
    const taken = await prisma.programStudi.findUnique({ where: { kode_prodi } });
    if (taken) {
      res.status(409).json({ status: 'error', error: 'Kode program studi sudah digunakan.' });
      return;
    }
  }

  // Pastikan jurusan tujuan ada jika diubah
  if (jurusan_id) {
    const jurusan = await prisma.jurusan.findUnique({ where: { id: jurusan_id } });
    if (!jurusan) {
      res.status(404).json({ status: 'error', error: 'Jurusan tidak ditemukan.' });
      return;
    }
  }

  const data = await prisma.programStudi.update({
    where: { id },
    data: {
      ...(kode_prodi && { kode_prodi }),
      ...(nama_prodi && { nama_prodi }),
      ...(jurusan_id && { jurusan_id }),
    },
    include: {
      jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
    },
  });

  res.json({ status: 'success', data });
}));

// DELETE /api/admin/akademik/prodi/:id
router.delete('/prodi/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const existing = await prisma.programStudi.findUnique({
    where: { id },
    include: { dosen: { select: { id: true } } },
  });

  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Program studi tidak ditemukan.' });
    return;
  }

  // Cegah hapus prodi yang masih punya dosen
  if (existing.dosen.length > 0) {
    res.status(400).json({
      status: 'error',
      error: `Program studi tidak bisa dihapus karena masih memiliki ${existing.dosen.length} dosen terdaftar.`,
    });
    return;
  }

  await prisma.programStudi.delete({ where: { id } });
  res.json({ status: 'success', message: `Program studi "${existing.nama_prodi}" berhasil dihapus.` });
}));

export default router;