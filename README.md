# Sistem Portofolio Dosen Berbasis Blockchain

Aplikasi web untuk mencatat kegiatan Tridharma dosen, mengelola dokumen
pendukung, dan menjaga keterlacakan perubahan melalui audit trail pada
permissioned blockchain MultiChain.

Sistem menggunakan PostgreSQL sebagai penyimpanan data operasional, Amazon S3
untuk file dokumen, dan stream MultiChain untuk snapshot kegiatan beserta hash
SHA-256 dokumen.

## Fitur Utama

- Autentikasi email/password dan Google OAuth.
- Manajemen akun Admin, Tata Usaha, dan Dosen.
- Pengelolaan jurusan, program studi, Ketua Jurusan, dan Ketua Program Studi.
- Pencatatan kegiatan Pendidikan, Penelitian, Pengabdian, dan Tugas Tambahan.
- Distribusi dokumen resmi oleh Tata Usaha.
- Upload dokumen pribadi dosen dalam format PDF atau DOCX.
- Pencatatan snapshot kegiatan ke stream MultiChain saat create, update, dan
  penambahan dokumen.
- Audit trail blockchain yang dimuat ketika pengguna membukanya.
- Preview PDF asli dari S3.
- Pemeriksaan integritas file terhadap hash database dan blockchain.
- Rekap kegiatan pada tingkat dosen, program studi, dan jurusan.
- Highlight dokumen dan akses highlight melalui tautan publik.

## Arsitektur

```text
React + Vite
      |
      v
Express REST API
      |
      +--> PostgreSQL + Prisma
      |      Data user, kegiatan, relasi, dan metadata dokumen
      |
      +--> Amazon S3
      |      File PDF/DOCX
      |
      +--> MultiChain
             Snapshot kegiatan, hash dokumen, publisher, dan audit trail
```

### Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | Node.js 20, Express 5, TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| File storage | Amazon S3 |
| Blockchain | MultiChain stream |
| Authentication | JWT, Google OAuth |
| Deployment | Docker, GitHub Actions, AWS |

## Alur Blockchain

Backend menggunakan tiga node RPC MultiChain generik yang berada pada chain yang
sama dan memiliki permission setara. Node tidak lagi dipilih berdasarkan program
studi, dan akun dosen tidak lagi membutuhkan alamat MultiChain khusus.

Setiap publish/read audit trail dikirim melalui node yang dipilih bergiliran
oleh backend. Snapshot kegiatan diterbitkan ke stream yang dikonfigurasi melalui
`AUDIT_STREAM_NAME`, menggunakan ID kegiatan sebagai stream key.

Event yang saat ini diterbitkan:

```text
KEGIATAN_CREATED
KEGIATAN_UPDATED
DOKUMEN_ADDED
```

Snapshot memuat data kegiatan, pencatat, partisipan, metadata dokumen
pendukung, dan hash SHA-256 file. File fisik tidak disimpan di blockchain.

## Struktur Repositori

```text
.
|-- client/                 Frontend React
|   `-- src/
|       |-- components/     Komponen UI dan layout
|       |-- contexts/       State global, termasuk autentikasi
|       |-- pages/          Halaman dan route aplikasi
|       `-- lib/            Utilitas frontend
|-- server/                 Backend Express
|   |-- prisma/
|   |   |-- migrations/     Riwayat migrasi database
|   |   |-- schema.prisma   Model dan relasi database
|   |   `-- seed.ts         Seed admin, jurusan, D3-TI, dan D4-TI
|   `-- src/
|       |-- controllers/    Adapter request dan response HTTP
|       |-- lib/            Prisma dan daftar node blockchain
|       |-- middleware/     JWT, role, dan error handler
|       |-- repositories/   Akses data Prisma
|       |-- routes/         Deklarasi endpoint
|       |-- services/       Logika bisnis, S3, dan MultiChain
|       `-- types/          Tipe data bersama
|-- docsworkflow/           Dokumentasi teknis dan workflow
|-- docker-compose.yml      PostgreSQL dan aplikasi
`-- Dockerfile              Build frontend dan backend
```

Penjelasan lebih rinci tersedia di [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).

## Prasyarat

Untuk menjalankan seluruh sistem:

- Docker Desktop atau Docker Engine dengan Docker Compose.
- Akses ke bucket Amazon S3.
- Dua RPC node MultiChain D3 dan D4 yang tergabung pada chain yang sama.
- Stream audit sudah dibuat dan dapat diakses oleh node.
- Google OAuth client jika login Google akan digunakan.

Untuk menjalankan tanpa Docker:

- Node.js 20 atau lebih baru.
- PostgreSQL 16.
- npm.

## Konfigurasi Environment

Salin template root:

```bash
cp .env.example .env
```

Environment root digunakan oleh Docker Compose dan Vite build:

| Variable | Keterangan |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID untuk frontend |
| `VITE_API_URL` | Base URL backend, misalnya `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID untuk verifikasi backend |
| `AWS_ACCESS_KEY_ID` | AWS access key dengan akses bucket |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `CHAIN_NAME` | Nama chain MultiChain |
| `AUDIT_STREAM_NAME` | Nama stream audit kegiatan |
| `MULTICHAIN_N1_IP` | Host RPC node MultiChain 1 |
| `MULTICHAIN_N1_RPC_PORT` | Port RPC node MultiChain 1 |
| `MULTICHAIN_N1_RPC_USERNAME` | Username RPC node MultiChain 1 |
| `MULTICHAIN_N1_RPC_PASSWORD` | Password RPC node MultiChain 1 |
| `MULTICHAIN_N2_IP` | Host RPC node MultiChain 2 |
| `MULTICHAIN_N2_RPC_PORT` | Port RPC node MultiChain 2 |
| `MULTICHAIN_N2_RPC_USERNAME` | Username RPC node MultiChain 2 |
| `MULTICHAIN_N2_RPC_PASSWORD` | Password RPC node MultiChain 2 |
| `MULTICHAIN_N3_IP` | Host RPC node MultiChain 3 |
| `MULTICHAIN_N3_RPC_PORT` | Port RPC node MultiChain 3 |
| `MULTICHAIN_N3_RPC_USERNAME` | Username RPC node MultiChain 3 |
| `MULTICHAIN_N3_RPC_PASSWORD` | Password RPC node MultiChain 3 |

Konfigurasi server tersedia pada `server/.env.example`:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret untuk menandatangani JWT |
| `ADMIN_EMAIL` | Email admin yang dibuat oleh seed |
| `ADMIN_PASSWORD` | Password admin seed |
| `ADMIN_NAME` | Nama admin seed |
| `AWS_S3_BUCKET` | Nama bucket dokumen |
| `NODE_ENV` | `development` atau `production` |
| `PORT` | Port Express |

Jangan commit `.env` atau kredensial asli ke repository.

## Menjalankan dengan Docker

Docker Compose menjalankan PostgreSQL dan image aplikasi gabungan
frontend/backend.

```bash
docker compose up -d --build
```

Aplikasi tersedia di:

```text
http://localhost:3000
```

Periksa status:

```bash
docker compose ps
curl http://localhost:3000/api/status
```

Lihat log aplikasi:

```bash
docker compose logs -f app
```

Matikan container:

```bash
docker compose down
```

Data PostgreSQL disimpan pada volume `pgdata`. Gunakan opsi `-v` hanya jika
memang ingin menghapus volume database:

```bash
docker compose down -v
```

Saat container aplikasi dimulai, entrypoint menjalankan:

1. `prisma migrate deploy`
2. `prisma db seed`
3. server hasil build

## Menjalankan Tanpa Docker

### Backend

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Frontend

Jalankan pada terminal lain:

```bash
cd client
npm install
npm run dev
```

Vite akan menampilkan URL development server pada terminal. Pastikan
`VITE_API_URL` menunjuk ke backend.

## Database dan Prisma

Setelah mengubah `server/prisma/schema.prisma`, buat migration pada lingkungan
development:

```bash
cd server
npx prisma migrate dev --name nama_perubahan
```

Generate ulang Prisma Client:

```bash
npx prisma generate
```

Jalankan seed:

```bash
npx prisma db seed
```

Seed saat ini membuat:

- Admin dari `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan `ADMIN_NAME`.
- Jurusan `JTK`.
- Program studi `D3-TI`.
- Program studi `D4-TI`.

Workflow lengkap tersedia di
[docsworkflow/prisma_workflow.md](./docsworkflow/prisma_workflow.md).

## API

Base URL lokal:

```text
http://localhost:3000/api
```

Endpoint selain route publik memerlukan header:

```http
Authorization: Bearer <access_token>
```

Daftar seluruh endpoint, role, query parameter, template request, dan response
tersedia di
[docsworkflow/api_endpoints.md](./docsworkflow/api_endpoints.md).

Contoh login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.ac.id","password":"AdminPassword123"}'
```

## Build dan Pemeriksaan

Build backend:

```bash
cd server
npm run build
```

Build frontend:

```bash
cd client
npm run build
```

Lint frontend:

```bash
cd client
npm run lint
```

## Dokumentasi

- [Daftar Endpoint API](./docsworkflow/api_endpoints.md)
- [Struktur Folder](./FOLDER_STRUCTURE.md)
- [Workflow Prisma](./docsworkflow/prisma_workflow.md)
- [Workflow Git](./docsworkflow/git_workflow.md)

## Catatan Keamanan

- Ganti nilai default `JWT_SECRET` dan password admin untuk deployment.
- Batasi security group port RPC MultiChain hanya untuk host yang diperlukan.
- Gunakan IAM policy minimum untuk akses S3.
- Jangan menyimpan file dokumen atau kredensial di blockchain.
- Blockchain menyimpan snapshot dan hash; PostgreSQL tetap menjadi sumber data
  terbaru untuk operasi aplikasi.
- `tx_id` mengidentifikasi transaksi, sedangkan satu block dapat berisi lebih
  dari satu transaksi.
