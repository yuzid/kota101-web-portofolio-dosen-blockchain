/*
  Warnings:

  - You are about to drop the `jenis_dokumen` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JenisDokumen" AS ENUM ('SURAT_KEPUTUSAN', 'SURAT_TUGAS', 'LEMBAR_PENGESAHAN', 'KONTRAK_PENELITIAN', 'SERTIFIKAT', 'FOTO', 'LAPORAN', 'BUKTI_PENDUKUNG_LAIN');

-- DropTable
DROP TABLE "jenis_dokumen";
