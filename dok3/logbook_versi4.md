# Logbook Versi 4 — Frontend Changes

## Task 4: Hapus Riwayat Versi & Aktivitas dari DocumentPreviewPage

**File:** `client/src/pages/DocumentPreviewPage.tsx`

**Changes:**
- Removed `History`, `Clock`, `Upload` imports from lucide-react
- Removed `Tabs`, `FileVersionHistory`, `FileVersion` imports
- Removed `mockVersions` and `mockActivities` useMemo hooks
- Removed `activeTab` state
- Removed entire `<Tabs>` wrapper (TabsList + 3 TabsContent: document, versions, activity)
- Document content is now rendered directly (not inside a tab)
- Removed unused imports

**File:** `client/src/components/file/FileVersionHistory.tsx` — No changes (still used in FileManagementPage)

## Task 3: Hapus Notification UI

**Files modified:**
- `client/src/components/layout/TopBar.tsx` — Removed `NotificationBell` import and usage
- `client/src/components/layout/Sidebar.tsx` — Removed `Bell` import and "Notifikasi" nav item
- `client/src/App.tsx` — Removed `NotificationsPage` lazy import and `/notifications` route
- `client/src/contexts/NotificationContext.tsx` — Simplified to only email preference (removed mock notifications, sound, desktop notif, notification CRUD)

**Files deleted:**
- `client/src/components/layout/NotificationBell.tsx`
- `client/src/pages/NotificationsPage.tsx`

## Task 1A: DocumentsPage — Tambah Tombol "Lihat Detail" di Pending Request

**File:** `client/src/pages/DocumentsPage.tsx`

**Changes:**
- Added "Lihat Detail" button (with Eye icon) before Terima/Tolak buttons in each pending request card
- Navigates to `/documents/${dokumenId}/preview` with state `{ fromPendingRequest: true }`

## Task 1B: DocumentPreviewPage — Banner Konfirmasi

**File:** `client/src/pages/DocumentPreviewPage.tsx`

**Changes:**
- Added `Check` import from lucide-react
- Added `fromPendingRequest` check from `location.state`
- Added `isConfirming` state, `handleConfirmAccept`, `handleConfirmReject` handlers
- Added banner with Terima/Tolak buttons (appears after metadata grid, before integrity section)
- On success: navigates back to `/documents`

## Task 1C: ActivitiesPage — Tambah Tombol "Lihat Detail" di Pending Confirmation

**File:** `client/src/pages/ActivitiesPage.tsx`

**Changes:**
- Added "Lihat Detail" button (with Eye icon) before Terima/Tolak buttons in each pending confirmation card
- Navigates to `/activities/${kegiatanId}` with state `{ fromPendingConfirmation: true, partisipasiId: item.id }`

## Task 1D: ActivityDetailPage — Banner Konfirmasi

**File:** `client/src/pages/ActivityDetailPage.tsx`

**Changes:**
- Added `fromPendingConfirmation`, `partisipasiId` from `location.state`
- Added `isConfirming` state, `handleConfirmAccept`, `handleConfirmReject` handlers
- Added banner with Terima/Tolak buttons (after share dialog, before hero card)
- On success: navigates back to `/activities`

## Task 2: PublicActivityPage Restructure

**File:** `client/src/pages/PublicActivityPage.tsx`

### New imports
- `Button`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `ScrollArea`
- Icons: `ChevronDown`, `ChevronRight`, `History`, `Pencil`, `Upload`, `UserCheck`, `UserX`, `X`, `Check`, `XCircle`, `Plus`, `Trash2`

### New helper data/functions
- `ActivityLog` interface
- `activityFieldLabels` map
- `formatAuditValue`, `getRecordId`, `getActivityChanges`, `getCollectionChanges`
- `getTimelineIcon`, `getTimelineColor`, `getTimelineDot`

### New state in PublicActivityPage
- `expandedDocs: Set<string>` — track which docs are expanded
- `logs: ActivityLog[]` — audit trail data (loaded from localStorage mock)
- `selectedLog: ActivityLog | null` — for detail dialog
- `toggleDoc(docId)` — toggle expand/collapse for doc preview

### renderFullMode — layout restructure
- **Old:** 2 separate cards (header + info) + dosen card with DocPreviewBlock + summary cards + footer
- **New:** 1 full-width info card (merged), then 2-column grid (3:2 ratio)
  - **Left column (col-span-2):** Dosen Terlibat card + Dokumen Bersama card (if BERSAMA)
  - **Right column (col-span-1, sticky):** Riwayat Blockchain card with timeline
- Doc preview changed: DocPreviewBlock replaced with clickable doc names + Eye icon that open Dialog preview
- MASING_MASING: docs shown inside each dosen card
- BERSAMA: docs shown in separate Dokumen Bersama card (no docs inside dosen card)
- Removed: Summary cards (3 stat cards), footer text

### Added
- Timeline riwayat blockchain with `ScrollArea` (max-h 600px)
- Click log entry → opens Dialog detail perubahan with changes table
- localStorage mock: reads from `mock_public_audit_trail` key (fallback to `mockPublicAuditTrail.ts`)
- `client/src/mocks/mockPublicAuditTrail.ts` — sample `ActivityLog[]` data
- Doc preview opens in Dialog (`!max-w-[95vw]`), triggered by clicking doc name + Eye icon (opacity-0 → group-hover:opacity-100)

### Changed
- Doc rendering: expand/collapse inline → click → Dialog preview
- Doc trigger: ChevronRight/ChevronDown + doc name → doc name + Eye icon (opacity-0 → group-hover:opacity-100)

## Task 5: Zoom Controls + Merged Toolbar + Dialog Width

**Files modified:**
- `client/src/components/public/PublicPdfPreview.tsx`
- `client/src/pages/DocumentPreviewPage.tsx`
- `client/src/pages/PublicActivityPage.tsx` (dialog width only)

**Changes:**
- Added `zoom` state (0.25–3, step 0.25) + `ZOOM_LEVELS` constant to both PDF components
- Added zoom toolbar: `[-] [Select dropdown: 50%–200%] [+]` merged into same row as page navigation (Sebelumnya / Selanjutnya)
- `Page width={renderWidth}` → `width={Math.round(renderWidth * zoom)}`
- `HighlightOverlay pageWidth/pageHeight` also multiplied by zoom
- Preview dialog: `max-w-4xl` → `!max-w-[95vw]`
- PublicPdfPreview imports: `Plus`, `Minus` from lucide; `Select*` from shadcn
- DocumentPreviewPage imports: `Plus`, `Minus` added to lucide; `ZOOM_LEVELS` constant

### Removed
- `SummaryCard` function (unused after layout restructure)
- `toggleDoc` function, `expandedDocs` state
- `ChevronDown`, `ChevronRight` imports
