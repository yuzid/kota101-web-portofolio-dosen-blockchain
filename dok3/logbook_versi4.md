# Logbook Versi 4 — Frontend Changes

## 📊 Ringkasan Task

| Task | Fitur                                                | Status | File Utama                                                                        | Tipe    |
| ---- | ---------------------------------------------------- | ------ | --------------------------------------------------------------------------------- | ------- |
| 1A   | Tombol "Lihat Detail" di pending request dokumen     | ✅     | `DocumentsPage.tsx`                                                               | Feature |
| 1B   | Banner konfirmasi di preview dokumen                 | ✅     | `DocumentPreviewPage.tsx`                                                         | Feature |
| 1C   | Tombol "Lihat Detail" di pending konfirmasi kegiatan | ✅     | `ActivitiesPage.tsx`                                                              | Feature |
| 1D   | Banner konfirmasi di detail kegiatan                 | ✅     | `ActivityDetailPage.tsx`                                                          | Feature |
| 2    | Restruktur halaman publik kegiatan                   | ✅     | `PublicActivityPage.tsx`                                                          | Feature |
| 3    | Hapus Notification UI                                | ✅     | `TopBar.tsx`, `Sidebar.tsx`, `App.tsx`, `NotificationContext.tsx`                 | Removal |
| 4    | Hapus Riwayat Versi & Aktivitas dari preview         | ✅     | `DocumentPreviewPage.tsx`                                                         | Removal |
| 5    | Zoom controls + merged toolbar + dialog width        | ✅     | `PublicPdfPreview.tsx`, `DocumentPreviewPage.tsx`                                 | Feature |
| 6    | Hapus dokumen dari kegiatan (localStorage mock)      | ✅     | `ActivityFormPage.tsx`, `ActivityDetailPage.tsx`                                  | Feature |
| 7    | Satu dokumen satu kegiatan                           | ✅     | `dokumenKegiatanMap.ts`, `ActivityFormPage.tsx`, `ActivityDetailPage.tsx`         | Feature |
| 8    | Rekap kajur include kaprodi                          | ✅     | `rekapStorage.ts`                                                                 | Feature |
| 9    | TU tambah jenis dokumen                              | ✅     | `utils.ts`, `DocumentDistributionPage.tsx`, `DocumentDistributionEditPage.tsx`    | Feature |
| 10   | Kategori kegiatan mapping enum 1-to-1                | ✅     | `ActivityFormPage.tsx`                                                            | Fix     |
| 11a  | Filter highlight per user                            | ✅     | `DocumentPreviewPage.tsx`                                                         | Feature |
| 11b  | Peringatan DOCX + posisi toast                       | ✅     | `ActivityFormPage.tsx`, `DocumentsPage.tsx`, `DocumentPreviewPage.tsx`, `App.tsx` | Feature |

---

## 📝 Detail per Task

### Task 1A — Tombol "Lihat Detail" di Pending Request Dokumen

**File:** `client/src/pages/DocumentsPage.tsx`

**Perubahan:**

- Tambah "Lihat Detail" button (Eye icon) sebelum Terima/Tolak di setiap pending request card
- Navigasi ke `/documents/${dokumenId}/preview` dengan state `{ fromPendingRequest: true }`

---

### Task 1B — Banner Konfirmasi di Preview Dokumen

**File:** `client/src/pages/DocumentPreviewPage.tsx`

**Perubahan:**

- Cek `fromPendingRequest` dari `location.state`
- `isConfirming` state + `handleConfirmAccept` / `handleConfirmReject`
- Banner dengan Terima/Tolak (muncul setelah metadata grid, sebelum integrity section)
- Sukses → navigasi balik ke `/documents`

---

### Task 1C — Tombol "Lihat Detail" di Pending Konfirmasi Kegiatan

**File:** `client/src/pages/ActivitiesPage.tsx`

**Perubahan:**

- "Lihat Detail" button (Eye icon) sebelum Terima/Tolak
- Navigasi ke `/activities/${kegiatanId}` dengan state `{ fromPendingConfirmation: true, partisipasiId }`

---

### Task 1D — Banner Konfirmasi di Detail Kegiatan

**File:** `client/src/pages/ActivityDetailPage.tsx`

**Perubahan:**

- Cek `fromPendingConfirmation`, `partisipasiId` dari `location.state`
- `isConfirming` state + `handleConfirmAccept`/`handleConfirmReject`
- Banner dengan Terima/Tolak (setelah share dialog, sebelum hero card)

---

