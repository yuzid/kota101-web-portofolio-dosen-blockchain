# Logbook Pengembangan — v4

---

## Task: Fix Cancel Button di Form Edit Kegiatan

| Tanggal | Waktu | Status |
|---------|-------|--------|
| 26 Juni 2026 | 18:32 WIB | Selesai |

---

### Analisis Masalah

**Bug:** Saat user di form edit kegiatan (`/activities/:id/edit`), menghapus dokumen bukti, lalu klik "Batal", sistem tetap menghapus dokumen tersebut dari database.

**Root Cause:**
1. **Premature server-side mutation** — Fungsi `confirmRemoveDoc` di `ActivityFormPage.tsx` langsung memanggil `DELETE /api/dosen/kegiatan/:id/lampiran/:lampiranId` saat user mengkonfirmasi hapus dokumen, bukan saat klik "Simpan".
2. **Navigasi "Batal" salah** — `navigate("/activities")` seharusnya `navigate(\`/activities/${id}\`)` (ke detail, bukan daftar).

**Alur masalah:**
1. User klik hapus dokumen → `confirmRemoveDoc` → `DELETE` API langsung terpanggil → database terhapus
2. User klik "Batal" → navigasi ke daftar kegiatan
3. Data di database sudah terhapus permanen, tidak bisa di-undo

---

### Solusi

**Pendekatan: Backend + Frontend** — Defer penghapusan dokumen ke waktu "Simpan".

**Prinsip:** Semua perubahan (metadata + dokumen) hanya di-commit saat user klik "Simpan". Klik "Batal" cukup navigasi ke detail kegiatan tanpa efek samping.

#### Cara Kerja

1. User hapus dokumen → `confirmRemoveDoc` **hanya update local state** (hapus dari array `lampiran` + catat `lampiranId` ke `deletedLampiranIds`)
2. User klik "Batal" → `navigate(\`/activities/${id}\`)` → component unmount, local state hilang, **server tidak tersentuh**
3. User klik "Simpan" → `confirmSubmit` kirim `PUT` dengan field `deleted_lampiran_ids` → **backend** hapus lampiran tersebut

---

### Perubahan yang Dilakukan

#### Frontend — `client/src/pages/ActivityFormPage.tsx`

| # | Perubahan | Detail |
|---|-----------|--------|
| 1 | **Tambah state** `deletedLampiranIds` | `useState<string[]>([])` — track lampiranId yang dihapus user |
| 2 | **Ubah `confirmRemoveDoc`** | Hapus panggilan `fetch(DELETE)`, ganti dengan push ke `deletedLampiranIds` + remove dari local `lampiran` state |
| 3 | **Ubah `confirmSubmit`** | Tambah `deleted_lampiran_ids: deletedLampiranIds` di payload PUT. Reset `deletedLampiranIds` setelah sukses simpan |
| 4 | **Ubah tombol "Batal"** | `navigate("/activities")` → `navigate(isEdit ? \`/activities/${id}\` : "/activities")` |
| 5 | **Tambah localStorage mock** | Helper `saveToLocalStorage` / `loadFromLocalStorage` untuk testing tanpa backend. Fallback di `confirmSubmit` dan `fetchActivityForEdit` |

#### Backend — Belum Diimplementasi (lihat `be.md`)

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Tambah logic hapus lampiran di `updateActivity`** | `server/src/services/ActivityService.ts` |

---

### Flow Baru

```
confirmRemoveDoc:
  └→ HANYA update local state (lampiran[] + deletedLampiranIds[])
     └→ Tidak ada API call

Tombol "Batal":
  └→ navigate(`/activities/${id}`) → component unmount
     └→ Local state hilang, server tidak berubah ✅

Tombol "Simpan":
  └→ PUT /api/dosen/kegiatan/:id
     ├── metadata kegiatan
     ├── anggota_ids
     ├── lampiran_ids (dokumen yang masih ada)
     └── deleted_lampiran_ids (dokumen yang dihapus)
        └→ Backend hapus lampiran yang ada di deleted_lampiran_ids
  └→ Navigasi ke detail kegiatan ✅
```

---

### Kendala

