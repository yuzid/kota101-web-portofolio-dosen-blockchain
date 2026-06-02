/*
  Warnings:

  - Added the required column `chain_address` to the `dosen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dosen" ADD COLUMN     "chain_address" TEXT NOT NULL;