### Task 2 — Restruktur PublicActivityPage

**File:** `client/src/pages/PublicActivityPage.tsx`

**Perubahan besar:**

- Layout: 1 full-width info card → 2-column grid (3:2 ratio)
- Kiri (col-span-2): Dosen Terlibat + Dokumen Bersama
- Kanan (col-span-1, sticky): Riwayat Blockchain (timeline)
- Doc preview: Dialog (bukan expand inline)
- Audit trail: localStorage mock (`mock_public_audit_trail`)
- Fitur baru: timeline riwayat blockchain + dialog detail perubahan

---

### Task 3 — Hapus Notification UI

**File dihapus:**

- `client/src/components/layout/NotificationBell.tsx`
- `client/src/pages/NotificationsPage.tsx`

**File diubah:**

- `TopBar.tsx` — hapus `NotificationBell`
- `Sidebar.tsx` — hapus "Notifikasi" nav item
- `App.tsx` — hapus route `/notifications`
- `NotificationContext.tsx` — simplify ke email preference only

---

### Task 4 — Hapus Riwayat Versi & Aktivitas

**File:** `client/src/pages/DocumentPreviewPage.tsx`

**Perubahan:**

- Hapus imports: `History`, `Clock`, `Upload` (icons), `FileVersionHistory`, `Tabs`
- Hapus `mockVersions`, `mockActivities`, `activeTab` state
- Hapus seluruh `<Tabs>` wrapper — content sekarang langsung di-render

---

### Task 5 — Zoom Controls + Merged Toolbar

**File:** `client/src/components/public/PublicPdfPreview.tsx`, `client/src/pages/DocumentPreviewPage.tsx`

**Perubahan:**

- `zoom` state (0.25–3, step 0.25) + `ZOOM_LEVELS` constant
- Toolbar: `[-] [Select 50%–200%] [+]` merged dalam 1 baris dengan page nav
- `width` di-multiply dengan zoom
- `HighlightOverlay` pageWidth/pageHeight juga dikali zoom
- Preview dialog: `max-w-4xl` → `!max-w-[95vw]`

---

### Task 6 — Hapus Dokumen dari Kegiatan (localStorage Mock)

**File:** `client/src/pages/ActivityFormPage.tsx`, `client/src/pages/ActivityDetailPage.tsx`

**Cara kerja:**

- `deletedLampiranIds` state — kumpulkan `lampiranId` yg dihapus
- `confirmRemoveDoc()` → set `deletedLampiranIds` + `unlinkDokumen()`
- `confirmSubmit()` → kirim `deleted_lampiran_ids` ke API + persist ke localStorage `kegiatan_mock_{id}_deleted`
- `ActivityDetailPage.fetchActivityDetail()` → filter dokumen berdasarkan `_deleted`

**Fix (Iterasi 3):** Pada path API sukses, `_deleted` dulu dihapus (`removeItem`). Sekarang di-persist di semua path (API sukses + mock) biar detail page tetap filter dengan benar.

---

### Task 7 — Satu Dokumen Satu Kegiatan

**File baru:** `client/src/lib/dokumenKegiatanMap.ts`

Helper localStorage (`dokumen_kegiatan_map`):

- `getMap()` — baca semua binding
- `linkDokumen(dokumenId, kegiatanId, nama)` — binding
- `unlinkDokumen(dokumenId)` — hapus binding
- `unlinkKegiatan(kegiatanId)` — hapus semua binding kegiatan
- `getDokumenStatus(dokumenId, currentKegiatanId?)` — cek available

**File diubah:** `client/src/pages/ActivityFormPage.tsx`

**Perubahan:**

- `handleAddDoc`: cek `getDokumenStatus`, tolak jika sudah terikat
- `confirmRemoveDoc`: panggil `unlinkDokumen`
- `handleDelete`: panggil `unlinkKegiatan`
- `confirmSubmit`: panggil `linkDokumen` untuk setiap dokumen user
- Doc picker: badge "Terpakai di {kegiatan}" untuk dokumen terikat

**Fix (Iterasi 3):**

- **7b:** Inner div doc picker dikasih `max-h-[calc(80vh-120px)]` biar scroll aktif
- **7c:** `ActivityDetailPage.confirmDelete()` ditambah `unlinkKegiatan(id)` — sebelumnya cuma ada di `ActivityFormPage.handleDelete()`

---

### Task 8 — Rekap Kajur Include Kaprodi

**File:** `client/src/lib/rekapStorage.ts`

**Perubahan:**