1. **Backend belum diupdate** — Frontend sudah menggunakan `deleted_lampiran_ids` tapi backend `updateActivity` belum bisa memprosesnya. Untuk testing sementara, frontend fallback ke localStorage.
2. **Partial failure risk** — Kalau backend pakai frontend-only approach (tanpa perubahan `updateActivity`), ada risiko PUT sukses tapi DELETE gagal. Solusi: backend handle semuanya dalam satu request.

---

### Next Steps

1. **Backend dev** — Implementasi perubahan di `ActivityService.ts.updateActivity` sesuai `be.md`
2. **Testing** — Setelah backend diupdate:
   - Hapus dokumen di form edit → "Batal" → cek detail kegiatan, dokumen harus masih ada
   - Hapus dokumen di form edit → "Simpan" → cek detail kegiatan, dokumen harus sudah hilang
   - Hapus dokumen baru upload (belum punya lampiranId) → "Batal" → dokumen baru tetap ada di database tapi tidak terasosiasi dengan kegiatan (expected)
3. **Bersihkan localStorage mock** — Setelah backend berfungsi penuh, hapus fallback localStorage

---

### File yang Diubah

| File | Status |
|------|--------|
| `client/src/pages/ActivityFormPage.tsx` | ✅ Selesai |
| `server/src/services/ActivityService.ts` | ⏳ Belum (tugas backend) |
| `dok3/be.md` | ✅ Selesai (dibuat) |
| `dok3/logbook_versi4.md` | ✅ Selesai (ini) |

---

## Task: Fix Edit Akun — Validasi NIP/NIDN, Role Read-Only, Label Staff TU

| Tanggal | Waktu | Status |
|---------|-------|--------|
| 27 Juni 2026 | 11:00 WIB | Selesai (Frontend Only) |

---

### Latar Belakang

Hasil analisis backend-frontend untuk fitur Edit Dosen menemukan 4 bug:
1. **Role tidak dikirim** — Payload edit tidak menyertakan `role`, backend juga tidak memprosesnya
2. **`|| undefined` mencegah clearing field** — NIP/NIDN kosong jadi `undefined` → JSON di-skip → data lama tetap
3. **Backend ignore role** — `updateUser()` tidak destructure `role` dari `data`
4. **`if (nip)` skip falsy** — Backend skip update jika value falsy

Keputusan: **Frontend only dulu**, backend menyusul.

---

### Solusi

| # | Masalah | Keputusan |
|---|---------|-----------|
| 1 | Role bisa diubah tapi tidak berdampak | **Role read-only** di edit dialog (disabled, tampil sebagai teks) |
| 2 | NIP/NIDN tidak bisa dikosongkan | **Validasi frontend**: NIP wajib (dosen & staff tu), NIDN wajib (dosen) |
| 3 | Backend ignore role | Tidak perlu di-fix karena role sudah read-only |
| 4 | Backend skip falsy | Diakali: frontend validasi cegah empty value terkirim |

**Label:** "Admin TU" → "Staff Tata Usaha" (4 tempat)

**Mock Mode:** Frontend bisa di-test tanpa backend dengan `localStorage.setItem('VITE_MOCK_API', 'true')` di console browser. Perubahan edit disimpan ke localStorage, seed data tersedia jika API tidak merespon.

---

### Perubahan yang Dilakukan

#### Frontend — `client/src/pages/ManageAccountsPage.tsx`

| # | Perubahan | Detail |
|---|-----------|--------|
| 1 | **Label "Staff Tata Usaha"** | Ganti "Admin TU" → "Staff Tata Usaha" di `roleLabels`, filter, add dialog, edit dialog |
| 2 | **Role read-only** | Ganti `<Select>` role di edit dialog jadi `<div>` teks biasa dengan `roleLabels` |
| 3 | **NIP conditional + error** | Field NIP di edit dialog hanya muncul untuk `dosen` & `admin_tu`. Ada inline error "NIP wajib diisi" + reset error di `onChange` |
| 4 | **NIDN inline error** | Field NIDN (hanya `dosen`) tambah inline error "NIDN wajib diisi" + reset di `onChange` |
| 5 | **Validasi `handleSubmitEdit`** | Tambah pengecekan NIP (dosen/admin_tu) & NIDN (dosen) sebelum submit. Jika kosong → set error state + return |
| 6 | **Fix `\|\| undefined`** | `formData.nip \|\| undefined` → `formData.nip`, `nidn` juga |
| 7 | **State `nipError` & `nidnError`** | `useState<string>('')` |
| 8 | **LocalStorage mock** | `confirmSubmitEdit`: jika `VITE_MOCK_API === 'true'`, simpan ke localStorage + update state local. `fetchUsers`: dukung mock mode + seed data |

