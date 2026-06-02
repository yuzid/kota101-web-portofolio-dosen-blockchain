// routes/admin/jabatan.ts
import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthRequest, asyncHandler } from '../../middleware/authMiddleware';

const router = Router();

// ─── Helper: cek overlap periode ───────────────────────────────────────────
async function cekOverlapKajur(
  jurusan_id: string,
  periode_mulai: Date,
  periode_selesai: Date,
  excludeId?: string
) {
  return prisma.jabatanKajur.findFirst({
    where: {
      jurusan_id,
      id: excludeId ? { not: excludeId } : undefined,
      // Overlap terjadi jika: mulai_baru < selesai_lama AND selesai_baru > mulai_lama
      AND: [
        { periode_mulai: { lt: periode_selesai } },
        { periode_selesai: { gt: periode_mulai } },
      ],
    },
  });
}

async function cekOverlapKaprodi(
  program_studi_id: string,
  periode_mulai: Date,
  periode_selesai: Date,
  excludeId?: string
) {
  return prisma.jabatanKaprodi.findFirst({
    where: {
      program_studi_id,
      id: excludeId ? { not: excludeId } : undefined,
      AND: [
        { periode_mulai: { lt: periode_selesai } },
        { periode_selesai: { gt: periode_mulai } },
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════
// KAJUR
// ═══════════════════════════════════════════════════════

// ───────────────────────────────────────────
// GET /api/admin/jabatan/kajur?jurusan_id=...&dosen_id=...
// ───────────────────────────────────────────
router.get('/kajur', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jurusan_id, dosen_id } = req.query;

  const data = await prisma.jabatanKajur.findMany({
    where: {
      ...(jurusan_id && { jurusan_id: String(jurusan_id) }),
      ...(dosen_id && { dosen_id: String(dosen_id) }),
    },
    include: {
      dosen: { select: { nama: true, nip: true } },
      jurusan: { select: { nama_jurusan: true, kode_jurusan: true } },
    },
    orderBy: { periode_mulai: 'desc' },
  });

  res.json({ status: 'success', data });
}));
// ───────────────────────────────────────────
// POST /api/admin/jabatan/kajur — assign kajur baru
// Body: { dosen_id, jurusan_id, periode_mulai, periode_selesai }
// ───────────────────────────────────────────
router.post('/kajur', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dosen_id, jurusan_id, periode_mulai, periode_selesai } = req.body;

  if (!dosen_id || !jurusan_id || !periode_mulai || !periode_selesai) {
    res.status(400).json({ status: 'error', error: 'Semua field wajib diisi.' });
    return;
  }

  const mulai = new Date(periode_mulai);
  const selesai = new Date(periode_selesai);

  if (mulai >= selesai) {
    res.status(400).json({ status: 'error', error: 'periode_mulai harus sebelum periode_selesai.' });
    return;
  }

  // Pastikan dosen ada
  const dosen = await prisma.dosen.findUnique({ where: { id: dosen_id } });
  if (!dosen) {
    res.status(404).json({ status: 'error', error: 'Dosen tidak ditemukan.' });
    return;
  }

  // Cek overlap: di jurusan ini sudah ada kajur lain di periode yang sama?
  const overlap = await cekOverlapKajur(jurusan_id, mulai, selesai);
  if (overlap) {
    res.status(409).json({
      status: 'error',
      error: 'Jurusan ini sudah memiliki Kajur aktif pada periode tersebut.',
    });
    return;
  }

  const jabatan = await prisma.jabatanKajur.create({
    data: { dosen_id, jurusan_id, periode_mulai: mulai, periode_selesai: selesai },
    include: {
      dosen: { select: { nama: true, nip: true } },
      jurusan: { select: { nama_jurusan: true } },
    },
  });

  res.status(201).json({ status: 'success', data: jabatan });
}));

// ───────────────────────────────────────────
// PATCH /api/admin/jabatan/kajur/:id — update periode
// Body: { dosen_id?, periode_mulai?, periode_selesai? }
// ───────────────────────────────────────────
router.patch('/kajur/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;
  const { periode_mulai, periode_selesai, dosen_id } = req.body;

  const existing = await prisma.jabatanKajur.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jabatan tidak ditemukan.' });
    return;
  }

  const mulai = periode_mulai ? new Date(periode_mulai) : existing.periode_mulai;
  const selesai = periode_selesai ? new Date(periode_selesai) : existing.periode_selesai;

  if (mulai >= selesai) {
    res.status(400).json({ status: 'error', error: 'periode_mulai harus sebelum periode_selesai.' });
    return;
  }

  // Cek overlap, kecualikan record ini sendiri
  const overlap = await cekOverlapKajur(existing.jurusan_id, mulai, selesai, id);
  if (overlap) {
    res.status(409).json({
      status: 'error',
      error: 'Jurusan ini sudah memiliki Kajur aktif pada periode tersebut.',
    });
    return;
  }

  const updated = await prisma.jabatanKajur.update({
    where: { id },
    data: {
      ...(dosen_id && { dosen_id }),
      periode_mulai: mulai,
      periode_selesai: selesai,
    },
    include: {
      dosen: { select: { nama: true, nip: true } },
      jurusan: { select: { nama_jurusan: true } },
    },
  });

  res.json({ status: 'success', data: updated });
}));

