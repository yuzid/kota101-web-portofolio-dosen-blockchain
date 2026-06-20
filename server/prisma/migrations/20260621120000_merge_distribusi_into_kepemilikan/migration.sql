-- KepemilikanDokumen now represents both a distribution request and accepted ownership.
ALTER TABLE "kepemilikan_dokumen"
ADD COLUMN "didistribusikan_oleh_id" UUID,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DISETUJUI',
ADD COLUMN "tanggal_distribusi" TIMESTAMP,
ADD COLUMN "tanggal_keputusan" TIMESTAMP;

-- Some older environments created distribusi_dokumen through db push instead of
-- a checked-in migration. Keep this migration valid in both environments.
DO $$
BEGIN
IF to_regclass('public.distribusi_dokumen') IS NOT NULL THEN
-- Preserve accepted distributions that already point at an ownership row.
UPDATE "kepemilikan_dokumen" AS k
SET
  "didistribusikan_oleh_id" = d."didistribusikan_oleh_id",
  "status" = d."status",
  "tanggal_distribusi" = d."tanggal_distribusi",
  "tanggal_keputusan" = d."tanggal_keputusan"
FROM "distribusi_dokumen" AS d
WHERE d."kepemilikan_id" = k."id";

-- Reuse an existing ownership row when an old distribution was not linked to it.
UPDATE "kepemilikan_dokumen" AS k
SET
  "didistribusikan_oleh_id" = d."didistribusikan_oleh_id",
  "status" = d."status",
  "tanggal_distribusi" = d."tanggal_distribusi",
  "tanggal_keputusan" = d."tanggal_keputusan"
FROM "distribusi_dokumen" AS d
WHERE d."kepemilikan_id" IS NULL
  AND d."dosen_id" = k."dosen_id"
  AND d."dokumen_id" = k."dokumen_id";

-- Pending/rejected distributions without ownership become new unified rows.
INSERT INTO "kepemilikan_dokumen" (
  "id", "dosen_id", "dokumen_id", "didistribusikan_oleh_id",
  "status", "tanggal_distribusi", "tanggal_keputusan"
)
SELECT
  d."id", d."dosen_id", d."dokumen_id", d."didistribusikan_oleh_id",
  d."status", d."tanggal_distribusi", d."tanggal_keputusan"
FROM "distribusi_dokumen" AS d
WHERE NOT EXISTS (
  SELECT 1
  FROM "kepemilikan_dokumen" AS k
  WHERE k."dosen_id" = d."dosen_id"
    AND k."dokumen_id" = d."dokumen_id"
);

DROP TABLE "distribusi_dokumen";
END IF;
END $$;

CREATE UNIQUE INDEX "kepemilikan_dokumen_dosen_id_dokumen_id_key"
ON "kepemilikan_dokumen"("dosen_id", "dokumen_id");

ALTER TABLE "kepemilikan_dokumen"
ADD CONSTRAINT "kepemilikan_dokumen_didistribusikan_oleh_id_fkey"
FOREIGN KEY ("didistribusikan_oleh_id") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