---

### Flow Baru Edit Dialog

```
Buka Edit → Role tampil sebagai teks (read-only)
         → NIP field muncul hanya utk Dosen / Staff Tata Usaha
         → NIDN field muncul hanya utk Dosen
         → User isi/edit NIP/NIDN
         → Klik Simpan:
             - Validasi: NIP wajib (dosen/staff tu), NIDN wajib (dosen)
             - Jika kosong → inline error, tidak lanjut
             - Jika lolos → submit:
                 * Mock Mode: localStorage + update local state
                 * Real: PATCH /api/admin/users/:id
```

---

### Cara Test Mock Mode

1. Buka browser console
2. Jalankan: `localStorage.setItem('VITE_MOCK_API', 'true')`
3. Refresh halaman → data seed akan muncul (5 akun sample)
4. Klik edit pada salah satu akun
5. Coba kosongkan NIP → error "NIP wajib diisi"
6. Coba kosongkan NIDN → error "NIDN wajib diisi"
7. Isi semua → Simpan → "Berhasil diperbarui (Mock Mode)"
8. Refresh halaman → perubahan tetap ada (tersimpan di localStorage)
9. Untuk kembali normal: `localStorage.removeItem('VITE_MOCK_API')` + `localStorage.removeItem('MOCK_ACCOUNTS')`

---

### Kendala

1. **Backend belum diupdate** — `AdminUserService.ts.updateUser()` belum validasi NIP/NIDN untuk edit. Untuk testing sementara, frontend punya mock mode.
2. **Mock mode hanya untuk PATCH (edit)** — CREATE user tidak perlu mock karena `confirmSubmitAdd` + backend `createUser` sudah full validasi dan berfungsi normal.

---

### Next Steps

1. **Backend dev** — Implementasi validasi NIP/NIDN di `AdminUserService.ts.updateUser()` sesuai `be.md`
2. **Testing** — Setelah backend diupdate:
   - Hapus mock mode (`VITE_MOCK_API`)
   - Test edit akun Dosen: NIP & NIDN wajib
   - Test edit akun Staff Tata Usaha: NIP wajib
   - Test edit akun Administrator: NIP & NIDN tidak muncul
3. **Bersihkan localStorage mock** — Setelah backend berfungsi, hapus semua kode terkait `VITE_MOCK_API` dan `MOCK_ACCOUNTS`

---

### File yang Diubah

| File | Status |
|------|--------|
| `client/src/pages/ManageAccountsPage.tsx` | ✅ Selesai |
| `server/src/services/AdminUserService.ts` | ⏳ Belum (tugas backend) |
| `dok3/logbook_versi4.md` | ✅ Selesai (ini) |
| `dok3/be.md` | ✅ Selesai (diupdate) |

---

## Task: Validasi Password — OWASP 2023 & NIST SP 800-63B

| Tanggal | Waktu | Status |
|---------|-------|--------|
| 27 Juni 2026 | 14:00 WIB | Selesai (Frontend Only) |

---

### Latar Belakang

Password tidak memiliki validasi sama sekali — user bisa bikin password "12" atau "a" tanpa error. Placeholder "Minimal 8 karakter" di add dialog tidak di-enforce.

**Standar yang digunakan:** OWASP 2023 & NIST SP 800-63B

| Aturan | OWASP | NIST |
|--------|-------|------|
| Minimal 8 karakter | ✅ Wajib | ✅ Wajib |
| Kombinasi huruf/angka/simbol | ❌ Tidak wajib | ❌ Tidak wajib |
| Ganti password berkala | ❌ Tidak wajib | ❌ Tidak wajib |
| Cek password bocor | ✅ Disarankan | ✅ Wajib |

**Keputusan:** Minimal 8 karakter, tanpa aturan kompleksitas.

---

### Solusi

**Frontend — `ManageAccountsPage.tsx`**

