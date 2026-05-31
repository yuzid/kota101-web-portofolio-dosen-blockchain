-- CreateTable
CREATE TABLE "admin" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
