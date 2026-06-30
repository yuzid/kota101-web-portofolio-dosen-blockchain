# Backend Requirements — Integration Guide

## 📋 Status per Fitur

| #   | Fitur                       | Endpoint                                                       | Status BE                                        | Frontend Mock                  | LocalStorage Key             | File terkait                                                                   |
| --- | --------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------ |
| 1   | Hapus dokumen dari kegiatan | `PUT /api/dosen/kegiatan/:id`                                  | ❌ `deleted_lampiran_ids` diabaikan              | ✅                             | `kegiatan_mock_{id}_deleted` | `ActivityFormPage.tsx`, `ActivityDetailPage.tsx`                               |
| 2   | Highlight filter per user   | `GET /api/dosen/highlights?dokumenId=:id`                      | ❌ return semua highlight, bukan per kepemilikan | ✅ client-side filter          | —                            | `DocumentPreviewPage.tsx`                                                      |
| 3   | Rekap kajur include kaprodi | `GET .../jurusan/rekap` + `GET .../prodi/rekap`                | ❌ endpoint prodi ga bisa diakses kajur          | ✅ merge 2 endpoint + fallback | `mock_all_rekap`             | `rekapStorage.ts`                                                              |
| 4   | Satu dokumen satu kegiatan  | — (validasi di create/update kegiatan)                         | ❌ belum ada validasi backend                    | ✅                             | `dokumen_kegiatan_map`       | `dokumenKegiatanMap.ts`, `ActivityFormPage.tsx`, `ActivityDetailPage.tsx`      |
| 5   | Jenis dokumen dinamis (TU)  | `POST /api/tatausaha/jenis-dokumen` + `GET /api/jenis-dokumen` | ❌ masih Prisma enum                             | ✅                             | `tu_jenis_tambahan`          | `utils.ts`, `DocumentDistributionPage.tsx`, `DocumentDistributionEditPage.tsx` |
| 6   | Kategori kegiatan enum      | —                                                              | ✅ sudah sesuai                                  | ✅ 1-to-1 mapping              | —                            | `ActivityFormPage.tsx`                                                         |
| 7   | Audit trail publik          | `GET /api/public/kegiatan/:id/audit-trail`                     | ❌ belum ada                                     | ✅                             | `mock_public_audit_trail`    | `PublicActivityPage.tsx`, `mockPublicAuditTrail.ts`                            |

---

## 🧩 Detail per Fitur

### 1. Hapus Dokumen dari Kegiatan

**Frontend mock:**

- `localStorage key: kegiatan_mock_{id}_deleted` — array of `lampiranId` yg dihapus user
- Disimpan di **semua** path (API sukses + mock fallback) — fix Iterasi 3
- `ActivityDetailPage.tsx` baca key ini & filter dokumen dari tampilan

**Saat integrasi BE:**

1. Backend harus proses field `deleted_lampiran_ids` di `PUT /api/dosen/kegiatan/:id`
2. Di `ActivityFormPage.tsx`:
   - Hapus `localStorage.setItem(LS_PREFIX + id + '_deleted', ...)` di path API sukses (line 371)
   - Hapus `saveToLocalStorage` mock fallback (catch block line 382-395)
   - Hapus filter `_deleted` dari `fetchActivityForEdit` (lines 276-283)
3. Di `ActivityDetailPage.tsx`:
   - Hapus filter `_deleted` dari `fetchActivityDetail` (lines 296-308)

---

### 2. Highlight Filter per User

**Frontend mock:** Filter client-side di `DocumentPreviewPage.tsx` `loadHighlights`:

```ts
result.highlights.filter((hl) => hl.kepemilikan_id === myKepemilikanId);
```

**Saat integrasi BE:**

1. `HighlightService.getHighlightsByDocumentAndDosen` harus filter per `kepemilikanId`
2. Endpoint harus return `kepemilikanId` dalam response
3. Hapus client-side filter di `DocumentPreviewPage.tsx`

---

### 3. Rekap Kajur Include Kaprodi

**Frontend mock:**

- `listRekap(true)`: fetch 2 endpoint paralel (`Promise.allSettled`)
- Jika prodi endpoint gagal (fulfilled tapi error ATAU rejected), include dari `mock_all_rekap`
- `createRekap`: simpan ke `mock_all_rekap` setiap kali bikin rekap baru
- `deleteRekap`: hapus dari `mock_all_rekap`

**Saat integrasi BE:**

1. Backend harus sediakan endpoint yg return rekap jurusan + prodi dalam satu panggilan
   - Opsi A: `GET /api/dosen/akademik-role/jurusan/rekap` diubah query-nya include rekap prodi
   - Opsi B: Endpoint khusus `GET /api/dosen/akademik-role/kajur/rekap/semua`
