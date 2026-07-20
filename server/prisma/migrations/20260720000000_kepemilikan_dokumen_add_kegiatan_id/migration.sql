-- Migration: Tambah kegiatan_id ke kepemilikan_dokumen
-- Relasi lampiran bukti sekarang menggunakan KepemilikanDokumen.kegiatan_id
-- CATATAN: Tabel lampiran_bukti TIDAK dihapus (tetap ada sebagai backup data)

-- 1. Tambah kolom kegiatan_id (nullable) ke kepemilikan_dokumen
ALTER TABLE "kepemilikan_dokumen" ADD COLUMN "kegiatan_id" UUID;

-- 2. Tambah foreign key constraint dengan ON DELETE SET NULL
ALTER TABLE "kepemilikan_dokumen"
  ADD CONSTRAINT "kepemilikan_dokumen_kegiatan_id_fkey"
  FOREIGN KEY ("kegiatan_id")
  REFERENCES "kegiatan_tridharma"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 3. Migrasi data dari lampiran_bukti ke kepemilikan_dokumen.kegiatan_id
--    Untuk lampiran dengan dosen_id (MASING_MASING): match by (dosen_id, dokumen_id)
UPDATE "kepemilikan_dokumen" kd
SET "kegiatan_id" = lb."kegiatan_id"
FROM "lampiran_bukti" lb
WHERE kd."dokumen_id" = lb."dokumen_id"
  AND kd."dosen_id" = lb."dosen_id"
  AND lb."dosen_id" IS NOT NULL
  AND kd."kegiatan_id" IS NULL;

--    Untuk lampiran tanpa dosen_id (data lama/BERSAMA): match semua kepemilikan untuk dokumen tsb
UPDATE "kepemilikan_dokumen" kd
SET "kegiatan_id" = lb."kegiatan_id"
FROM "lampiran_bukti" lb
WHERE kd."dokumen_id" = lb."dokumen_id"
  AND lb."dosen_id" IS NULL
  AND kd."kegiatan_id" IS NULL;