- `createRekap`: simpan ke localStorage `mock_all_rekap`
- `listRekap(true)` (kajur): fetch `jurusan/rekap` + `prodi/rekap` paralel (`Promise.allSettled`), merge, sort by createdAt
- `listRekap(false)` (kaprodi): fetch `prodi/rekap` saja
- `deleteRekap`: cleanup `mock_all_rekap`

**Fix (Iterasi 3):** Logika fallback mock diubah — sebelumnya mock cuma di-include kalo `prodiRes.status === 'rejected'`. Sekarang pake flag `prodiSuccess`, mock di-include kalo prodi endpoint return error dalam bentuk apapun (fulfilled tapi non-success ATAU rejected).

---

### Task 9 — TU Tambah Jenis Dokumen Baru

**File:** `client/src/lib/utils.ts`

- `DEFAULT_JENIS_DOKUMEN` (8 jenis)
- `getAllJenisDokumen()`: gabung default + `tu_jenis_tambahan` dari localStorage
- `tambahJenisDokumen(nama)`: simpan ke localStorage

**File:** `client/src/pages/DocumentDistributionPage.tsx`

- Opsi `__TAMBAH__` di Select upload dialog
- Inline input field + tombol "Tambah"

**File:** `client/src/pages/DocumentDistributionEditPage.tsx`

- Opsi `__TAMBAH__` di Select edit form
- Inline input field + tombol "Tambah"

**Tidak ada** di `DocumentsPage.tsx` dan `DocumentPreviewPage.tsx` (direvert) — fitur hanya di halaman Distibusi Dokumen (TU-specific).

**Fix (Iterasi 3):** AuthContext.tsx — saat load user dari localStorage, re-derive `roles` dari JWT jika kosong (migrasi data user lama).

---

### Task 10 — Kategori Kegiatan Mapping Enum 1-to-1

**File:** `client/src/pages/ActivityFormPage.tsx`

**Perubahan:**

- Hapus `enumKategoriToLabel` (mapping lama)
- `kategoriByJenis` berubah dari `string[]` → `{ label, value }[]` (1-to-1 dengan DB enum)
- 12 nilai enum: Pengajaran, Bahan Ajar, Bimbingan Mahasiswa, Pembinaan Mahasiswa, Pengujian Mahasiswa, Penelitian, Publikasi Karya Ilmiah, Paten/HKI, Pengelola Jurnal, Pengabdian Masyarakat, Pembicara/Narasumber, Tugas Tambahan
- `fetchActivityForEdit`: langsung pakai `act.kategori`

---

### Task 11a — Filter Highlight per User

**File:** `client/src/pages/DocumentPreviewPage.tsx`

**Perubahan:**

- `loadHighlights`: filter client-side — hanya tampilkan `hl.kepemilikan_id === result.kepemilikanId`

---

### Task 11b — Peringatan DOCX + Posisi Toast

**File:** `ActivityFormPage.tsx`, `DocumentsPage.tsx`, `DocumentPreviewPage.tsx`, `App.tsx`

**Perubahan:**

- Ganti `toast.info('File DOCX...')` dengan inline alert amber di masing-masing form
- `ActivityFormPage`: state `docxWarnings[]`
- `DocumentsPage`: state `docxWarning`
- `DocumentPreviewPage`: state `docxWarning`
- `App.tsx`: `<Toaster position="top-right" />` (biar ga di pojok kanan bawah)

---

## 🔧 Fixes per Iterasi

### Iterasi 2 (yang udah ada sebelumnya)

- Task 6: Filter `_deleted` di ActivityDetailPage (client-side mock)
- Task 7a: Badge "Terpakai" pindah ke baris baru di bawah nama
- Task 7b: Dialog doc picker dikasih `max-h-[80vh]` + `overflow-y-auto`
- Task 7c: `handleDelete` di ActivityFormPage — mock fallback + `unlinkKegiatan`
- Task 8: Mock fallback `prodiRes.status === 'rejected'`
- Task 9: Inline input (ganti prompt) di DocumentPreviewPage
- Task 11b: DOCX warning ganti toast → inline alert

### Iterasi 3 (barusan dikerjain)