2. Di `rekapStorage.ts`:
   - Hapus semua `localStorage.getItem/setItem` dengan prefix `mock_`
   - Hapus `listRekap(true)` yang merge 2 endpoint — ganti panggil endpoint baru
   - Hapus `createRekap` yang simpan ke `mock_all_rekap`

---

### 4. Satu Dokumen Satu Kegiatan

**Frontend mock:** `dokumenKegiatanMap.ts` — localStorage key `dokumen_kegiatan_map`

- `linkDokumen(dokumenId, kegiatanId, nama)` — binding
- `unlinkDokumen(dokumenId)` — hapus binding
- `unlinkKegiatan(kegiatanId)` — hapus semua binding kegiatan
- `getDokumenStatus(dokumenId, currentKegiatanId?)` — cek available

**Saat integrasi BE:**

1. Backend harus validasi di `POST` dan `PUT /api/dosen/kegiatan`:
   - Cek dokumen belum terikat ke kegiatan lain
2. Hapus file `client/src/lib/dokumenKegiatanMap.ts`
3. Di `ActivityFormPage.tsx`:
   - Hapus import & panggilan `linkDokumen`, `unlinkDokumen`, `unlinkKegiatan`
4. Di `ActivityDetailPage.tsx`:
   - Hapus import & panggilan `unlinkKegiatan`

---

### 5. Jenis Dokumen Dinamis (TU)

**Frontend mock:**

- `utils.ts`:
  - `DEFAULT_JENIS_DOKUMEN` — 8 jenis default hardcoded
  - `getAllJenisDokumen()` — gabung default + `tu_jenis_tambahan` dari localStorage
  - `tambahJenisDokumen(nama)` — simpan ke localStorage
- `DocumentDistributionPage.tsx`: upload dialog — opsi `__TAMBAH__` + inline input
- `DocumentDistributionEditPage.tsx`: edit form — opsi `__TAMBAH__` + inline input

**Saat integrasi BE:**

1. Buat tabel `jenis_dokumen` di Prisma:

```prisma
model JenisDokumen {
  id        String   @id @default(cuid())
  nama      String   @unique
  createdAt DateTime @default(now())
}
```

2. Buat endpoint:
   - `GET /api/jenis-dokumen` — daftar semua jenis (default + custom)
   - `POST /api/tatausaha/jenis-dokumen` — tambah jenis baru (by staf_tu)
3. Di `utils.ts`:
   - Hapus `getAllJenisDokumen()`, `tambahJenisDokumen()`, `DEFAULT_JENIS_DOKUMEN`
   - Ganti dengan fetch ke `GET /api/jenis-dokumen`
4. Di `DocumentDistributionPage.tsx` & `DocumentDistributionEditPage.tsx`:
   - Hapus localStorage fallback

---

## ✅ Checklist Migrasi (Urutan Pengerjaan)

Setelah backend selesai implementasi, kerjakan ini secara urut:

### 🔴 Prioritas 1 (Core flow — kegiatan & dokumen)

- [ ] Backend: proses `deleted_lampiran_ids` di `PUT /api/dosen/kegiatan/:id`
- [ ] Frontend: hapus localStorage `kegiatan_mock_{id}_deleted` di `ActivityFormPage.tsx` & `ActivityDetailPage.tsx`
- [ ] Backend: validasi binding dokumen↔kegiatan (satu dokumen satu kegiatan)
- [ ] Frontend: hapus `dokumenKegiatanMap.ts` & semua importnya

### 🟡 Prioritas 2 (Rekap & monitoring)

- [ ] Backend: endpoint rekap kajur include prodi
- [ ] Frontend: refactor `rekapStorage.ts` — hapus mock & merge 2 endpoint
- [ ] Backend: `HighlightService` filter per kepemilikan
- [ ] Frontend: hapus client-side filter highlight

### 🟢 Prioritas 3 (Public & tambahan)

- [ ] Backend: `GET /api/public/kegiatan/:id/audit-trail`
- [ ] Backend: tabel `jenis_dokumen` + endpoint CRUD
- [ ] Frontend: refactor `utils.ts` + DocumentDistributionPage + DocumentDistributionEditPage
- [ ] Testing: hapus semua localStorage mock, test semua flow

---

## 📝 Catatan

- Semua endpoint yg belum implementasi BE → pakai localStorage mock di frontend
- Jangan lupa hapus file `client/src/mocks/mockPublicAuditTrail.ts` setelah integrasi
- AuthContext.tsx udah handle migrasi roles dari JWT (fix Iterasi 3):
  - Kalo user login lama tanpa roles, bakal di-rederive otomatis
  - Akses `decoded.jabatan?.is_kajur` bukan `decoded.is_kajur` — karena JWT server nested: `{ role, jabatan: { is_kajur, is_kaprodi } }`

# ===================================

# ===================================

# ===================================

# ===================================

# ===================================

