/*
  Warnings:

  - Changed the type of `jenis_dokumen` on the `dokumen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "dokumen" DROP COLUMN "jenis_dokumen",
ADD COLUMN     "jenis_dokumen" VARCHAR(100) NOT NULL;

-- DropEnum
DROP TYPE "JenisDokumen";

-- CreateTable
CREATE TABLE "jenis_dokumen" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jenis_dokumen_nama_key" ON "jenis_dokumen"("nama");
