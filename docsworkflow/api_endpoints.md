# Dokumentasi Endpoint API

Dokumen ini merangkum endpoint HTTP backend Sistem Portofolio Dosen Berbasis
Blockchain. Isi mengikuti implementasi pada `server/src`.

## Konvensi Umum

Base URL lokal:

```text
http://localhost:3000
```

Semua endpoint API menggunakan prefix `/api`.

Endpoint selain yang ditandai **Publik** memerlukan JWT:

```http
Authorization: Bearer <access_token>
```

Token diperoleh dari endpoint login dan berlaku selama 8 jam.

### Role

| Role | Nilai token | Keterangan |
|---|---|---|
| Admin | `ADMIN` | Mengelola akun, akademik, dan jabatan |
| Tata Usaha | `TATA_USAHA` | Mengelola dosen dan dokumen dalam jurusannya |
| Dosen | `DOSEN` | Mengelola kegiatan, dokumen, dan highlight |
| Kajur | Jabatan aktif Dosen | Rekap tingkat jurusan |
| Kaprodi | Jabatan aktif Dosen | Rekap tingkat program studi |

### Template Respons

Berhasil:

```json
{
  "status": "success",
  "data": {}
}
```

Berhasil tanpa objek data:

```json
{
  "status": "success",
  "message": "Operasi berhasil."
}
```

Gagal:

```json
{
  "status": "error",
  "error": "Pesan kesalahan."
}
```

| Status | Arti |
|---|---|
| `200` | Request berhasil |
| `201` | Data berhasil dibuat |
| `400` | Payload atau parameter tidak valid |
| `401` | Token tidak ada, tidak valid, atau kedaluwarsa |
| `403` | Hak akses tidak mencukupi |
| `404` | Data tidak ditemukan |
| `409` | Data unik atau periode sudah digunakan |
| `500` | Kesalahan internal server |
| `502` | Gagal mengakses storage atau blockchain |

### Content Type

- JSON: `Content-Type: application/json`
- Upload: `Content-Type: multipart/form-data`
- Content dokumen: respons biner PDF atau DOCX

### Enum

```text
role:
ADMIN | TATA_USAHA | DOSEN

jenis_dokumen:
SURAT_KEPUTUSAN | SURAT_TUGAS | LEMBAR_PENGESAHAN |
KONTRAK_PENELITIAN | SERTIFIKAT | FOTO | LAPORAN |
BUKTI_PENDUKUNG_LAIN

kategori_tridharma:
PENDIDIKAN | PENELITIAN | PENGABDIAN | TUGAS_TAMBAHAN

jenis_kegiatan:
PENGAJARAN | BAHAN_AJAR | BIMBINGAN_MAHASISWA |
PEMBINAAN_MAHASISWA | PENGUJIAN_MAHASISWA | PENELITIAN |
PUBLIKASI_KARYA | PATEN | PENGABDIAN | PEMBICARA |
PENGELOLA_JURNAL | TUGAS_TAMBAHAN
```

## Daftar Endpoint

### Publik dan Autentikasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/api/status` | Publik | Status backend |
| `GET` | `/api/public/highlights/:kepemilikanId` | Publik | Highlight dari tautan publik |
| `POST` | `/api/auth/login` | Publik | Login email/password |
| `POST` | `/api/auth/google-login` | Publik | Login Google OAuth |

### User

