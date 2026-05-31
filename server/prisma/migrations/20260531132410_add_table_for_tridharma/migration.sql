-- CreateEnum
CREATE TYPE "JenisDokumen" AS ENUM ('SURAT_KEPUTUSAN', 'SURAT_TUGAS', 'LEMBAR_PENGESAHAN', 'KONTRAK_PENELITIAN', 'SERTIFIKAT', 'FOTO', 'LAPORAN', 'BUKTI_PENDUKUNG_LAIN');

-- CreateEnum
CREATE TYPE "SumberDokumen" AS ENUM ('TATA_USAHA', 'UPLOAD_PRIBADI');

-- CreateEnum
CREATE TYPE "PeranTridharma" AS ENUM ('KETUA', 'ANGGOTA');

-- CreateEnum
CREATE TYPE "KategoriTridharma" AS ENUM ('PENDIDIKAN', 'PENELITIAN', 'PENGABDIAN', 'TUGAS_TAMBAHAN');

-- CreateEnum
CREATE TYPE "JenisKegiatan" AS ENUM ('PENGAJARAN', 'BAHAN_AJAR', 'BIMBINGAN_MAHASISWA', 'PEMBINAAN_MAHASISWA', 'PENGUJIAN_MAHASISWA', 'PENELITIAN', 'PUBLIKASI_KARYA', 'PATEN', 'PENGABDIAN', 'PEMBICARA', 'PENGELOLA_JURNAL', 'TUGAS_TAMBAHAN');

-- CreateTable
CREATE TABLE "jabatan_kajur" (
    "id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "jurusan_id" UUID NOT NULL,
    "periode_mulai" DATE NOT NULL,
    "periode_selesai" DATE NOT NULL,

    CONSTRAINT "jabatan_kajur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jabatan_kaprodi" (
    "id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "program_studi_id" UUID NOT NULL,
    "periode_mulai" DATE NOT NULL,
    "periode_selesai" DATE NOT NULL,

    CONSTRAINT "jabatan_kaprodi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kepemilikan_dokumen" (
    "id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "dokumen_id" UUID NOT NULL,

    CONSTRAINT "kepemilikan_dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen" (
    "id" UUID NOT NULL,
    "uploader_dosen_id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "jenis_dokumen" "JenisDokumen" NOT NULL,
    "file_path" VARCHAR(512) NOT NULL,
    "hash_file" VARCHAR(255) NOT NULL,
    "sumber_dokumen" "SumberDokumen" NOT NULL,
    "tanggal_upload" DATE NOT NULL,

    CONSTRAINT "dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partisipasi_kegiatan_tridharma" (
    "id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "kegiatan_tridharma_id" UUID NOT NULL,
    "peran" "PeranTridharma" NOT NULL,

    CONSTRAINT "partisipasi_kegiatan_tridharma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kegiatan_tridharma" (
    "id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "kategori_tridharma" "KategoriTridharma" NOT NULL,
    "jenis_kegiatan" "JenisKegiatan" NOT NULL,
    "nama_kegiatan" VARCHAR(255) NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE NOT NULL,
    "periode" VARCHAR(50) NOT NULL,
    "semester" VARCHAR(20) NOT NULL,
    "tx_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "kegiatan_tridharma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" UUID NOT NULL,
    "kegiatan_id" UUID NOT NULL,
    "tx_id" VARCHAR(255) NOT NULL,
    "urutan" INTEGER NOT NULL,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lampiran_bukti" (
    "id" UUID NOT NULL,
    "kegiatan_id" UUID NOT NULL,
    "dokumen_id" UUID NOT NULL,
    "highlighted" BOOLEAN NOT NULL,

    CONSTRAINT "lampiran_bukti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlight" (
    "id" UUID NOT NULL,
    "lampiran_id" UUID NOT NULL,
    "page_number" INTEGER NOT NULL,
    "highlighted_text" TEXT NOT NULL,

    CONSTRAINT "highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlight_rect" (
    "id" UUID NOT NULL,
    "highlight_id" UUID NOT NULL,
    "x1" DOUBLE PRECISION NOT NULL,
    "x2" DOUBLE PRECISION NOT NULL,
    "y1" DOUBLE PRECISION NOT NULL,
    "y2" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "boundary_rect" BOOLEAN NOT NULL,

    CONSTRAINT "highlight_rect_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jabatan_kajur" ADD CONSTRAINT "jabatan_kajur_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jabatan_kajur" ADD CONSTRAINT "jabatan_kajur_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jabatan_kaprodi" ADD CONSTRAINT "jabatan_kaprodi_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jabatan_kaprodi" ADD CONSTRAINT "jabatan_kaprodi_program_studi_id_fkey" FOREIGN KEY ("program_studi_id") REFERENCES "program_studi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepemilikan_dokumen" ADD CONSTRAINT "kepemilikan_dokumen_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepemilikan_dokumen" ADD CONSTRAINT "kepemilikan_dokumen_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "dokumen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_uploader_dosen_id_fkey" FOREIGN KEY ("uploader_dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partisipasi_kegiatan_tridharma" ADD CONSTRAINT "partisipasi_kegiatan_tridharma_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partisipasi_kegiatan_tridharma" ADD CONSTRAINT "partisipasi_kegiatan_tridharma_kegiatan_tridharma_id_fkey" FOREIGN KEY ("kegiatan_tridharma_id") REFERENCES "kegiatan_tridharma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kegiatan_tridharma" ADD CONSTRAINT "kegiatan_tridharma_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_kegiatan_id_fkey" FOREIGN KEY ("kegiatan_id") REFERENCES "kegiatan_tridharma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lampiran_bukti" ADD CONSTRAINT "lampiran_bukti_kegiatan_id_fkey" FOREIGN KEY ("kegiatan_id") REFERENCES "kegiatan_tridharma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lampiran_bukti" ADD CONSTRAINT "lampiran_bukti_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "dokumen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_lampiran_id_fkey" FOREIGN KEY ("lampiran_id") REFERENCES "lampiran_bukti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight_rect" ADD CONSTRAINT "highlight_rect_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
