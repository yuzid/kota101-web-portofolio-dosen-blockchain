import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler, AuthRequest } from '../../middleware/authMiddleware';
import { KategoriTridharma, JenisKegiatan, PeranTridharma, Prisma } from '@prisma/client';
import crypto from 'crypto';

const router = require('express').Router();

// Helper: UUID Validation
const isValidUUID = (uuid: any): uuid is string => {
  if (typeof uuid !== 'string') return false;
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(uuid);
};

// Helper: Mapping frontend category to Backend Enums
const mapKategoriTridharma = (jenis: string): KategoriTridharma => {
  switch (jenis?.toLowerCase()) {
    case 'pengajaran': return KategoriTridharma.PENDIDIKAN;
    case 'penelitian': return KategoriTridharma.PENELITIAN;
    case 'pengabdian': return KategoriTridharma.PENGABDIAN;
    case 'tugas_tambahan': return KategoriTridharma.TUGAS_TAMBAHAN;
    default: return KategoriTridharma.PENDIDIKAN;
  }
};

const mapJenisKegiatan = (kategori: string): JenisKegiatan => {
  const k = kategori?.toLowerCase() || "";
  if (k.includes('ajar') || k.includes('mengajar')) return JenisKegiatan.PENGAJARAN;
  if (k.includes('bimbingan') || k.includes('pembimbing')) return JenisKegiatan.BIMBINGAN_MAHASISWA;
  if (k.includes('kurikulum') || k.includes('bahan ajar')) return JenisKegiatan.BAHAN_AJAR;
  if (k.includes('penelitian')) return JenisKegiatan.PENELITIAN;
  if (k.includes('publikasi') || k.includes('jurnal') || k.includes('prosiding')) return JenisKegiatan.PUBLIKASI_KARYA;
  if (k.includes('paten')) return JenisKegiatan.PATEN;
  if (k.includes('pengabdian') || k.includes('pelatihan') || k.includes('konsultasi')) return JenisKegiatan.PENGABDIAN;
  if (k.includes('pembicara')) return JenisKegiatan.PEMBICARA;
  if (k.includes('jurnal') && k.includes('pengelola')) return JenisKegiatan.PENGELOLA_JURNAL;
  if (k.includes('tugas tambahan') || k.includes('koordinator') || k.includes('sekretaris')) return JenisKegiatan.TUGAS_TAMBAHAN;
  return JenisKegiatan.TUGAS_TAMBAHAN;
};

// ───────────────────────────────────────────
// 1. GET /api/dosen/kegiatan — Ambil List Kegiatan Dosen
// ───────────────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  const activities = await prisma.kegiatanTridharma.findMany({
    where: {
      OR: [
        { dosen_id: dosenId }, // Sebagai pencatat
        { partisipasi: { some: { dosen_id: dosenId } } } // Sebagai anggota
      ]
    },
    include: {
      lampiran_bukti: true,
      partisipasi: true
    },
    orderBy: { tanggal_mulai: 'desc' }
  });

  const formattedActivities = activities.map(act => ({
    id: act.id,
    name: act.nama_kegiatan,
    jenisTridharma: act.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pengajaran' : act.kategori_tridharma.toLowerCase(),
    kategori: act.jenis_kegiatan,
    periode: act.periode,
    semester: act.semester.toLowerCase(),
    role: act.dosen_id === dosenId ? 'pencatat' : 'anggota',
    buktiCount: act.lampiran_bukti.length,
    updatedAt: act.tanggal_mulai.toISOString(),
  }));

  res.status(200).json({ status: 'success', data: formattedActivities });
}));

// ───────────────────────────────────────────
// 2. GET /api/dosen/kegiatan/stats/summary — Statistik Dashboard Dosen
// ───────────────────────────────────────────
router.get('/stats/summary', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  const activities = await prisma.kegiatanTridharma.findMany({
    where: {
      OR: [
        { dosen_id: dosenId },
        { partisipasi: { some: { dosen_id: dosenId } } }
      ]
    },
    include: { lampiran_bukti: true }
  });

  const stats = {
    total: activities.length,
    pengajaran: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENDIDIKAN).length,
    penelitian: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENELITIAN).length,
    pengabdian: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENGABDIAN).length,
    tugas_tambahan: activities.filter(a => a.kategori_tridharma === KategoriTridharma.TUGAS_TAMBAHAN).length,
    tanpa_bukti: activities.filter(a => a.lampiran_bukti.length === 0).length,
    total_dokumen: await prisma.kepemilikanDokumen.count({ where: { dosen_id: dosenId } })
  };

  res.status(200).json({ status: 'success', data: stats });
}));