- Task 6: `_deleted` persist di API success path (bukan cuma mock)
- Task 7b: `max-h-[calc(80vh-120px)]` di inner div doc picker
- Task 7c: `unlinkKegiatan` di `ActivityDetailPage.confirmDelete`
- Task 8: flag `prodiSuccess` — mock include kalo prodi endpoint error apapun
- Task 8 UI: "Dibuat Oleh" cuma role (Kajur/Kaprodi), tanpa nama jurusan/prodi
- Task 9: **Pindah** fitur dari `DocumentsPage.tsx` + `DocumentPreviewPage.tsx` → `DocumentDistributionPage.tsx` + `DocumentDistributionEditPage.tsx`
- Task 9: Hapus `isStafTu` fallback (ga perlu role check di halaman TU-specific)
- Task 9: AuthContext re-derive roles dari JWT
- Task 9: **Fix AuthContext** `decoded.is_kajur` → `decoded.jabatan?.is_kajur` (karena JWT server nested)
- Task 11b: `<Toaster position="top-right" />`
- **Hapus fitur Simpan Draft** di `DocumentDistributionPage.tsx`:
  - Hapus `LocalDraft` interface, draft storage functions, draft merge logic
  - Hapus `submitAction`, draft button, draft stat card, draft filter
  - Sederhanakan jadi cuma tombol "Upload" (tanpa "Simpan Draft" + "Upload & Distribusikan")
  - Toast: "Dokumen berhasil didistribusikan!" tetap muncul biar user tau otomatis terdistribusi

# ===================================

# ===================================

# ===================================

# ===================================

# ===================================

# Logbook Pengembangan — v4

---

## Task: Fix Cancel Button di Form Edit Kegiatan

| Tanggal      | Waktu     | Status  |
| ------------ | --------- | ------- |
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

| #   | Perubahan                             | Detail                                                                                                                                   |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Tambah state** `deletedLampiranIds` | `useState<string[]>([])` — track lampiranId yang dihapus user                                                                            |
| 2   | **Ubah `confirmRemoveDoc`**           | Hapus panggilan `fetch(DELETE)`, ganti dengan push ke `deletedLampiranIds` + remove dari local `lampiran` state                          |
| 3   | **Ubah `confirmSubmit`**              | Tambah `deleted_lampiran_ids: deletedLampiranIds` di payload PUT. Reset `deletedLampiranIds` setelah sukses simpan                       |
| 4   | **Ubah tombol "Batal"**               | `navigate("/activities")` → `navigate(isEdit ? \`/activities/${id}\` : "/activities")`                                                   |
| 5   | **Tambah localStorage mock**          | Helper `saveToLocalStorage` / `loadFromLocalStorage` untuk testing tanpa backend. Fallback di `confirmSubmit` dan `fetchActivityForEdit` |

#### Backend — Belum Diimplementasi (lihat `be.md`)

| #   | Perubahan                                           | File                                     |
| --- | --------------------------------------------------- | ---------------------------------------- |
| 1   | **Tambah logic hapus lampiran di `updateActivity`** | `server/src/services/ActivityService.ts` |

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

| File                                     | Status                   |
| ---------------------------------------- | ------------------------ |
| `client/src/pages/ActivityFormPage.tsx`  | ✅ Selesai               |
| `server/src/services/ActivityService.ts` | ⏳ Belum (tugas backend) |
| `dok3/be.md`                             | ✅ Selesai (dibuat)      |
| `dok3/logbook_versi4.md`                 | ✅ Selesai (ini)         |

---

## Task: Fix Edit Akun — Validasi NIP/NIDN, Role Read-Only, Label Staff TU

| Tanggal      | Waktu     | Status                  |
| ------------ | --------- | ----------------------- |
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

| #   | Masalah                               | Keputusan                                                               |
| --- | ------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Role bisa diubah tapi tidak berdampak | **Role read-only** di edit dialog (disabled, tampil sebagai teks)       |
| 2   | NIP/NIDN tidak bisa dikosongkan       | **Validasi frontend**: NIP wajib (dosen & staff tu), NIDN wajib (dosen) |
| 3   | Backend ignore role                   | Tidak perlu di-fix karena role sudah read-only                          |
| 4   | Backend skip falsy                    | Diakali: frontend validasi cegah empty value terkirim                   |

**Label:** "Admin TU" → "Staff Tata Usaha" (4 tempat)

**Mock Mode:** Frontend bisa di-test tanpa backend dengan `localStorage.setItem('VITE_MOCK_API', 'true')` di console browser. Perubahan edit disimpan ke localStorage, seed data tersedia jika API tidak merespon.

---

### Perubahan yang Dilakukan

#### Frontend — `client/src/pages/ManageAccountsPage.tsx`

