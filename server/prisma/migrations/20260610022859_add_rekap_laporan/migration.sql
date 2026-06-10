-- CreateTable
CREATE TABLE "rekap_laporan" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "tanggal_perekapan" DATE NOT NULL,
    "dibuat_oleh_id" UUID NOT NULL,
    "prodi_id" UUID,
    "jurusan_id" UUID,
    "filter" JSONB NOT NULL,
    "kegiatan_data" JSONB NOT NULL,
    "riwayat" JSONB NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "rekap_laporan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rekap_laporan" ADD CONSTRAINT "rekap_laporan_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rekap_laporan" ADD CONSTRAINT "rekap_laporan_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "program_studi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rekap_laporan" ADD CONSTRAINT "rekap_laporan_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