# Backend Requirements — Fix Cancel Button di Form Edit Kegiatan

## Latar Belakang

Bug: Tombol "Batal" di form edit kegiatan tetap menyimpan perubahan (khususnya penghapusan dokumen) karena DELETE lampiran dipanggil langsung dari frontend saat user mengkonfirmasi hapus dokumen, bukan saat "Simpan".

## Solusi: Backend + Frontend

**Pendekatan:** Defer penghapusan lampiran ke waktu "Simpan" dengan mengirim `deleted_lampiran_ids` dari frontend ke backend di dalam payload PUT `/api/dosen/kegiatan/:id`.

Frontend sudah diubah. Berikut kebutuhan untuk backend:

---

## Perubahan yang Diperlukan

### 1. Server — `ActivityService.ts` — method `updateActivity`

**File:** `server/src/services/ActivityService.ts`

**Apa yang berubah:**

Sekarang backend perlu menerima field `deleted_lampiran_ids` (opsional, array of strings — UUID dari `lampiran_bukti.id`) di request body `PUT /api/dosen/kegiatan/:id`.

**Logika yang perlu ditambahkan** (setelah handle anggota, sebelum atau bersamaan dengan handle lampiran):

```typescript
// Hapus lampiran yang di-delete oleh user
if (data.deleted_lampiran_ids && Array.isArray(data.deleted_lampiran_ids)) {
  for (const lampiranId of data.deleted_lampiran_ids) {
    // Validasi: hanya boleh hapus milik sendiri (sama seperti di deleteLampiran)
    const lampiran = activity.lampiran_bukti.find(
      (lb: any) => lb.id === lampiranId
    );
    if (!lampiran) continue;

    const isUploader = lampiran.dokumen.kepemilikan.some(
      (k: any) => k.dosen_id === dosenId
    );
    if (!isUploader) continue; // skip jika bukan uploader

    await this.activityRepository.deleteLampiran(lampiranId);
  }
}
```

**Penting:**

- Tetap jaga validasi bahwa hanya uploader yang bisa hapus lampiran-nya (sama seperti di `deleteLampiran`)
- Letakkan kode ini **setelah validasi authorization** dan **sebelum blockchain publish**
- Jangan hapus method `deleteLampiran` yang lama (masih dipakai untuk direct DELETE endpoint)

### 2. Tidak ada perubahan di Controller atau Routes

Controller dan routes tidak perlu diubah karena `deleted_lampiran_ids` diterima sebagai bagian dari `req.body` di handler `updateActivity` yang sudah ada.

### 3. Tidak ada perubahan di Repository

Method `deleteLampiran` sudah tersedia di `ActivityRepository.ts`.

---

## Urutan Eksekusi di `updateActivity` (setelah perubahan)

1. Validasi UUID & authorization
2. Update metadata kegiatan (seperti biasa)
3. Handle anggota — add new members (seperti biasa)
4. **Handle deleted_lampiran_ids — hapus lampiran yang di-remove user**
5. Handle lampiran_ids — add new attachments (seperti biasa)
6. Publish ke blockchain
7. Update tx_id
8. Notify invited members

---

## Testing

1. Buka form edit kegiatan
2. Hapus salah satu dokumen bukti
3. Klik "Batal" → redirect ke detail kegiatan, dokumen **tidak** terhapus
4. Klik "Simpan" → dokumen **benar-benar** terhapus

---

# Backend Requirements — Validasi Edit Akun (NIP/NIDN)

## Latar Belakang

Frontend sudah diupdate untuk:

- Menampilkan role sebagai **read-only** di edit dialog (role tidak bisa diubah)
- Menampilkan field **NIP hanya untuk role Dosen & Staff Tata Usaha**
- Menampilkan field **NIDN hanya untuk role Dosen**
- Validasi: NIP wajib (Dosen & Staff TU), NIDN wajib (Dosen)

**Saat ini frontend menggunakan mock mode** (`localStorage.setItem('VITE_MOCK_API', 'true')`) untuk testing tanpa backend. Semua kode mock (cek `VITE_MOCK_API` dan `MOCK_ACCOUNTS`) harus dihapus setelah backend selesai.

## Perubahan yang Diperlukan

### 1. Server — `AdminUserService.ts` — method `updateUser`

**File:** `server/src/services/AdminUserService.ts`

**Apa yang berubah:**

Backend perlu menambahkan validasi NIP dan NIDN di method `updateUser()` (line 121-170).

**Validasi yang ditambahkan** (setelah line 139, sebelum update email):

