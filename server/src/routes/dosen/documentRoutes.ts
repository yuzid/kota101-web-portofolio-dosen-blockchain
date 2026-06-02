import { Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../lib/prisma';
import { asyncHandler, AuthRequest } from '../../middleware/authMiddleware';
import { JenisDokumen } from '@prisma/client';

const router = require('express').Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // Max 20MB sesuai Use Case
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung! Hanya menerima PDF atau DOCX.'));
    }
  }
});

// Helper: Pemetaan string jenis dokumen dari Frontend ke Enum Prisma
const mapJenisToEnum = (jenis: string): JenisDokumen => {
  switch (jenis) {
    case 'SK': return JenisDokumen.SURAT_KEPUTUSAN;
    case 'Surat Tugas': return JenisDokumen.SURAT_TUGAS;
    case 'Laporan Kegiatan': return JenisDokumen.LAPORAN;
    case 'Sertifikat': return JenisDokumen.SERTIFIKAT;
    case 'KONTRAK_PENELITIAN': return JenisDokumen.KONTRAK_PENELITIAN;
    default: return JenisDokumen.BUKTI_PENDUKUNG_LAIN;
  }
};

// ───────────────────────────────────────────
// 1. GET /api/dosen/dokumen — Ambil List Dokumen (Tab Semua, TU, Dosen)
// ───────────────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id; // ID Dosen sama dengan ID User (Relation 1:1)
  const { tab, search, jenis } = req.query;

  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  // Filter Dasar: Dokumen harus terikat dengan Dosen lewat tabel jembatan dan belum di-soft delete
  let whereClause: any = {
    deleted_at: null,
    kepemilikan: {
      some: { dosen_id: dosenId }
    }
  };

  // Filter berdasarkan Tab Asal Dokumen
  if (tab === 'tu') {
    whereClause.sumber_dokumen = 'TATA_USAHA';
  } else if (tab === 'dosen') {
    whereClause.sumber_dokumen = 'UPLOAD_PRIBADI';
  }

  // Filter berdasarkan Input Pencarian Nama
  if (search) {
    whereClause.nama = {
      contains: String(search),
      mode: 'insensitive'
    };
  }

  // Filter berdasarkan jenis dokumen (Enum)
  if (jenis && jenis !== 'all') {
    whereClause.jenis_dokumen = mapJenisToEnum(String(jenis));
  }

  const documents = await prisma.dokumen.findMany({
    where: whereClause,
    select: {
      id: true,
      nama: true,
      jenis_dokumen: true,
      tanggal_upload: true,
      sumber_dokumen: true,
      file_path: true,
      lampiran_bukti: {
        select: {
          highlight: { select: { id: true } }
        }
      }
    },
    orderBy: { tanggal_upload: 'desc' }
  });

  // Transformasi data agar sesuai dengan struktur interface objek Frontend
  const formattedDocs = documents.map(doc => ({
    id: doc.id,
    name: doc.nama,
    jenis: doc.jenis_dokumen,
    tanggal: doc.tanggal_upload,
    asal: doc.sumber_dokumen === 'TATA_USAHA' ? 'tu' : 'dosen',
    size: 'Undetermined', // S3 tidak menyimpan size secara eksplisit di DB (bisa dikembangkan jika diperlukan)
    hasHighlight: doc.lampiran_bukti.some(l => l.highlight.length > 0)
  }));

  res.status(200).json({ status: 'success', data: formattedDocs });
}));

// ───────────────────────────────────────────
// 2. POST /api/dosen/dokumen/upload — Unggah Dokumen Pribadi ke S3
// ───────────────────────────────────────────
router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  const { nama, jenis_dokumen, tanggal_dokumen } = req.body;
  const file = req.file;

  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  if (!file || !nama || !jenis_dokumen || !tanggal_dokumen) {
    res.status(400).json({ status: 'error', error: 'Semua komponen data formulir wajib diisi.' });
    return;
  }

  // Kriptografi SHA-256 Integritas Data (Sesuai Spesifikasi)
  const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
  
  const s3Key = `dosen_uploads/${dosenId}/${Date.now()}_${file.originalname}`;
  const bucketName = process.env.AWS_S3_BUCKET || 'dosen-portfolio-bucket';

  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Gagal mengirim berkas ke S3 Cloud Storage.' });
    return;
  }

  const filePath = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${s3Key}`;

  // Transaksi database: Simpan ke tabel dokumen & kaitkan ke diri sendiri di kepemilikan_dokumen
  const newDocument = await prisma.$transaction(async (tx) => {
    const doc = await tx.dokumen.create({
      data: {
        nama,
        jenis_dokumen: mapJenisToEnum(jenis_dokumen),
        file_path: filePath,
        hash_file: hashFile,
        sumber_dokumen: 'UPLOAD_PRIBADI',
        tanggal_upload: new Date(tanggal_dokumen),
        uploader_dosen_id: dosenId, // Uploader adalah dosen itu sendiri
      }
    });

    await tx.kepemilikanDokumen.create({
      data: {
        dosen_id: dosenId,
        dokumen_id: doc.id
      }
    });

    return doc;
  });

  res.status(201).json({
    status: 'success',
    message: 'Dokumen mandiri berhasil disimpan.',
    data: { id: newDocument.id }
  });
}));

// ───────────────────────────────────────────
// 3. DELETE /api/dosen/dokumen/:id — Soft Delete Dokumen Pribadi Dosen
// ───────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const dosenId = req.user?.id;
  const id = req.params.id as string;

  if (!dosenId) {
    res.status(401).json({ status: 'error', error: 'Sesi tidak valid.' });
    return;
  }

  const targetDoc = await prisma.dokumen.findUnique({ where: { id } });

  if (!targetDoc) {
    res.status(404).json({ status: 'error', error: 'Dokumen tidak ditemukan.' });
    return;
  }

  // Proteksi Keamanan: Dosen dilarang keras menghapus dokumen resmi yang diterbitkan oleh Tata Usaha
  if (targetDoc.sumber_dokumen === 'TATA_USAHA') {
    res.status(403).json({ 
      status: 'error', 
      error: 'Akses ditolak. Anda tidak diperbolehkan menghapus dokumen resmi dari Tata Usaha.' 
    });
    return;
  }

  // Proteksi Keamanan: Pastikan berkas tersebut memang diunggah oleh dosen yang sedang login
  if (targetDoc.uploader_dosen_id !== dosenId) {
    res.status(403).json({ status: 'error', error: 'Akses ilegal. Anda bukan pemilik dokumen ini.' });
    return;
  }

  // Eksekusi Soft Delete
  await prisma.dokumen.update({
    where: { id },
    data: { deleted_at: new Date() } as any
  });

  res.status(200).json({ status: 'success', message: 'Dokumen pribadi berhasil dihapus dari portofolio.' });
}));

export default router;