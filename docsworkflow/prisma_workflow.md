# Prisma Migration Workflow
> Stack: Node.js + TypeScript · Prisma 7.x · PostgreSQL · Docker Compose

---

## Prasyarat

Sebelum menjalankan perintah Prisma apapun, pastikan container PostgreSQL sudah jalan:

```bash
# Dari root project
docker compose up postgres_db -d

# Verifikasi container jalan
docker ps
# Pastikan jtk_portfolio_db ada dengan status "Up"
```

> Semua perintah `npx prisma ...` di bawah dijalankan dari folder `server/`.

---

## Struktur File Prisma

```
server/
├── prisma/
│   ├── schema.prisma           # Definisi model/tabel
│   └── migrations/
│       └── YYYYMMDDHHMMSS_nama/
│           └── migration.sql   # SQL yang di-generate otomatis
├── prisma.config.ts            # Konfigurasi Prisma CLI (URL, path)
├── src/
│   └── lib/
│       └── prisma.ts           # Singleton PrismaClient
└── .env                        # DATABASE_URL untuk development lokal
```

---

## Konfigurasi File

### `prisma.config.ts`
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### `.env` (development lokal)
```env
# localhost karena Prisma CLI jalan dari host, bukan dari dalam Docker
DATABASE_URL=postgresql://portfolio_user:secretpassword@localhost:5432/portfolio_blockchain_db
```

---

## Workflow 1 — Setup Awal (Pertama Kali)

```bash
# 1. Masuk ke folder server
cd server

# 2. Install dependencies
npm install prisma @prisma/client
npm install dotenv
npm install @prisma/adapter-pg pg
npm install -D @types/pg

# 3. Jalankan migration pertama
npx prisma migrate dev --name init

# 4. Generate Prisma Client
npx prisma generate
```

---

## Workflow 2 — Menambah / Mengubah Model

Setiap kali ada perubahan di `schema.prisma`:

```bash
# 1. Edit schema.prisma — tambah/ubah/hapus model atau field

# 2. Buat migration baru
npx prisma migrate dev --name nama_perubahan_singkat

# Contoh penamaan yang baik:
npx prisma migrate dev --name add_dosen_table
npx prisma migrate dev --name add_portfolio_field
npx prisma migrate dev --name remove_unused_column

# 3. Update Prisma Client
npx prisma generate
```

> Di Prisma 7, `migrate dev` **tidak** otomatis menjalankan `prisma generate`. Harus dijalankan manual.

---

## Workflow 3 — Cek Status Migration

```bash
# Lihat migration mana yang sudah / belum diapply
npx prisma migrate status
```

Contoh output:
```
3 migrations found in prisma/migrations

✔  20260531094116_init
✔  20260601120000_add_dosen_table
✗  20260602090000_add_portfolio_field   ← belum diapply
```

---

## Workflow 4 — Setelah Pull dari Git

Jika ada rekan tim yang push migration baru, jalankan:

```bash
# Apply migration yang belum jalan di database lokal kamu
npx prisma migrate dev

# Update Prisma Client
npx prisma generate
```

---

## Workflow 5 — Reset Database (Development)

Untuk menghapus semua data dan apply ulang semua migration dari awal:

```bash
# HATI-HATI: menghapus semua data di database
npx prisma migrate reset
```

Atau jika ingin reset total termasuk volume Docker:

```bash
# Dari root project — hapus container + volume
docker compose down -v

# Jalankan ulang postgres
docker compose up postgres_db -d

# Apply semua migration dari awal
cd server
npx prisma migrate dev
```

---

## Workflow 6 — Membatalkan Migration Terakhir

Prisma tidak punya perintah `rollback` bawaan. Caranya:

```bash
# 1. Hapus folder migration terakhir secara manual
# server/prisma/migrations/YYYYMMDDHHMMSS_nama_terakhir/

# 2. Reset database dan apply ulang
npx prisma migrate reset
```

> Untuk production, selalu buat migration baru yang membalik perubahan (bukan rollback).

---

## Referensi Perintah

| Perintah | Keterangan | Kapan Dipakai |
|---|---|---|
| `prisma migrate dev --name xxx` | Buat dan apply migration baru | Development |
| `prisma migrate deploy` | Apply migration yang belum jalan | Production / CI-CD |
| `prisma migrate status` | Cek status semua migration | Kapan saja |
| `prisma migrate reset` | Reset DB dan apply ulang dari awal | Development |
| `prisma generate` | Update Prisma Client setelah ubah schema | Setelah migrate |
| `prisma studio` | GUI untuk lihat dan edit data | Development |
| `prisma db pull` | Sinkronisasi schema dari DB yang sudah ada | Reverse engineering |
| `prisma db push` | Push schema ke DB tanpa buat migration | Prototyping cepat |

---

## Perbedaan `migrate dev` vs `migrate deploy`

| | `migrate dev` | `migrate deploy` |
|---|---|---|
| Dipakai di | Development | Production / CI-CD |
| Buat file migration | ✅ Ya | ❌ Tidak |
| Interaktif | ✅ (bisa tanya konfirmasi) | ❌ (non-interaktif) |
| Jalankan `generate` | ❌ Tidak (Prisma 7) | ❌ Tidak |
| Aman untuk production | ❌ | ✅ |

---

## Integrasi CI-CD (GitHub Actions + AWS ECS)

Migration di production dijalankan sebagai **ECS one-off task** sebelum service di-deploy:

```yaml
# Di .github/workflows/ci-cd.yml — setelah render task definition

- name: Run database migrations via ECS task
  run: |
    TASK_ARN=$(aws ecs run-task \
      --cluster ${{ env.ECS_CLUSTER }} \
      --task-definition ${{ steps.task-def.outputs.task-definition }} \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={
        subnets=[${{ secrets.PRIVATE_SUBNET_IDS }}],
        securityGroups=[${{ secrets.ECS_SECURITY_GROUP_ID }}],
        assignPublicIp=DISABLED
      }" \
      --overrides '{
        "containerOverrides": [{
          "name": "${{ env.CONTAINER_NAME }}",
          "command": ["npx", "prisma", "migrate", "deploy"]
        }]
      }' \
      --query 'tasks[0].taskArn' \
      --output text)

    aws ecs wait tasks-stopped \
      --cluster ${{ env.ECS_CLUSTER }} \
      --tasks $TASK_ARN

    EXIT_CODE=$(aws ecs describe-tasks \
      --cluster ${{ env.ECS_CLUSTER }} \
      --tasks $TASK_ARN \
      --query 'tasks[0].containers[0].exitCode' \
      --output text)

    if [ "$EXIT_CODE" != "0" ]; then
      echo "Migration failed!"
      exit 1
    fi
```

> Migration selalu dijalankan **sebelum** deploy service baru agar schema sudah siap saat kode baru jalan.

---

## Tips

- Jangan edit file di dalam folder `migrations/` secara manual.
- Commit folder `prisma/migrations/` ke Git — ini adalah source of truth schema database.
- Nama migration pakai format deskriptif: `add_X`, `remove_Y`, `rename_Z_to_W`.
- Selalu jalankan `prisma migrate status` setelah pull dari Git untuk memastikan DB lokal sinkron.