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
    const lampiran = activity.lampiran_bukti.find((lb: any) => lb.id === lampiranId);
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
if (existing.role === 'TATA_USAHA' && (!nip || !nip.trim())) {
  throw new Error('NIP wajib diisi untuk Tata Usaha.');
}
if (existing.role === 'DOSEN' && (!nip || !nip.trim())) {
  throw new Error('NIP wajib diisi untuk Dosen.');
}
// Validasi NIDN — wajib untuk DOSEN
if (existing.role === 'DOSEN' && (!nidn || !nidn.trim())) {
  throw new Error('NIDN wajib diisi untuk Dosen.');
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
if (data.hasOwnProperty('nidn')) profileData.nidn = nidn || null;
```

### 3. Tidak ada perubahan di Controller/Routes

Controller dan routes tidak perlu diubah. Payload sudah dikirim sebagai `req.body` di handler `updateUser` yang sudah ada.

### 4. Bersihkan Mock Mode di Frontend

Setelah backend selesai, cari dan hapus semua kode terkait di `ManageAccountsPage.tsx`:

| Yang dicari | Kegunaan | Aksi |
|-------------|----------|------|
| `localStorage.getItem('VITE_MOCK_API')` | Cek mock mode | Hapus seluruh block `if (MOCK_MODE)` |
| `localStorage.getItem('MOCK_ACCOUNTS')` | Baca data mock | Hapus |
| `localStorage.setItem('MOCK_ACCOUNTS', ...)` | Simpan data mock | Hapus |
| Seed data (5 akun sample) | Fallback data mock | Hapus |

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
  throw new Error('Password minimal 8 karakter');
}
```

### 2. Server — `AdminUserService.ts` — method `updateUser`

**Lokasi:** Di dalam block `if (password)` — sebelum hash (line 148)

**Tambahkan:**
```typescript
if (password.length < 8) {
  throw new Error('Password minimal 8 karakter');
}
```

### 3. Bersihkan Mock Mode (sama seperti task sebelumnya)

Cari & hapus semua kode `VITE_MOCK_API` dan `MOCK_ACCOUNTS` di `ManageAccountsPage.tsx` setelah backend siap.

## Testing

1. Register user via API dengan password "abc1234" (7 karakter) → error 400 "Password minimal 8 karakter"
2. Register user via API dengan password "abcdefgh" (8 karakter) → sukses
3. Update user via PATCH dengan password "short" → error 400
4. Update user via PATCH tanpa password → sukses (tidak ganti password)
