/*
  Warnings:

  - You are about to drop the column `lampiran_id` on the `highlight` table. All the data in the column will be lost.
  - You are about to drop the column `highlighted` on the `lampiran_bukti` table. All the data in the column will be lost.
  - Added the required column `kepemilikan_id` to the `highlight` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "highlight" DROP CONSTRAINT "highlight_lampiran_id_fkey";

-- AlterTable
ALTER TABLE "highlight" DROP COLUMN "lampiran_id",
ADD COLUMN     "kepemilikan_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "lampiran_bukti" DROP COLUMN "highlighted";

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_kepemilikan_id_fkey" FOREIGN KEY ("kepemilikan_id") REFERENCES "kepemilikan_dokumen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