| # | Perubahan | Detail |
|---|-----------|--------|
| 1 | **State `passwordError`** | `useState<string>('')` |
| 2 | **Add dialog validasi** | `handleSubmitAdd`: jika `password.length < 8` → error "Password minimal 8 karakter" |
| 3 | **Add dialog inline error** | Di bawah field password, reset di `onChange` |
| 4 | **Edit dialog validasi** | `handleSubmitEdit`: jika password diisi (opsional) dan `length < 8` → error |
| 5 | **Edit dialog inline error** | Sama, di bawah field reset password |

### Backend — Belum Diimplementasi (lihat `be.md`)

| File | Perubahan |
|------|-----------|
| `AdminUserService.ts` — `createUser` | Validasi `password.length < 8` |
| `AdminUserService.ts` — `updateUser` | Validasi jika password diisi dan `length < 8` |

---

### Flow Validasi Password

```
Add Dialog:
  User isi password < 8 karakter → Klik Simpan
    → Inline error "Password minimal 8 karakter"
    → Tidak lanjut ke konfirmasi
  User isi password >= 8 karakter → Klik Simpan
    → Lanjut ke konfirmasi ✅

Edit Dialog:
  User kosongkan password (tidak ganti) → Klik Simpan
    → Skip validasi, lanjut ✅
  User isi password < 8 karakter → Klik Simpan
    → Inline error "Password minimal 8 karakter"
    → Tidak lanjut
  User isi password >= 8 karakter → Klik Simpan
    → Lanjut ✅
```

---

### Kendala

1. **Backend belum divalidasi** — Frontend sudah cegah, tapi jika ada yg panggil API langsung (Postman), password pendek tetap diterima.

---

### Next Steps

1. **Backend dev** — Implementasi validasi password di `AdminUserService.ts` sesuai `be.md`
2. **Testing** — Coba add akun dengan password 7 karakter → harus error. Password 8+ karakter → sukses.

---

### File yang Diubah

| File | Status |
|------|--------|
| `client/src/pages/ManageAccountsPage.tsx` | ✅ Selesai |
| `server/src/services/AdminUserService.ts` | ⏳ Belum (tugas backend) |
| `dok3/logbook_versi4.md` | ✅ Selesai (ini) |
| `dok3/be.md` | ✅ Selesai (diupdate) |

---

## Task: Reorder Add Dialog & Rename Role Keys

| Tanggal | Waktu | Status |
|---------|-------|--------|
| 27 Juni 2026 | 15:30 WIB | Selesai (Frontend Only) |

---

### Perubahan

#### A. Reorder Add Dialog

Field NIP dipindah ke bawah Role, dan dibuat **conditional** (hanya muncul untuk Dosen & Staf Tata Usaha).

```
Sebelum: Nama → Email → NIP (unconditional) → Role → ...
Sesudah: Nama → Email → Role → NIP (conditional dosen/staf_tu) → ...
```

Sehingga saat pilih "Admin", field NIP tidak muncul.

#### B. Rename Role Keys & Labels

| Backend Role | Frontend Key (lama) | Frontend Key (baru) | Label (baru) |
|-------------|-------------------|-------------------|-------------|
| `ADMIN` | `administrator` | `admin` | Admin |
| `TATA_USAHA` | `admin_tu` | `staf_tu` | Staf Tata Usaha |
| `DOSEN` | `dosen` | `dosen` | Dosen |

#### C. File Terdampak

| File | Perubahan |
|------|-----------|
| `ManageAccountsPage.tsx` | Reorder add dialog, rename role keys/labels, update `openEditDialog` mapping, seed data |
| `DashboardPage.tsx` | Update role check `'administrator'` → `'admin'`, `'admin_tu'` → `'staf_tu'` |
| `AuthContext.tsx` | Update role mapping di login |
| `TopBar.tsx` | Update role check notifikasi |
| `DocumentPreviewPage.tsx` | Update role check API prefix |
| `DocumentDistributionDetailPage.tsx` | Update label "Staff" → "Staf" |

---

### File yang Diubah

| File | Status |
|------|--------|
| `client/src/pages/ManageAccountsPage.tsx` | ✅ Selesai |
| `client/src/pages/DashboardPage.tsx` | ✅ Selesai |
| `client/src/contexts/AuthContext.tsx` | ✅ Selesai |
| `client/src/components/layout/TopBar.tsx` | ✅ Selesai |
| `client/src/pages/DocumentPreviewPage.tsx` | ✅ Selesai |
| `client/src/pages/DocumentDistributionDetailPage.tsx` | ✅ Selesai |

