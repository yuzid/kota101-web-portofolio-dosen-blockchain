import { Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../lib/prisma'; 
import { asyncHandler, AuthRequest } from '../../middleware/authMiddleware'; 

const router = require('express').Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya menerima PDF dan DOCX.'));
    }
  }
});

// routes/tatausaha/documentRoutes.ts

// ───────────────────────────────────────────
// GET /api/tatausaha/dokumen — Mengambil semua dokumen yang belum di-soft delete
// ───────────────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;

  if (!currentUser) {
    res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
    return;
  }

  let whereClause: any = {
    deleted_at: null, // Spesifikasi Use Case: Hanya ambil dokumen yang belum di-soft delete
    sumber_dokumen: 'TATA_USAHA' // Filter: Hanya ambil dokumen yang bersumber dari TATA_USAHA
  };

  // Jika diakses oleh Tata Usaha, batasi hanya melihat dokumen yang diterbitkan di Jurusannya
  if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
    if (!currentUser.jurusan_id) {
      res.status(403).json({ status: 'error', error: 'Akses ditolak. Yurisdiksi jurusan tidak valid.' });
      return;
    }

    whereClause.kepemilikan = {
      some: {
        dosen: {
          program_studi: {
            jurusan_id: currentUser.jurusan_id
          }
        }
      }
    };
  }

  const listDokumen = await prisma.dokumen.findMany({
    where: whereClause,
    select: {
      id: true,
      nama: true,
      jenis_dokumen: true,
      tanggal_upload: true,
      file_path: true,
      // Include data penerima jika sewaktu-waktu frontend detail membutuhkannya
      kepemilikan: {
        select: {
          dosen: {
            select: {
              nama: true,
              nip: true
            }
          }
        }
      }
    },
    orderBy: {
      tanggal_upload: 'desc' // Dokumen terbaru muncul paling atas di tabel
    }
  });

  res.status(200).json({
    status: 'success',
    data: listDokumen
  });
}));


// ───────────────────────────────────────────
// POST /api/tatausaha/dokumen/upload — upload dokumen baru
// Body: { nama, jenis_dokumen, tanggal_upload, dosen_penerima_ids (array of string) }
// Form-data: file (PDF/DOCX)
// ───────────────────────────────────────────
router.post('/upload', 
  upload.single('file'), 
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { nama, jenis_dokumen, tanggal_upload, dosen_penerima_ids } = req.body;
    const file = req.file;

    if (!file || !nama || !jenis_dokumen || !tanggal_upload || !dosen_penerima_ids || !req.user) {
      res.status(400).json({ status: 'error', error: 'Data formulir dan file wajib diisi.' });
      return;
    }

    const targetDosenIds: string[] = JSON.parse(dosen_penerima_ids);
    if (targetDosenIds.length === 0) {
      res.status(400).json({ status: 'error', error: 'Minimal pilih satu dosen penerima.' });
      return;
    }

    const hashFile = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const s3Key = `documents/${Date.now()}_${file.originalname}`;
    const bucketName = process.env.AWS_S3_BUCKET || 'dosen-portfolio-bucket';

    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } catch (s3Error) {
      console.error('[S3 Upload Error]', s3Error);
      res.status(500).json({ status: 'error', error: 'Gagal mengunggah file ke penyimpanan S3.' });
      return;
    }

    const filePath = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${s3Key}`;

    const dokumen = await prisma.$transaction(async (tx) => {
      const doc = await tx.dokumen.create({
        data: {
          nama,
          jenis_dokumen,
          file_path: filePath,
          hash_file: hashFile,
          sumber_dokumen: 'TATA_USAHA',
          tanggal_upload: new Date(tanggal_upload),
          uploader_dosen_id: targetDosenIds[0],
        }
      });

      const kepemilikanData = targetDosenIds.map(dosenId => ({
        dosen_id: dosenId,
        dokumen_id: doc.id
      }));

      await tx.kepemilikanDokumen.createMany({ data: kepemilikanData });
      return doc;
    });

    res.status(201).json({
      status: 'success',
      message: 'Dokumen berhasil diunggah ke S3 dan disimpan di database.',
      data: { id: dokumen.id, file_path: filePath, hash_file: hashFile }
    });
  })
);

// ───────────────────────────────────────────
// PUT /api/tatausaha/dokumen/:id/metadata — update metadata dokumen
// Body: { nama, jenis_dokumen, tanggal_upload }
// ───────────────────────────────────────────
router.put('/:id/metadata', 
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { nama, jenis_dokumen, tanggal_upload } = req.body;

    const existingDoc = await prisma.dokumen.findUnique({ where: { id } });
    if (!existingDoc) {
      res.status(404).json({ status: 'error', error: 'Dokumen tidak ditemukan.' });
      return;
    }

    await prisma.dokumen.update({
      where: { id },
      data: {
        nama,
        jenis_dokumen,
        tanggal_upload: new Date(tanggal_upload)
      }
    });

    res.status(200).json({ status: 'success', message: 'Metadata dokumen berhasil diperbarui di database.' });
  })
);

// ───────────────────────────────────────────
// DELETE /api/tatausaha/dokumen/:id — soft delete dokumen
// ───────────────────────────────────────────
router.delete('/:id', 
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const existingDoc = await prisma.dokumen.findUnique({ where: { id } });
    if (!existingDoc) {
      res.status(404).json({ status: 'error', error: 'Dokumen tidak ditemukan.' });
      return;
    }

    await prisma.dokumen.update({
      where: { id },
      data: { deleted_at: new Date() } as any
    });

    res.status(200).json({ status: 'success', message: 'Dokumen berhasil disembunyikan (Soft Delete).' });
  })
);

export default router;