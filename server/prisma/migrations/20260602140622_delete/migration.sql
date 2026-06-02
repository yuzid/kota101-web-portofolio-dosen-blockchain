/*
  Warnings:

  - You are about to drop the column `uploader_dosen_id` on the `dokumen` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "dokumen" DROP CONSTRAINT "dokumen_uploader_dosen_id_fkey";

-- AlterTable
ALTER TABLE "dokumen" DROP COLUMN "uploader_dosen_id";