// ───────────────────────────────────────────
// DELETE /api/admin/jabatan/kajur/:id
// ───────────────────────────────────────────
router.delete('/kajur/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const existing = await prisma.jabatanKajur.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jabatan tidak ditemukan.' });
    return;
  }

  await prisma.jabatanKajur.delete({ where: { id } });
  res.json({ status: 'success', message: 'Jabatan Kajur berhasil dihapus.' });
}));

// ═══════════════════════════════════════════════════════
// KAPRODI — struktur sama, beda foreign key
// ═══════════════════════════════════════════════════════

// ───────────────────────────────────────────
// GET /api/admin/jabatan/kaprodi?program_studi_id=...&dosen_id=...
// ───────────────────────────────────────────
router.get('/kaprodi', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { program_studi_id, dosen_id } = req.query;

  const data = await prisma.jabatanKaprodi.findMany({
    where: {
      ...(program_studi_id && { program_studi_id: String(program_studi_id) }),
      ...(dosen_id && { dosen_id: String(dosen_id) }),
    },
    include: {
      dosen: { select: { nama: true, nip: true } },
      program_studi: { select: { nama_prodi: true, kode_prodi: true } },
    },
    orderBy: { periode_mulai: 'desc' },
  });

  res.json({ status: 'success', data });
}));

router.post('/kaprodi', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dosen_id, program_studi_id, periode_mulai, periode_selesai } = req.body;

  if (!dosen_id || !program_studi_id || !periode_mulai || !periode_selesai) {
    res.status(400).json({ status: 'error', error: 'Semua field wajib diisi.' });
    return;
  }

  const mulai = new Date(periode_mulai);
  const selesai = new Date(periode_selesai);

  if (mulai >= selesai) {
    res.status(400).json({ status: 'error', error: 'periode_mulai harus sebelum periode_selesai.' });
    return;
  }

  const dosen = await prisma.dosen.findUnique({ where: { id: dosen_id } });
  if (!dosen) {
    res.status(404).json({ status: 'error', error: 'Dosen tidak ditemukan.' });
    return;
  }

  const overlap = await cekOverlapKaprodi(program_studi_id, mulai, selesai);
  if (overlap) {
    res.status(409).json({
      status: 'error',
      error: 'Program studi ini sudah memiliki Kaprodi aktif pada periode tersebut.',
    });
    return;
  }

  const jabatan = await prisma.jabatanKaprodi.create({
    data: { dosen_id, program_studi_id, periode_mulai: mulai, periode_selesai: selesai },
    include: {
      dosen: { select: { nama: true, nip: true } },
      program_studi: { select: { nama_prodi: true } },
    },
  });

  res.status(201).json({ status: 'success', data: jabatan });
}));

// ───────────────────────────────────────────
// PATCH /api/admin/jabatan/kaprodi/:id — update periode
// Body: { dosen_id?, periode_mulai?, periode_selesai? }
// ───────────────────────────────────────────
router.patch('/kaprodi/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;
  const { periode_mulai, periode_selesai, dosen_id } = req.body;

  const existing = await prisma.jabatanKaprodi.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jabatan tidak ditemukan.' });
    return;
  }

  const mulai = periode_mulai ? new Date(periode_mulai) : existing.periode_mulai;
  const selesai = periode_selesai ? new Date(periode_selesai) : existing.periode_selesai;

  if (mulai >= selesai) {
    res.status(400).json({ status: 'error', error: 'periode_mulai harus sebelum periode_selesai.' });
    return;
  }

  const overlap = await cekOverlapKaprodi(existing.program_studi_id, mulai, selesai, id);
  if (overlap) {
    res.status(409).json({
      status: 'error',
      error: 'Program studi ini sudah memiliki Kaprodi aktif pada periode tersebut.',
    });
    return;
  }

  const updated = await prisma.jabatanKaprodi.update({
    where: { id },
    data: {
      ...(dosen_id && { dosen_id }),
      periode_mulai: mulai,
      periode_selesai: selesai,
    },
    include: {
      dosen: { select: { nama: true, nip: true } },
      program_studi: { select: { nama_prodi: true } },
    },
  });

  res.json({ status: 'success', data: updated });
}));

// ───────────────────────────────────────────
// DELETE /api/admin/jabatan/kaprodi/:id
// ───────────────────────────────────────────
router.delete('/kaprodi/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id  = req.params.id as string;

  const existing = await prisma.jabatanKaprodi.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: 'error', error: 'Jabatan tidak ditemukan.' });
    return;
  }

  await prisma.jabatanKaprodi.delete({ where: { id } });
  res.json({ status: 'success', message: 'Jabatan Kaprodi berhasil dihapus.' });
}));

export default router;