| #   | Perubahan                          | Detail                                                                                                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Label "Staff Tata Usaha"**       | Ganti "Admin TU" → "Staff Tata Usaha" di `roleLabels`, filter, add dialog, edit dialog                                                        |
| 2   | **Role read-only**                 | Ganti `<Select>` role di edit dialog jadi `<div>` teks biasa dengan `roleLabels`                                                              |
| 3   | **NIP conditional + error**        | Field NIP di edit dialog hanya muncul untuk `dosen` & `admin_tu`. Ada inline error "NIP wajib diisi" + reset error di `onChange`              |
| 4   | **NIDN inline error**              | Field NIDN (hanya `dosen`) tambah inline error "NIDN wajib diisi" + reset di `onChange`                                                       |
| 5   | **Validasi `handleSubmitEdit`**    | Tambah pengecekan NIP (dosen/admin_tu) & NIDN (dosen) sebelum submit. Jika kosong → set error state + return                                  |
| 6   | **Fix `\|\| undefined`**           | `formData.nip \|\| undefined` → `formData.nip`, `nidn` juga                                                                                   |
| 7   | **State `nipError` & `nidnError`** | `useState<string>('')`                                                                                                                        |
| 8   | **LocalStorage mock**              | `confirmSubmitEdit`: jika `VITE_MOCK_API === 'true'`, simpan ke localStorage + update state local. `fetchUsers`: dukung mock mode + seed data |

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

| File                                      | Status                   |
| ----------------------------------------- | ------------------------ |
| `client/src/pages/ManageAccountsPage.tsx` | ✅ Selesai               |
| `server/src/services/AdminUserService.ts` | ⏳ Belum (tugas backend) |
| `dok3/logbook_versi4.md`                  | ✅ Selesai (ini)         |
| `dok3/be.md`                              | ✅ Selesai (diupdate)    |

---

## Task: Validasi Password — OWASP 2023 & NIST SP 800-63B

| Tanggal      | Waktu     | Status                  |
| ------------ | --------- | ----------------------- |
| 27 Juni 2026 | 14:00 WIB | Selesai (Frontend Only) |

---

### Latar Belakang

Password tidak memiliki validasi sama sekali — user bisa bikin password "12" atau "a" tanpa error. Placeholder "Minimal 8 karakter" di add dialog tidak di-enforce.

**Standar yang digunakan:** OWASP 2023 & NIST SP 800-63B

| Aturan                       | OWASP          | NIST           |
| ---------------------------- | -------------- | -------------- |
| Minimal 8 karakter           | ✅ Wajib       | ✅ Wajib       |
| Kombinasi huruf/angka/simbol | ❌ Tidak wajib | ❌ Tidak wajib |
| Ganti password berkala       | ❌ Tidak wajib | ❌ Tidak wajib |
| Cek password bocor           | ✅ Disarankan  | ✅ Wajib       |

**Keputusan:** Minimal 8 karakter, tanpa aturan kompleksitas.

---

### Solusi

**Frontend — `ManageAccountsPage.tsx`**

| #   | Perubahan                    | Detail                                                                              |
| --- | ---------------------------- | ----------------------------------------------------------------------------------- |
| 1   | **State `passwordError`**    | `useState<string>('')`                                                              |
| 2   | **Add dialog validasi**      | `handleSubmitAdd`: jika `password.length < 8` → error "Password minimal 8 karakter" |
| 3   | **Add dialog inline error**  | Di bawah field password, reset di `onChange`                                        |
| 4   | **Edit dialog validasi**     | `handleSubmitEdit`: jika password diisi (opsional) dan `length < 8` → error         |
| 5   | **Edit dialog inline error** | Sama, di bawah field reset password                                                 |

### Backend — Belum Diimplementasi (lihat `be.md`)

| File                                 | Perubahan                                     |
| ------------------------------------ | --------------------------------------------- |
| `AdminUserService.ts` — `createUser` | Validasi `password.length < 8`                |
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

| File                                      | Status                   |
| ----------------------------------------- | ------------------------ |
| `client/src/pages/ManageAccountsPage.tsx` | ✅ Selesai               |
| `server/src/services/AdminUserService.ts` | ⏳ Belum (tugas backend) |
| `dok3/logbook_versi4.md`                  | ✅ Selesai (ini)         |
| `dok3/be.md`                              | ✅ Selesai (diupdate)    |

---

## Task: Reorder Add Dialog & Rename Role Keys

| Tanggal      | Waktu     | Status                  |
| ------------ | --------- | ----------------------- |
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