Prefix `/api/admin/users`.

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/` | Admin, TU, Dosen | Daftar user |
| `GET` | `/:id` | Admin, TU, Dosen | Detail user |
| `POST` | `/` | Admin, TU, Dosen | Membuat user |
| `PATCH` | `/:id` | Admin, TU, Dosen | Memperbarui user |
| `DELETE` | `/:id` | Admin, TU, Dosen | Menghapus user |

Tata Usaha hanya dapat mengelola dosen dalam jurusannya. Middleware saat ini
juga mengizinkan Dosen memasuki route ini; pembatasan tambahan mengikuti service
yang dipanggil.

### Data Akademik

Prefix `/api/admin/akademik`.

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/jurusan` | Admin, TU, Dosen | Daftar jurusan |
| `GET` | `/jurusan/:id` | Admin, TU, Dosen | Detail jurusan |
| `POST` | `/jurusan` | Admin | Membuat jurusan |
| `PATCH` | `/jurusan/:id` | Admin | Memperbarui jurusan |
| `DELETE` | `/jurusan/:id` | Admin | Menghapus jurusan |
| `GET` | `/prodi` | Admin, TU, Dosen | Daftar program studi |
| `GET` | `/prodi/:id` | Admin, TU, Dosen | Detail program studi |
| `POST` | `/prodi` | Admin | Membuat program studi |
| `PATCH` | `/prodi/:id` | Admin | Memperbarui program studi |
| `DELETE` | `/prodi/:id` | Admin | Menghapus program studi |

### Jabatan

Prefix `/api/admin/jabatan`. Semua endpoint hanya untuk Admin.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/kajur` | Daftar Ketua Jurusan |
| `POST` | `/kajur` | Membuat jabatan Ketua Jurusan |
| `PATCH` | `/kajur/:id` | Memperbarui jabatan Ketua Jurusan |
| `DELETE` | `/kajur/:id` | Menghapus jabatan Ketua Jurusan |
| `GET` | `/kaprodi` | Daftar Ketua Program Studi |
| `POST` | `/kaprodi` | Membuat jabatan Ketua Program Studi |
| `PATCH` | `/kaprodi/:id` | Memperbarui jabatan Ketua Program Studi |
| `DELETE` | `/kaprodi/:id` | Menghapus jabatan Ketua Program Studi |

### Kegiatan Dosen

Prefix `/api/dosen/kegiatan`. Semua endpoint memerlukan role Dosen.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/` | Daftar kegiatan user |
| `GET` | `/stats/summary` | Ringkasan kegiatan |
| `GET` | `/filter/tanpa-bukti` | Kegiatan tanpa dokumen bukti |
| `GET` | `/:id/audit-trail` | Audit trail blockchain |
| `GET` | `/:id` | Detail kegiatan |
| `POST` | `/` | Membuat kegiatan dan snapshot blockchain |
| `PUT` | `/:id` | Memperbarui kegiatan dan snapshot blockchain |
| `DELETE` | `/:id` | Menghapus kegiatan |
| `POST` | `/:id/lampiran` | Menambahkan dokumen dan snapshot blockchain |

### Rekap Kajur dan Kaprodi

Prefix `/api/dosen/akademik-role`. Memerlukan role Dosen dan jabatan aktif.

| Method | Endpoint | Jabatan |
|---|---|---|
| `GET` | `/jurusan/kegiatan` | Kajur |
| `GET` | `/jurusan/stats` | Kajur |
| `GET` | `/prodi/kegiatan` | Kaprodi |
| `GET` | `/prodi/stats` | Kaprodi |

### Dokumen Dosen

Prefix `/api/dosen/dokumen`. Semua endpoint memerlukan role Dosen.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/` | Daftar dokumen dosen |
| `GET` | `/:id/preview` | Metadata dan pemeriksaan integritas |
| `GET` | `/:id/content` | File asli |
| `POST` | `/upload` | Upload dokumen pribadi |
| `DELETE` | `/:id` | Soft delete dokumen pribadi |

### Dokumen Tata Usaha

Prefix `/api/tatausaha/dokumen`. Semua endpoint memerlukan role Tata Usaha.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/` | Daftar dokumen resmi dalam yurisdiksi TU |
| `GET` | `/:id/preview` | Metadata dan pemeriksaan integritas |
| `GET` | `/:id/content` | File asli |
| `POST` | `/upload` | Upload dan distribusi dokumen |
| `PUT` | `/:id/metadata` | Memperbarui metadata |
| `DELETE` | `/:id` | Soft delete dokumen |

### Highlight

