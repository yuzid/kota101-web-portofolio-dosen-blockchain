# Backend Requirements

## 1. Public Audit Trail Endpoint

**Endpoint:** `GET /api/public/kegiatan/:id/audit-trail`

**Purpose:** Menyediakan riwayat perubahan kegiatan untuk ditampilkan di halaman publik (PublicActivityPage).

**Response (success):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "string",
      "action": "created | updated | deleted | member_added | member_removed | dokumen_uploaded | dokumen_removed | status_changed",
      "actor": { "id": "string", "name": "string" },
      "timestamp": "ISO 8601",
      "description": "string",
      "changes": {
        "nama_kegiatan": { "old": "value", "new": "value" },
        "jenis_tridharma": { "old": "value", "new": "value" }
      },
      "collectionChanges": {
        "dosen_terlibat": {
          "added": ["item1"],
          "removed": [],
          "modified": []
        }
      }
    }
  ]
}
```

**Note:** `changes` berisi field yang berubah (key = field name, value = { old, new }).
`collectionChanges` berisi perubahan relasi (dosen_terlibat, dokumen, partisipasi).
Setiap field name di `changes` harus sesuai dengan key di `activityFieldLabels`.

**Frontend implementation saat ini:** localStorage mock dengan key `mock_public_audit_trail`, dengan fallback ke `client/src/mocks/mockPublicAuditTrail.ts` jika localStorage kosong. Ketika endpoint backend sudah siap, ganti `useEffect` di PublicActivityPage.tsx (line ~230-240) yang membaca localStorage + import mock dengan fetch ke endpoint di atas.

## 2. Confirmasi Dokumen Endpoint

**Endpoint:** `PATCH /api/dosen/dokumen/:dokumenId/terima`

**Status:** ✅ Already exists in backend

**Endpoint:** `PATCH /api/dosen/dokumen/:dokumenId/tolak`

**Status:** ✅ Already exists in backend

## 3. Confirmasi Kegiatan Endpoint

**Endpoint:** `PATCH /api/dosen/kegiatan/:kegiatanId/partisipasi/:partisipasiId/terima`

**Status:** ✅ Already exists in backend

**Endpoint:** `PATCH /api/dosen/kegiatan/:kegiatanId/partisipasi/:partisipasiId/tolak`

**Status:** ✅ Already exists in backend

## 4. Pending Dokumen Endpoint

**Endpoint:** `GET /api/dosen/dokumen/permintaan`

**Status:** ✅ Already exists in backend

**Response format yang diharapkan frontend:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "string",
      "dokumen_id": "string",
      "dokumen": {
        "nama": "string",
        "jenis_dokumen": "string"
      },
      "tanggal_distribusi": "ISO 8601",
      "status": "string",
      "didistribusikan_oleh": {
        "tata_usaha": { "nama": "string" }
      }
    }
  ]
}
```

## 5. Pending Kegiatan Endpoint

**Endpoint:** `GET /api/dosen/kegiatan/permintaan-konfirmasi`

**Status:** ✅ Already exists in backend

**Response format yang diharapkan frontend:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "string",
      "kegiatanId": "string",
      "namaKegiatan": "string",
      "pengundang": "string",
      "status": "string"
    }
  ]
}
```

## 6. Detail Dokumen (Preview) Endpoint

**Endpoint:** `GET /api/dosen/dokumen/:dokumenId/preview`

**Status:** ✅ Already exists in backend

**Response format:**
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "name": "string",
    "jenis": "string",
    "sumber": "string",
    "tanggalUpload": "ISO 8601",
    "contentType": "string",
    "size": "number",
    "databaseHash": "string",
    "contentHash": "string",
    "contentMatchesDatabase": "boolean",
    "blockchainIntegrity": {
      "status": "valid | invalid | not_recorded",
      "blockchainHash": "string|null",
      "txId": "string|null",
      "activityId": "string|null",
      "blockHeight": "number|null",
      "confirmations": "number",
      "checkedAt": "ISO 8601"
    }
  }
}
```

## 7. Public Kegiatan Endpoint

**Endpoint:** `GET /api/public/kegiatan/:id`

**Status:** ✅ Already exists in backend

Menampilkan data publik kegiatan + dosen terlibat + dokumen.

## 8. Public Dokumen Content Endpoint

**Endpoint:** `GET /api/public/dokumen/:dokumenId/content`

**Status:** ✅ Already exists in backend

## Notes

- All endpoints that are not yet implemented use localStorage mock for frontend testing.
- Check `client/src/pages/DocumentPreviewPage.tsx` for the `fromPendingRequest` flow — banner hanya muncul jika `location.state.fromPendingRequest === true`.
- Check `client/src/pages/ActivityDetailPage.tsx` for the `fromPendingConfirmation` flow — banner hanya muncul jika `location.state.fromPendingConfirmation === true`.
