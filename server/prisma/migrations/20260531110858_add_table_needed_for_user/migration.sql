-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tata_usaha" (
    "id" UUID NOT NULL,
    "nip" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,

    CONSTRAINT "tata_usaha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen" (
    "id" UUID NOT NULL,
    "nip" VARCHAR(50) NOT NULL,
    "nidn" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "program_studi_id" UUID NOT NULL,

    CONSTRAINT "dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_studi" (
    "id" UUID NOT NULL,
    "kode_prodi" VARCHAR(50) NOT NULL,
    "nama_prodi" VARCHAR(255) NOT NULL,
    "jurusan_id" UUID NOT NULL,

    CONSTRAINT "program_studi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurusan" (
    "id" UUID NOT NULL,
    "kode_jurusan" VARCHAR(50) NOT NULL,
    "nama_jurusan" VARCHAR(255) NOT NULL,

    CONSTRAINT "jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tata_usaha_nip_key" ON "tata_usaha"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nip_key" ON "dosen"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nidn_key" ON "dosen"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "program_studi_kode_prodi_key" ON "program_studi"("kode_prodi");

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_kode_jurusan_key" ON "jurusan"("kode_jurusan");

-- AddForeignKey
ALTER TABLE "tata_usaha" ADD CONSTRAINT "tata_usaha_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_program_studi_id_fkey" FOREIGN KEY ("program_studi_id") REFERENCES "program_studi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_studi" ADD CONSTRAINT "program_studi_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