Prefix `/api/dosen/highlights`. Semua endpoint memerlukan role Dosen.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/?dokumenId=:id` | Highlight dokumen milik dosen |
| `GET` | `/:kepemilikanId` | Highlight berdasarkan kepemilikan |
| `POST` | `/:kepemilikanId/sync` | Mengganti seluruh highlight |
| `POST` | `/:kepemilikanId` | Menambahkan highlight |
| `PUT` | `/:id` | Memperbarui highlight |
| `DELETE` | `/:id` | Menghapus highlight |

## Template Request dan Response

UUID di bawah adalah placeholder.

### Status Server

```http
GET /api/status
```

```json
{
  "status": "success",
  "message": "Server berjalan.",
  "timestamp": "2026-06-07T08:00:00.000Z"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "dosen@example.ac.id",
  "password": "password"
}
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "token": "<jwt>",
    "role": "DOSEN",
    "email": "dosen@example.ac.id",
    "name": "Nama Dosen",
    "programStudi": "D3 TEKNIK INFORMATIKA",
    "jabatan": {
      "is_kajur": false,
      "is_kaprodi": true,
      "jurusan_id": null,
      "program_studi_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    }
  }
}
```

Login Google:

```http
POST /api/auth/google-login
Content-Type: application/json
```

```json
{
  "idToken": "<google_id_token>"
}
```

Response login Google menggunakan struktur yang sama.

### User

Daftar user:

```http
GET /api/admin/users?role=DOSEN
Authorization: Bearer <access_token>
```

Query `role` opsional.

```json
{
  "status": "success",
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "email": "dosen@example.ac.id",
      "role": "DOSEN",
      "admin": null,
      "tata_usaha": null,
      "dosen": {
        "nip": "198001012010121001",
        "nidn": "0401018001",
        "nama": "Nama Dosen",
        "chain_address": "1ExampleBlockchainAddress",
        "program_studi": {
          "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "nama_prodi": "D3 TEKNIK INFORMATIKA",
          "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        },
        "jabatan_kajur": [],
        "jabatan_kaprodi": []
      }
    }
  ]
}
```

Detail:

```http
GET /api/admin/users/:id
Authorization: Bearer <access_token>
```

Membuat Admin:

```http
POST /api/admin/users
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "email": "admin2@example.ac.id",
  "password": "Password123",
  "role": "ADMIN",
  "nama": "Admin Kedua"
}
```

Membuat Tata Usaha:

```json
{
  "email": "tu@example.ac.id",
  "password": "Password123",
  "role": "TATA_USAHA",
  "nama": "Petugas TU",
  "nip": "198501012010121001",
  "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
}
```

Membuat Dosen:

```json
{
  "email": "dosen@example.ac.id",
  "password": "Password123",
  "role": "DOSEN",
  "nama": "Nama Dosen",
  "nip": "198001012010121001",
  "nidn": "0401018001",
  "program_studi_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

Saat dosen dibuat, backend meminta alamat baru dari node MultiChain sesuai
program studi dan memberikan izin publish pada stream audit.

Update, semua field opsional:

```http
PATCH /api/admin/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "email": "email-baru@example.ac.id",
  "password": "PasswordBaru123",
  "nama": "Nama Baru",
  "nip": "198001012010121002",
  "nidn": "0401018002",
  "program_studi_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
}
```

Delete:

```http
DELETE /api/admin/users/:id
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "message": "User dosen@example.ac.id berhasil dihapus."
}
```

### Jurusan

```http
GET /api/admin/akademik/jurusan
GET /api/admin/akademik/jurusan/:id
Authorization: Bearer <access_token>
```

Create:

```http
POST /api/admin/akademik/jurusan
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "kode_jurusan": "JTK",
  "nama_jurusan": "Jurusan Teknik Komputer dan Informatika"
}
```

Update:

```http
PATCH /api/admin/akademik/jurusan/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "kode_jurusan": "JTK",
  "nama_jurusan": "Teknik Komputer dan Informatika"
}
```

Contoh response data:

```json
{
  "status": "success",
  "data": {
    "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "kode_jurusan": "JTK",
    "nama_jurusan": "Jurusan Teknik Komputer dan Informatika",
    "program_studi": [
      {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "kode_prodi": "D3-TI",
        "nama_prodi": "D3 TEKNIK INFORMATIKA"
      }
    ]
  }
}
```

```http
DELETE /api/admin/akademik/jurusan/:id
Authorization: Bearer <access_token>
```

Jurusan tidak dapat dihapus jika masih memiliki program studi.

### Program Studi

```http
GET /api/admin/akademik/prodi?jurusan_id=:jurusanId
GET /api/admin/akademik/prodi/:id
Authorization: Bearer <access_token>
```

Create:

```http
POST /api/admin/akademik/prodi
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "kode_prodi": "D3-TI",
  "nama_prodi": "D3 TEKNIK INFORMATIKA",
  "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
}
```

Update menggunakan endpoint `PATCH /api/admin/akademik/prodi/:id` dan field
yang sama. Semua field update opsional.

```json
{
  "status": "success",
  "data": {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "kode_prodi": "D3-TI",
    "nama_prodi": "D3 TEKNIK INFORMATIKA",
    "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "jurusan": {
      "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "kode_jurusan": "JTK",
      "nama_jurusan": "Jurusan Teknik Komputer dan Informatika"
    }
  }
}
```

```http
DELETE /api/admin/akademik/prodi/:id
Authorization: Bearer <access_token>
```

Program studi tidak dapat dihapus jika masih memiliki dosen.

### Jabatan Kajur dan Kaprodi

Daftar:

```http
GET /api/admin/jabatan/kajur?jurusan_id=:jurusanId&dosen_id=:dosenId
GET /api/admin/jabatan/kaprodi?program_studi_id=:prodiId&dosen_id=:dosenId
Authorization: Bearer <access_token>
```

Create Kajur:

```http
POST /api/admin/jabatan/kajur
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "dosen_id": "11111111-1111-4111-8111-111111111111",
  "jurusan_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "periode_mulai": "2026-01-01",
  "periode_selesai": "2027-01-01"
}
```

Create Kaprodi:

```http
POST /api/admin/jabatan/kaprodi
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "dosen_id": "11111111-1111-4111-8111-111111111111",
  "program_studi_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "periode_mulai": "2026-01-01",
  "periode_selesai": "2027-01-01"
}
```

Update:

```http
PATCH /api/admin/jabatan/kajur/:id
PATCH /api/admin/jabatan/kaprodi/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "dosen_id": "11111111-1111-4111-8111-111111111111",
  "periode_mulai": "2026-02-01",
  "periode_selesai": "2027-02-01"
}
```

Delete:

```http
DELETE /api/admin/jabatan/kajur/:id
DELETE /api/admin/jabatan/kaprodi/:id
Authorization: Bearer <access_token>
```

Periode jabatan tidak boleh bertabrakan pada unit akademik yang sama.

### Kegiatan Dosen

Daftar:

```http
GET /api/dosen/kegiatan
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "name": "Pengajaran Pemrograman Web",
      "jenisTridharma": "pengajaran",
      "kategori": "PENGAJARAN",
      "periode": "2025/2026",
      "semester": "ganjil",
      "role": "pencatat",
      "buktiCount": 1,
      "updatedAt": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

Statistik:

```http
GET /api/dosen/kegiatan/stats/summary
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": {
    "total": 10,
    "pengajaran": 4,
    "penelitian": 3,
    "pengabdian": 2,
    "tugas_tambahan": 1,
    "tanpa_bukti": 2,
    "total_dokumen": 7
  }
}
```

Tanpa bukti:

```http
GET /api/dosen/kegiatan/filter/tanpa-bukti
Authorization: Bearer <access_token>
```

Create:

```http
POST /api/dosen/kegiatan
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "namaKegiatan": "Pengajaran Pemrograman Web",
  "jenisTridharma": "pengajaran",
  "kategori": "mengajar",
  "tanggalMulai": "2026-01-10",
  "tanggalSelesai": "2026-05-30",
  "tahunAkademik": "2025/2026",
  "semester": "ganjil",
  "anggota_ids": [
    "33333333-3333-4333-8333-333333333333"
  ],
  "lampiran_ids": [
    "44444444-4444-4444-8444-444444444444"
  ]
}
```

Backend membuat data PostgreSQL, menerbitkan snapshot ke MultiChain, lalu
menyimpan transaction ID. Data kegiatan dibatalkan jika publish gagal.

```json
{
  "status": "success",
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "dosen_id": "11111111-1111-4111-8111-111111111111",
    "kategori_tridharma": "PENDIDIKAN",
    "jenis_kegiatan": "PENGAJARAN",
    "nama_kegiatan": "Pengajaran Pemrograman Web",
    "tanggal_mulai": "2026-01-10T00:00:00.000Z",
    "tanggal_selesai": "2026-05-30T00:00:00.000Z",
    "periode": "2025/2026",
    "semester": "GANJIL",
    "tx_id": "<multichain_transaction_id>"
  }
}
```

Detail:

```http
GET /api/dosen/kegiatan/:id
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "namaKegiatan": "Pengajaran Pemrograman Web",
    "jenisTridharma": "pengajaran",
    "kategori": "PENGAJARAN",
    "tanggalMulai": "2026-01-10T00:00:00.000Z",
    "tanggalSelesai": "2026-05-30T00:00:00.000Z",
    "tahunAkademik": "2025/2026",
    "semester": "ganjil",
    "programStudi": "D3 TEKNIK INFORMATIKA",
    "dosenTerlibat": [],
    "statusKelengkapan": "lengkap"
  }
}
```

Update, semua field opsional:

```http
PUT /api/dosen/kegiatan/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "namaKegiatan": "Nama kegiatan yang diperbarui",
  "tanggalSelesai": "2026-06-15"
}
```

Update membuat event blockchain `KEGIATAN_UPDATED`.

Menambahkan lampiran:

```http
POST /api/dosen/kegiatan/:id/lampiran
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "dokumen_id": "44444444-4444-4444-8444-444444444444"
}
```

Penambahan lampiran membuat event blockchain `DOKUMEN_ADDED`.

Delete:

```http
DELETE /api/dosen/kegiatan/:id
Authorization: Bearer <access_token>
```

### Audit Trail

```http
GET /api/dosen/kegiatan/:id/audit-trail
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": [
    {
      "id": "<transaction_id>",
      "txId": "<transaction_id>",
      "action": "KEGIATAN_UPDATED",
      "actor": "Nama Dosen",
      "publisher": "1ExampleBlockchainAddress",
      "timestamp": "2026-06-07T08:00:00.000Z",
      "details": "Pengajaran Pemrograman Web",
      "documentCount": 1,
      "confirmations": 3,
      "blockHeight": 120,
      "payload": {
        "event_type": "KEGIATAN_UPDATED",
        "payload_version": 1
      }
    }
  ]
}
```

Audit trail hanya dibaca dari stream ketika endpoint ini dipanggil.

### Rekap Kajur dan Kaprodi

Daftar kegiatan Kajur:

```http
GET /api/dosen/akademik-role/jurusan/kegiatan?page=1&size=10&tanggalAwal=2026-01-01&tanggalAkhir=2026-12-31&jenis=PENDIDIKAN&kategori=PENGAJARAN&search=web&prodiId=:prodiId&dosenId=:dosenId&status=lengkap
Authorization: Bearer <access_token>
```

Daftar kegiatan Kaprodi menggunakan query yang sama tanpa `prodiId`:

```http
GET /api/dosen/akademik-role/prodi/kegiatan?page=1&size=10
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "size": 10,
    "totalPages": 0
  }
}
```

Statistik:

```http
GET /api/dosen/akademik-role/jurusan/stats
GET /api/dosen/akademik-role/prodi/stats
Authorization: Bearer <access_token>
```

```json
{
  "status": "success",
  "data": {
    "semua": 20,
    "PENDIDIKAN": 8,
    "PENELITIAN": 5,
    "PENGABDIAN": 4,
    "TUGAS_TAMBAHAN": 3
  }
}
```

### Daftar Dokumen

Dosen:

```http
GET /api/dosen/dokumen?tab=tu&search=surat&jenis=SK
Authorization: Bearer <access_token>
```

| Query | Nilai | Keterangan |
|---|---|---|
| `tab` | `tu` atau `dosen` | Sumber dokumen |
| `search` | string | Pencarian nama |
| `jenis` | `SK`, `Surat Tugas`, dan lainnya | Jenis dokumen |

```json
{
  "status": "success",
  "data": [
    {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "Surat Tugas Mengajar",
      "jenis": "SURAT_TUGAS",
      "tanggal": "2026-01-05T00:00:00.000Z",
      "asal": "tu",
      "size": "Undetermined",
      "hasHighlight": false
    }
  ]
}
```

Tata Usaha:

```http
GET /api/tatausaha/dokumen
Authorization: Bearer <access_token>
```

### Upload Dokumen Dosen

```http
POST /api/dosen/dokumen/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `file` | file | Ya | PDF/DOCX, maksimum 20 MB |
| `nama` | string | Ya | Nama dokumen |
| `jenis_dokumen` | string | Ya | `SK`, `Surat Tugas`, `Sertifikat`, dll. |
| `tanggal_dokumen` | date | Ya | Tanggal dokumen |

