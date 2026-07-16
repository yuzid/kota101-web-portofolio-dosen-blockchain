/*
  Warnings:

  - You are about to drop the `jenis_dokumen` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "lampiran_bukti" ADD COLUMN     "dosen_id" UUID;

-- DropTable
DROP TABLE "jenis_dokumen";

-- AddForeignKey
ALTER TABLE "lampiran_bukti" ADD CONSTRAINT "lampiran_bukti_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
