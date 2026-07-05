-- DropEnum
DROP TYPE "JenisDokumen";

-- CreateTable
CREATE TABLE "jenis_dokumen" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jenis_dokumen_nama_key" ON "jenis_dokumen"("nama");