// ───────────────────────────────────────────
// 3. GET /api/dosen/kegiatan/filter/tanpa-bukti — List Kegiatan Tanpa Bukti
// ───────────────────────────────────────────
router.get('/filter/tanpa-bukti', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  const activities = await prisma.kegiatanTridharma.findMany({
    where: {
      dosen_id: dosenId,
      lampiran_bukti: { none: {} }
    },
    orderBy: { tanggal_mulai: 'desc' },
    take: 5
  });

  const formatted = activities.map(a => ({
    id: a.id,
    name: a.nama_kegiatan,
    type: a.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'Pengajaran' : a.kategori_tridharma,
    date: a.tanggal_mulai.toISOString()
  }));

  res.status(200).json({ status: 'success', data: formatted });
}));

// ───────────────────────────────────────────
// 4. GET /api/dosen/kegiatan/:id — Detail Kegiatan
// ───────────────────────────────────────────
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  if (!isValidUUID(id)) {
    res.status(400).json({ status: 'error', error: 'Format ID tidak valid.' });
    return;
  }

  const activity = await prisma.kegiatanTridharma.findUnique({
    where: { id: id },
    include: {
      dosen: { 
        include: { program_studi: true } 
      },
      partisipasi: {
        include: {
          dosen: true
        }
      },
      lampiran_bukti: {
        include: {
          dokumen: {
            include: {
              kepemilikan: true
            }
          }
        }
      }
    }
  });

  if (!activity) {
    res.status(404).json({ status: 'error', error: 'Kegiatan tidak ditemukan.' });
    return;
  }

  // Group lampiran by dosen
  const dosenTerlibatMap = new Map<string, any>();
  
  // Add pencatat
  dosenTerlibatMap.set(activity.dosen_id, {
    id: activity.dosen_id,
    name: activity.dosen.nama,
    nidn: activity.dosen.nip, 
    isPencatat: true,
    isKetua: true,
    dokumen: []
  });

  // Add members
  activity.partisipasi.forEach((p: any) => {
    if (!dosenTerlibatMap.has(p.dosen_id)) {
      dosenTerlibatMap.set(p.dosen_id, {
        id: p.dosen_id,
        name: p.dosen.nama,
        nidn: p.dosen.nidn || p.dosen.nip,
        isPencatat: false,
        isKetua: p.peran === PeranTridharma.KETUA,
        dokumen: []
      });
    }
  });

  // Attach documents to their owners within this activity
  activity.lampiran_bukti.forEach((lb: any) => {
    const docData = {
      id: lb.dokumen.id,
      name: lb.dokumen.nama,
      jenis: lb.dokumen.jenis_dokumen,
      tanggalUpload: lb.dokumen.tanggal_upload.toISOString(),
      hasHighlight: lb.highlighted
    };

    lb.dokumen.kepemilikan.forEach((k: any) => {
      const ownerInActivity = dosenTerlibatMap.get(k.dosen_id);
      if (ownerInActivity) {
        ownerInActivity.dokumen.push(docData);
      }
    });
  });

  const formattedDetail = {
    id: activity.id,
    namaKegiatan: activity.nama_kegiatan,
    jenisTridharma: activity.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pengajaran' : activity.kategori_tridharma.toLowerCase(),
    kategori: activity.jenis_kegiatan,
    tanggalMulai: activity.tanggal_mulai.toISOString(),
    tanggalSelesai: activity.tanggal_selesai.toISOString(),
    tahunAkademik: activity.periode,
    semester: activity.semester.toLowerCase(),
    programStudi: activity.dosen.program_studi?.nama_prodi || "Umum",
    dosenTerlibat: Array.from(dosenTerlibatMap.values()),
    statusKelengkapan: activity.lampiran_bukti.length > 0 ? 'lengkap' : 'tidak_lengkap'
  };

  res.status(200).json({ status: 'success', data: formattedDetail });
}));

// ───────────────────────────────────────────
// 5. POST /api/dosen/kegiatan — Simpan Kegiatan Baru
// ───────────────────────────────────────────
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  const body = req.body;

  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  const { 
    namaKegiatan, 
    jenisTridharma, 
    kategori, 
    tanggalMulai, 
    tanggalSelesai, 
    tahunAkademik, 
    semester,
    anggota_ids, 
    lampiran_ids 
  } = body;

  const newActivity = await prisma.$transaction(async (tx) => {
    // 1. Create Kegiatan
    const activity = await tx.kegiatanTridharma.create({
      data: {
        dosen_id: dosenId,
        nama_kegiatan: String(namaKegiatan),
        kategori_tridharma: mapKategoriTridharma(String(jenisTridharma)),
        jenis_kegiatan: mapJenisKegiatan(String(kategori)),
        tanggal_mulai: new Date(String(tanggalMulai)),
        tanggal_selesai: new Date(String(tanggalSelesai)),
        periode: String(tahunAkademik),
        semester: String(semester).toUpperCase(),
        tx_id: crypto.randomBytes(16).toString('hex'),
      }
    });

    // 2. Add Partisipasi (Anggota)
    const partisipasiData: any[] = [];
    
    if (anggota_ids && Array.isArray(anggota_ids)) {
      anggota_ids.forEach((id: string) => {
        partisipasiData.push({
          dosen_id: id,
          kegiatan_tridharma_id: activity.id,
          peran: PeranTridharma.ANGGOTA
        });
      });
    }

    // Always add the recorder as KETUA if not already in the list
    if (!partisipasiData.some(p => p.dosen_id === dosenId)) {
      partisipasiData.push({
        dosen_id: dosenId,
        kegiatan_tridharma_id: activity.id,
        peran: PeranTridharma.KETUA
      });
    }

    await tx.partisipasiKegiatanTridharma.createMany({
      data: partisipasiData
    });

    // 3. Add Lampiran
    if (lampiran_ids && Array.isArray(lampiran_ids)) {
      const lampiranData = lampiran_ids.map((docId: string) => ({
        kegiatan_id: activity.id,
        dokumen_id: docId,
        highlighted: false
      }));
      await tx.lampiranBukti.createMany({
        data: lampiranData
      });
    }

    return activity;
  });

  res.status(201).json({ status: 'success', data: newActivity });
}));