| Backend Role | Frontend Key (lama) | Frontend Key (baru) | Label (baru)    |
| ------------ | ------------------- | ------------------- | --------------- |
| `ADMIN`      | `administrator`     | `admin`             | Admin           |
| `TATA_USAHA` | `admin_tu`          | `staf_tu`           | Staf Tata Usaha |
| `DOSEN`      | `dosen`             | `dosen`             | Dosen           |

#### C. File Terdampak

| File                                 | Perubahan                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `ManageAccountsPage.tsx`             | Reorder add dialog, rename role keys/labels, update `openEditDialog` mapping, seed data |
| `DashboardPage.tsx`                  | Update role check `'administrator'` → `'admin'`, `'admin_tu'` → `'staf_tu'`             |
| `AuthContext.tsx`                    | Update role mapping di login                                                            |
| `TopBar.tsx`                         | Update role check notifikasi                                                            |
| `DocumentPreviewPage.tsx`            | Update role check API prefix                                                            |
| `DocumentDistributionDetailPage.tsx` | Update label "Staff" → "Staf"                                                           |

---

### File yang Diubah

| File                                                  | Status     |
| ----------------------------------------------------- | ---------- |
| `client/src/pages/ManageAccountsPage.tsx`             | ✅ Selesai |
| `client/src/pages/DashboardPage.tsx`                  | ✅ Selesai |
| `client/src/contexts/AuthContext.tsx`                 | ✅ Selesai |
| `client/src/components/layout/TopBar.tsx`             | ✅ Selesai |
| `client/src/pages/DocumentPreviewPage.tsx`            | ✅ Selesai |
| `client/src/pages/DocumentDistributionDetailPage.tsx` | ✅ Selesai |

---

## Task: Comprehensive Role Key Cleanup — Semua File (28 Juni 2026)

| Tanggal      | Waktu     | Status  |
| ------------ | --------- | ------- |
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

| #   | File                        | Perubahan                                                                                                                                                            |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **AuthContext.tsx**         | `UserRole` type: `"administrator"` → `"admin"`, `"admin_tu"` → `"staf_tu"`                                                                                           |
| 2   | **Sidebar.tsx**             | 11 `roles` array: semua `"administrator"` → `"admin"`, `"admin_tu"` → `"staf_tu"`                                                                                    |
| 3   | **RoleSwitcher.tsx**        | 6 entries di label/color/description: key `administrator` → `admin`, `admin_tu` → `staf_tu`; label `"Administrator"` → `"Admin"`, `"Admin TU"` → `"Staf Tata Usaha"` |
| 4   | **TopBar.tsx**              | 4 entries di label/color: key `administrator` → `admin`, `admin_tu` → `staf_tu`; label `'Administrator'` → `'Admin'`, `'Admin TU'` → `'Staf Tata Usaha'`             |
| 5   | **NotificationContext.tsx** | Mock notifikasi key `admin_tu` → `staf_tu`                                                                                                                           |
| 6   | **DashboardPage.tsx**       | Stats state property + variable: `admin_tu` → `staf_tu` (konsisten)                                                                                                  |

### Tidak Diubah

| File                | Alasan                                                 |
| ------------------- | ------------------------------------------------------ |
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

| File                                            | Status           |
| ----------------------------------------------- | ---------------- |
| `client/src/contexts/AuthContext.tsx`           | ✅ Selesai       |
| `client/src/components/layout/Sidebar.tsx`      | ✅ Selesai       |
| `client/src/components/layout/RoleSwitcher.tsx` | ✅ Selesai       |
| `client/src/components/layout/TopBar.tsx`       | ✅ Selesai       |
| `client/src/contexts/NotificationContext.tsx`   | ✅ Selesai       |
| `client/src/pages/DashboardPage.tsx`            | ✅ Selesai       |
| `dok3/logbook_versi4.md`                        | ✅ Selesai (ini) |

---

### Next Steps

1. **Test sidebar** — Login sebagai Admin → semua menu Admin muncul. Login sebagai Staf TU → menu Beranda, Distribusi Dokumen, Notifikasi muncul.
2. **Test RoleSwitcher** — Login dengan multi-role → label & warna sesuai.
3. **Test notifikasi mock** — Login sebagai Staf TU → notifikasi mock muncul.
4. **Backend dev** — Implementasi validasi NIP/NIDN/password di `AdminUserService.ts` sesuai `be.md`.
5. **Bersihkan mock** — Setelah backend berfungsi, hapus semua kode `VITE_MOCK_API` / `MOCK_ACCOUNTS`.