```bash
curl -X POST http://localhost:3000/api/dosen/dokumen/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@./surat-tugas.pdf" \
  -F "nama=Surat Tugas Mengajar" \
  -F "jenis_dokumen=Surat Tugas" \
  -F "tanggal_dokumen=2026-01-05"
```

```json
{
  "status": "success",
  "message": "Dokumen mandiri berhasil disimpan.",
  "data": {
    "id": "44444444-4444-4444-8444-444444444444"
  }
}
```

### Upload Dokumen Tata Usaha

```http
POST /api/tatausaha/dokumen/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `file` | file | Ya | PDF/DOCX, maksimum 20 MB |
| `nama` | string | Ya | Nama dokumen |
| `jenis_dokumen` | enum | Ya | Contoh `SURAT_TUGAS` |
| `tanggal_upload` | date | Ya | Tanggal dokumen |
| `dosen_penerima_ids` | JSON string | Ya | Array UUID dosen |

```bash
curl -X POST http://localhost:3000/api/tatausaha/dokumen/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@./surat-tugas.pdf" \
  -F "nama=Surat Tugas Mengajar" \
  -F "jenis_dokumen=SURAT_TUGAS" \
  -F "tanggal_upload=2026-01-05" \
  -F 'dosen_penerima_ids=["11111111-1111-4111-8111-111111111111"]'