// ───────────────────────────────────────────
// 6. PUT /api/dosen/kegiatan/:id — Update Kegiatan
// ───────────────────────────────────────────
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  if (!isValidUUID(id)) {
    res.status(400).json({ status: 'error', error: 'Format ID tidak valid.' });
    return;
  }

  const { 
    namaKegiatan, 
    jenisTridharma, 
    kategori, 
    tanggalMulai, 
    tanggalSelesai, 
    tahunAkademik, 
    semester 
  } = req.body;

  const activity = await prisma.kegiatanTridharma.findUnique({ where: { id: id } });
  if (!activity) {
    res.status(404).json({ status: 'error', error: 'Kegiatan tidak ditemukan.' });
    return;
  }

  if (activity.dosen_id !== req.user?.id) {
    res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan pencatat kegiatan ini.' });
    return;
  }

  const updatedActivity = await prisma.kegiatanTridharma.update({
    where: { id: id },
    data: {
      nama_kegiatan: namaKegiatan ? String(namaKegiatan) : undefined,
      kategori_tridharma: jenisTridharma ? mapKategoriTridharma(String(jenisTridharma)) : undefined,
      jenis_kegiatan: kategori ? mapJenisKegiatan(String(kategori)) : undefined,
      tanggal_mulai: tanggalMulai ? new Date(String(tanggalMulai)) : undefined,
      tanggal_selesai: tanggalSelesai ? new Date(String(tanggalSelesai)) : undefined,
      periode: tahunAkademik ? String(tahunAkademik) : undefined,
      semester: semester ? String(semester).toUpperCase() : undefined,
    }
  });

  res.status(200).json({ status: 'success', data: updatedActivity });
}));

// ───────────────────────────────────────────
// 7. DELETE /api/dosen/kegiatan/:id — Hapus Kegiatan
// ───────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  if (!isValidUUID(id)) {
    res.status(400).json({ status: 'error', error: 'Format ID tidak valid.' });
    return;
  }

  const activity = await prisma.kegiatanTridharma.findUnique({ where: { id: id } });

  if (!activity) {
    res.status(404).json({ status: 'error', error: 'Kegiatan tidak ditemukan.' });
    return;
  }

  if (activity.dosen_id !== req.user?.id) {
    res.status(403).json({ status: 'error', error: 'Akses ditolak. Anda bukan pencatat kegiatan ini.' });
    return;
  }

  // Transaction to clean up linked records
  await prisma.$transaction([
    prisma.partisipasiKegiatanTridharma.deleteMany({ where: { kegiatan_tridharma_id: id } }),
    prisma.lampiranBukti.deleteMany({ where: { kegiatan_id: id } }),
    prisma.kegiatanTridharma.delete({ where: { id: id } })
  ]);

  res.status(200).json({ status: 'success', message: 'Kegiatan berhasil dihapus.' });
}));

// ───────────────────────────────────────────
// 8. POST /api/dosen/kegiatan/:id/lampiran — Tambah Lampiran Bukti
// ───────────────────────────────────────────
router.post('/:id/lampiran', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  if (!isValidUUID(id)) {
    res.status(400).json({ status: 'error', error: 'Format ID tidak valid.' });
    return;
  }

  const { dokumen_id } = req.body;

  if (!isValidUUID(dokumen_id)) {
    res.status(400).json({ status: 'error', error: 'Format ID Dokumen tidak valid.' });
    return;
  }

  const activity = await prisma.kegiatanTridharma.findUnique({ where: { id: id } });
  if (!activity) {
    res.status(404).json({ status: 'error', error: 'Kegiatan tidak ditemukan.' });
    return;
  }

  const lampiran = await prisma.lampiranBukti.create({
    data: {
      kegiatan_id: id,
      dokumen_id: String(dokumen_id),
      highlighted: false
    }
  });

  res.status(201).json({ status: 'success', data: lampiran });
}));

export default router;
