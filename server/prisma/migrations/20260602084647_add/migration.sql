/*
  Warnings:

  - Added the required column `jurusan_id` to the `tata_usaha` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tata_usaha" ADD COLUMN     "jurusan_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "tata_usaha" ADD CONSTRAINT "tata_usaha_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