```

```json
{
  "status": "success",
  "message": "Dokumen berhasil diunggah ke S3 dan disimpan di database.",
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "file_path": "https://bucket.s3.region.amazonaws.com/documents/file.pdf",
    "hash_file": "<sha256>"
  }
}
```

Update metadata:

```http
PUT /api/tatausaha/dokumen/:id/metadata
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "nama": "Nama Dokumen Baru",
  "jenis_dokumen": "SURAT_TUGAS",
  "tanggal_upload": "2026-02-01"
}
```

### Preview, Content, dan Delete Dokumen

```http
GET /api/dosen/dokumen/:id/preview?activityId=:kegiatanId
GET /api/tatausaha/dokumen/:id/preview?activityId=:kegiatanId
Authorization: Bearer <access_token>
```

`activityId` opsional, tetapi disarankan ketika dokumen dibuka dari detail
kegiatan agar pemeriksaan memakai snapshot yang tepat.

```json
{
  "status": "success",
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "name": "Surat Tugas Mengajar",
    "jenis": "SURAT_TUGAS",
    "sumber": "UPLOAD_PRIBADI",
    "tanggalUpload": "2026-01-05T00:00:00.000Z",
    "contentType": "application/pdf",
    "size": 174054,
    "databaseHash": "<sha256>",
    "contentHash": "<sha256>",
    "contentMatchesDatabase": true,
    "blockchainIntegrity": {
      "status": "valid",
      "blockchainHash": "<sha256>",
      "txId": "<transaction_id>",
      "activityId": "22222222-2222-4222-8222-222222222222",
      "blockHeight": 120,
      "confirmations": 3,
      "checkedAt": "2026-06-07T08:00:00.000Z"
    }
  }
}
```

Status integritas:

```text
valid | invalid | not_recorded
```

File asli:

```http
GET /api/dosen/dokumen/:id/content
GET /api/tatausaha/dokumen/:id/content
Authorization: Bearer <access_token>
```

Response berupa data biner dengan header:

```http
Content-Type: application/pdf
Content-Disposition: inline; filename*=UTF-8''nama-file.pdf
X-Content-SHA256: <sha256>
```

Delete:

```http
DELETE /api/dosen/dokumen/:id
DELETE /api/tatausaha/dokumen/:id
Authorization: Bearer <access_token>
```

Delete dokumen bersifat soft delete melalui field `deleted_at`.

### Highlight

Format satu highlight:

```json
{
  "page_number": 1,
  "highlighted_text": "Teks yang dipilih",
  "highlight_rect": [
    {
      "x1": 10.5,
      "x2": 120.5,
      "y1": 40,
      "y2": 55,
      "width": 110,
      "height": 15,
      "boundary_rect": false
    }
  ]
}
```

Mengambil:

```http
GET /api/dosen/highlights?dokumenId=:dokumenId
GET /api/dosen/highlights/:kepemilikanId
Authorization: Bearer <access_token>
```

Menambah:

```http
POST /api/dosen/highlights/:kepemilikanId
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body menggunakan format satu highlight.

