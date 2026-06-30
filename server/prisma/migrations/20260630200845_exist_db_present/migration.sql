-- AlterTable
ALTER TABLE "kegiatan_tridharma" ADD COLUMN     "jenis_bukti" TEXT NOT NULL DEFAULT 'MASING_MASING';

-- AlterTable
ALTER TABLE "partisipasi_kegiatan_tridharma" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'MENUNGGU_KONFIRMASI';