```typescript
// Validasi NIP — wajib untuk DOSEN dan TATA_USAHA
if (existing.role === "TATA_USAHA" && (!nip || !nip.trim())) {
  throw new Error("NIP wajib diisi untuk Tata Usaha.");
}
if (existing.role === "DOSEN" && (!nip || !nip.trim())) {
  throw new Error("NIP wajib diisi untuk Dosen.");
}
// Validasi NIDN — wajib untuk DOSEN
if (existing.role === "DOSEN" && (!nidn || !nidn.trim())) {
  throw new Error("NIDN wajib diisi untuk Dosen.");
}
```

> **Catatan:** Karena role sudah read-only di frontend, role tidak akan berubah saat edit. Validasi menggunakan `existing.role` sudah aman.

### 2. Perubahan setelah validasi — NIP/NIDN update logic

Saat ini (line 152-153):

```typescript
if (nip) profileData.nip = nip;
if (nidn) profileData.nidn = nidn;
```

Karena frontend sudah validasi NIP/NIDN tidak boleh kosong, code ini sudah aman. **Tidak perlu diubah.** Jika suatu saat NIDN boleh dikosongkan, ubah menjadi:

```typescript
if (data.hasOwnProperty("nidn")) profileData.nidn = nidn || null;
```

### 3. Tidak ada perubahan di Controller/Routes

Controller dan routes tidak perlu diubah. Payload sudah dikirim sebagai `req.body` di handler `updateUser` yang sudah ada.

### 4. Bersihkan Mock Mode di Frontend

Setelah backend selesai, cari dan hapus semua kode terkait di `ManageAccountsPage.tsx`:

| Yang dicari                                  | Kegunaan           | Aksi                                 |
| -------------------------------------------- | ------------------ | ------------------------------------ |
| `localStorage.getItem('VITE_MOCK_API')`      | Cek mock mode      | Hapus seluruh block `if (MOCK_MODE)` |
| `localStorage.getItem('MOCK_ACCOUNTS')`      | Baca data mock     | Hapus                                |
| `localStorage.setItem('MOCK_ACCOUNTS', ...)` | Simpan data mock   | Hapus                                |
| Seed data (5 akun sample)                    | Fallback data mock | Hapus                                |

Tersisa di 2 tempat:

- `fetchUsers()` — block mock
- `confirmSubmitEdit()` — block mock

## Testing

### Frontend (Mock Mode):

1. Buka console browser → `localStorage.setItem('VITE_MOCK_API', 'true')`
2. Refresh → 5 akun seed muncul
3. Edit Dosen → kosongkan NIP → error "NIP wajib diisi"
4. Edit Dosen → kosongkan NIDN → error "NIDN wajib diisi"
5. Edit Staff TU → NIP wajib, NIDN tidak muncul
6. Edit Administrator → NIP & NIDN tidak muncul

### Real (setelah backend selesai):

1. Hapus mock: `localStorage.removeItem('VITE_MOCK_API')`
2. Login sebagai admin, buka Manajemen Akun
3. Edit Dosen → NIP & NIDN wajib
4. Edit Staff TU → NIP wajib
5. Edit Administrator → NIP & NIDN tidak muncul
6. Coba kirim PATCH tanpa NIP via Postman → dapat error 400 "NIP wajib diisi"

---

# Backend Requirements — Validasi Password (OWASP 2023 & NIST SP 800-63B)

## Latar Belakang

Frontend sudah diupdate dengan validasi password:

- Add dialog: password wajib, minimal 8 karakter
- Edit dialog: password opsional, jika diisi minimal 8 karakter

**Standar:** OWASP 2023 & NIST SP 800-63B — minimal 8 karakter, tanpa aturan kompleksitas (tidak wajib angka/huruf besar/simbol).

**Perubahan di frontend:** `ManageAccountsPage.tsx` — state `passwordError`, validasi di `handleSubmitAdd` & `handleSubmitEdit`, inline error.

## Perubahan yang Diperlukan

### 1. Server — `AdminUserService.ts` — method `createUser`

**Lokasi:** Setelah line 64 (`throw new Error('email, password, role, dan nama wajib diisi.')`)

**Tambahkan:**

```typescript
if (password.length < 8) {
  throw new Error("Password minimal 8 karakter");
}
```

### 2. Server — `AdminUserService.ts` — method `updateUser`

**Lokasi:** Di dalam block `if (password)` — sebelum hash (line 148)

**Tambahkan:**

```typescript
if (password.length < 8) {
  throw new Error("Password minimal 8 karakter");
}
```

### 3. Bersihkan Mock Mode (sama seperti task sebelumnya)

Cari & hapus semua kode `VITE_MOCK_API` dan `MOCK_ACCOUNTS` di `ManageAccountsPage.tsx` setelah backend siap.

## Testing

1. Register user via API dengan password "abc1234" (7 karakter) → error 400 "Password minimal 8 karakter"
2. Register user via API dengan password "abcdefgh" (8 karakter) → sukses
3. Update user via PATCH dengan password "short" → error 400
4. Update user via PATCH tanpa password → sukses (tidak ganti password)