Sinkronisasi:

```http
POST /api/dosen/highlights/:kepemilikanId/sync
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "highlights": [
    {
      "page_number": 1,
      "highlighted_text": "Teks yang dipilih",
      "highlight_rect": [
        {
          "x1": 10.5,
          "x2": 120.5,
          "y1": 40,
          "y2": 55,
          "width": 110,
          "height": 15,
          "boundary_rect": false
        }
      ]
    }
  ]
}
```

Sinkronisasi menghapus highlight lama dan membuat ulang data dari request.

Update dan delete:

```http
PUT /api/dosen/highlights/:id
DELETE /api/dosen/highlights/:id
Authorization: Bearer <access_token>
```

Publik:

```http
GET /api/public/highlights/:kepemilikanId
```

```json
{
  "status": "success",
  "data": [
    {
      "id": "55555555-5555-4555-8555-555555555555",
      "kepemilikan_id": "66666666-6666-4666-8666-666666666666",
      "page_number": 1,
      "highlighted_text": "Teks yang dipilih",
      "highlight_rect": [
        {
          "id": "77777777-7777-4777-8777-777777777777",
          "highlight_id": "55555555-5555-4555-8555-555555555555",
          "x1": 10.5,
          "x2": 120.5,
          "y1": 40,
          "y2": 55,
          "width": 110,
          "height": 15,
          "boundary_rect": false
        }
      ]
    }
  ]
}
```

## Contoh Cepat cURL

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.ac.id","password":"AdminPassword123"}'
```

Gunakan token:

```bash
curl http://localhost:3000/api/admin/akademik/prodi \
  -H "Authorization: Bearer <access_token>"
```

## Catatan Implementasi

- API belum memakai version prefix seperti `/api/v1`.
- Validasi payload masih berada pada service, belum menggunakan schema
  validator terpusat.
- Create/update kegiatan bergantung pada ketersediaan node MultiChain.
- File disimpan di S3; database menyimpan metadata, URL, dan hash.
- Audit trail dibaca dari stream MultiChain berdasarkan key ID kegiatan.
- Preview menghitung ulang SHA-256 byte file yang disajikan, lalu
  membandingkannya dengan database dan blockchain.