---

## Task: Comprehensive Role Key Cleanup — Semua File (28 Juni 2026)

| Tanggal | Waktu | Status |
|---------|-------|--------|
| 28 Juni 2026 | 09:00 WIB | Selesai |

---

### Latar Belakang

Task sebelumnya (27 Juni) hanya mengubah role keys di file yang **langsung terkait** dengan ManageAccountsPage. Masih ada 5 file lain yang masih pakai key lama `'administrator'` / `'admin_tu'`:

- `Sidebar.tsx` — 11 menu items menggunakan key lama
- `RoleSwitcher.tsx` — 6 entries di label/color/description maps
- `TopBar.tsx` — 4 entries di label/color maps
- `NotificationContext.tsx` — 1 mock notifikasi key
- `DashboardPage.tsx` — 4 properti stats variable (admin_tu → staf_tu)

**Dampak:** Sidebar kosong untuk role admin/staf_tu, RoleSwitcher & TopBar salah label, notifikasi mock tidak muncul.

---

### Perubahan yang Dilakukan

| # | File | Perubahan |
|---|------|-----------|
| 1 | **AuthContext.tsx** | `UserRole` type: `"administrator"` → `"admin"`, `"admin_tu"` → `"staf_tu"` |
| 2 | **Sidebar.tsx** | 11 `roles` array: semua `"administrator"` → `"admin"`, `"admin_tu"` → `"staf_tu"` |
| 3 | **RoleSwitcher.tsx** | 6 entries di label/color/description: key `administrator` → `admin`, `admin_tu` → `staf_tu`; label `"Administrator"` → `"Admin"`, `"Admin TU"` → `"Staf Tata Usaha"` |
| 4 | **TopBar.tsx** | 4 entries di label/color: key `administrator` → `admin`, `admin_tu` → `staf_tu`; label `'Administrator'` → `'Admin'`, `'Admin TU'` → `'Staf Tata Usaha'` |
| 5 | **NotificationContext.tsx** | Mock notifikasi key `admin_tu` → `staf_tu` |
| 6 | **DashboardPage.tsx** | Stats state property + variable: `admin_tu` → `staf_tu` (konsisten) |

### Tidak Diubah

| File | Alasan |
|------|--------|
| `LoginPage.tsx:186` | Teks "administrator sistem" untuk user, bukan role key |

---

### Verifikasi

- ✅ `grep "\"administrator\"" client/src/` — **0 hasil**
- ✅ `grep "\"admin_tu\"" client/src/` — **0 hasil**
- ✅ `grep "'administrator'" client/src/` — **0 hasil**
- ✅ `grep "'admin_tu'" client/src/` — **0 hasil**
- ✅ `grep "\"Admin TU\"" client/src/` — **0 hasil**
- ✅ `grep "\"Administrator\"" client/src/` — **0 hasil**
- ✅ Sisa: `LoginPage.tsx:186` — "administrator sistem" (dikecualikan sengaja)

---

### File yang Diubah

| File | Status |
|------|--------|
| `client/src/contexts/AuthContext.tsx` | ✅ Selesai |
| `client/src/components/layout/Sidebar.tsx` | ✅ Selesai |
| `client/src/components/layout/RoleSwitcher.tsx` | ✅ Selesai |
| `client/src/components/layout/TopBar.tsx` | ✅ Selesai |
| `client/src/contexts/NotificationContext.tsx` | ✅ Selesai |
| `client/src/pages/DashboardPage.tsx` | ✅ Selesai |
| `dok3/logbook_versi4.md` | ✅ Selesai (ini) |

---

### Next Steps

1. **Test sidebar** — Login sebagai Admin → semua menu Admin muncul. Login sebagai Staf TU → menu Beranda, Distribusi Dokumen, Notifikasi muncul.
2. **Test RoleSwitcher** — Login dengan multi-role → label & warna sesuai.
3. **Test notifikasi mock** — Login sebagai Staf TU → notifikasi mock muncul.
4. **Backend dev** — Implementasi validasi NIP/NIDN/password di `AdminUserService.ts` sesuai `be.md`.
5. **Bersihkan mock** — Setelah backend berfungsi, hapus semua kode `VITE_MOCK_API` / `MOCK_ACCOUNTS`.
