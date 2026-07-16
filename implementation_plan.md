# Tambah `dosen_id` ke `LampiranBukti` & Cleanup Schema

## Background

Saat ini tabel `lampiran_bukti` hanya memiliki `kegiatan_id` dan `dokumen_id`. Ini menyebabkan **bug ambiguitas**: ketika 1 dokumen yang sama dipakai di kegiatan dengan beberapa dosen (`jenis_bukti = MASING_MASING`), logika di server (`getActivityById`) mencari pemilik dokumen via tabel `kepemilikan_dokumen`, bukan langsung dari `lampiran_bukti`. Akibatnya, jika suatu dokumen ternyata **dimiliki bersama** (ada di `kepemilikan` lebih dari satu dosen), dokumen itu akan muncul **di semua dosen** di frontend.

Dengan menambahkan `dosen_id` ke `lampiran_bukti`, setiap lampiran secara eksplisit milik satu dosen di satu kegiatan. Ini menghapus ambiguitas tersebut.

---

## User Review Required

> [!IMPORTANT]
> Perubahan ini membutuhkan **migrasi database**. Karena kolom `dosen_id` baru, kolom akan diisi dari data existing menggunakan `firstKepemilikan.dosen_id` dari dokumen terkait. Ini membutuhkan langkah migrasi manual data sebelum kolom menjadi NOT NULL.
>
> Strategi yang diusulkan: buat kolom `dosen_id` sebagai **nullable** dulu, isi data existing, kemudian buat NOT NULL di migrasi berikutnya. Atau, kita bisa set nilai default sementara.

> [!WARNING]
> Perubahan pada schema Prisma dan tabel database akan membutuhkan:
> - `npx prisma migrate dev` (development)
> - Potensi data backfill untuk row yang sudah ada

---

## Open Questions

> [!IMPORTANT]
> **Untuk `jenis_bukti = BERSAMA`:** Apakah `dosen_id` di `lampiran_bukti` harus diisi dengan `dosen_id` dari uploader? Atau haruskah `null`? 
> 
> Usulan: isi dengan `dosen_id` uploader. Untuk tampilan bersama, filter `lampiran_bukti` tidak perlu pakai `dosen_id`, tapi field tetap terisi untuk audit trail.

---

## Analisis Bug Saat Ini

Di `ActivityService.getActivityById()` (baris 292-307):
```typescript
// Bug: mencari owner via kepemilikan, bukan via lampiran_bukti.dosen_id
lb.dokumen.kepemilikan.forEach((k: any) => {
  const ownerInActivity = dosenTerlibatMap.get(k.dosen_id);
  if (ownerInActivity) {
    ownerInActivity.dokumen.push(...)
  }
});
```

Masalah: Jika dosen A dan dosen B sama-sama memiliki (`kepemilikan`) dokumen tersebut (misalnya dokumen BERSAMA, atau dokumen yang didistribusikan TU), dokumen itu akan muncul di **kedua dosen** di `MASING_MASING` mode.

**Fix:** Setelah menambah `dosen_id` ke `lampiran_bukti`, server cukup pakai `lb.dosen_id` untuk tahu dokumen ini milik siapa.

---

## Kolom / Tabel Tidak Terpakai

Setelah audit menyeluruh pada schema:

| Tabel/Field | Status | Alasan |
|---|---|---|
| `JenisDokumen` model | ⚠️ Kandidat hapus | `jenis_dokumen` di `Dokumen` adalah `String` bebas, `JenisDokumen` tabel tidak di-FK-kan ke manapun. Tidak ada relasi aktif. |
| `Dokumen.file_path` | ✅ Dipakai | Digunakan di `FileStorageService` |
| `KegiatanTridharma.tx_id` | ✅ Dipakai | Dipakai untuk blockchain |
| Semua field lain | ✅ Terpakai | Terbukti dipakai di kode |

> [!WARNING]
> Model `JenisDokumen` di schema Prisma tidak memiliki relasi FK ke tabel lain. Field `jenis_dokumen` di model `Dokumen` adalah `String` plain. Ada controller `JenisDokumenController.ts` yang mengelola CRUD `JenisDokumen`, namun ini hanya untuk **referensi list di frontend** (dropdown), bukan relasi database. Perlu konfirmasi apakah masih diperlukan atau boleh dihapus.

---

## Proposed Changes

### Schema (Database Layer)

#### [MODIFY] [schema.prisma](file:///d:/ajid/Project/V2/kota101-web-portofolio-dosen-blockchain/server/prisma/schema.prisma)

- Tambah field `dosen_id` (Uuid, nullable untuk backward-compat awal) ke model `LampiranBukti`
- Tambah relasi `dosen Dosen @relation(...)` ke model `LampiranBukti`
- Tambah backrelation `lampiran_bukti LampiranBukti[]` ke model `Dosen`

---

### Backend (Server Layer)

#### [MODIFY] [ActivityRepository.ts](file:///d:/ajid/Project/V2/kota101-web-portofolio-dosen-blockchain/server/src/repositories/ActivityRepository.ts)

- Method `createLampiran()`: tambah `dosen_id` ke data yang di-create
- Method `create()`: saat membuat lampiran dalam transaksi, sertakan `dosen_id`
- Method `getActivityDocumentIds()`: ubah query agar bisa filter by `dosen_id` jika diperlukan

#### [MODIFY] [ActivityService.ts](file:///d:/ajid/Project/V2/kota101-web-portofolio-dosen-blockchain/server/src/services/ActivityService.ts)

- `getActivityById()`: ubah logika distribusi dokumen ke dosen. Dari iterasi `lb.dokumen.kepemilikan` (tidak akurat) → gunakan `lb.dosen_id` langsung (akurat)
- `addLampiran()`: sertakan `dosen_id` saat create lampiran
- `updateActivity()` saat `toAdd` dokumen: sertakan `dosen_id` uploader (`dosenId`)
- `createActivity()` saat create lampiran awal: sertakan `dosenId` sebagai pemilik lampiran

---

### Migrasi Data

Setelah `prisma migrate dev`, kolom `dosen_id` pada row existing akan `NULL`. Diperlukan SQL backfill:

```sql
-- Isi dosen_id dari kepemilikan pertama dokumen tersebut
UPDATE lampiran_bukti lb
SET dosen_id = (
  SELECT kd.dosen_id 
  FROM kepemilikan_dokumen kd 
  WHERE kd.dokumen_id = lb.dokumen_id 
    AND kd.status = 'DISETUJUI'
  LIMIT 1
)
WHERE lb.dosen_id IS NULL;
```

---

## Verification Plan

### Automated Tests
- Jalankan `npm run build` di `/server` untuk memastikan TypeScript compile tanpa error.
- Jalankan `npx prisma validate` untuk validasi schema.

### Manual Verification
- Buat kegiatan dengan `jenis_bukti = MASING_MASING` dan 2 dosen
- Masing-masing upload dokumen berbeda
- Pastikan di `ActivityDetailPage` setiap dosen hanya menampilkan dokumennya sendiri
- Test juga skenario `jenis_bukti = BERSAMA`: dokumen harus muncul di bagian "Dokumen Bersama"
