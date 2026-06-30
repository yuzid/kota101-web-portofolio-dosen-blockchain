export interface ActivityLog {
  id: string;
  action: string;
  actor: { id: string; name: string };
  timestamp: string;
  description: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  collectionChanges?: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }>;
}

export const mockAuditTrail: ActivityLog[] = [
  {
    id: "log-001",
    action: "created",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-01-15T08:30:00Z",
    description: "Kegiatan dibuat dan dicatat di blockchain",
    changes: {
      nama_kegiatan: { old: "", new: "Workshop Blockchain untuk Pemula" },
      jenis_tridharma: { old: "", new: "pendidikan" },
      kategori: { old: "", new: "Workshop" },
      tanggal_mulai: { old: "", new: "2026-02-01" },
      tanggal_selesai: { old: "", new: "2026-02-28" },
      tahun_akademik: { old: "", new: "2025/2026" },
      semester: { old: "", new: "genap" },
      program_studi: { old: "", new: "Informatika" },
    },
  },
  {
    id: "log-002",
    action: "member_added",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-01-15T08:35:00Z",
    description: "Dosen ditambahkan ke dalam kegiatan",
    collectionChanges: {
      dosen_terlibat: {
        added: [
          { id: "dosen-1", name: "Dr. Budi Santoso" },
          { id: "dosen-2", name: "Dr. Siti Rahmawati" },
          { id: "dosen-3", name: "Ir. Agus Wijaya" },
        ],
        removed: [],
        modified: [],
      },
    },
  },
  {
    id: "log-003",
    action: "updated",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-01-20T10:00:00Z",
    description: "Perubahan jadwal kegiatan",
    changes: {
      tanggal_mulai: { old: "2026-02-01", new: "2026-02-10" },
      tanggal_selesai: { old: "2026-02-28", new: "2026-03-05" },
    },
  },
  {
    id: "log-004",
    action: "dokumen_uploaded",
    actor: { id: "dosen-1", name: "Dr. Budi Santoso" },
    timestamp: "2026-02-12T09:15:00Z",
    description: "Dokumen bukti kegiatan diunggah",
    collectionChanges: {
      dokumen_pendukung: {
        added: [{ id: "doc-1", name: "Materi Workshop.pdf" }],
        removed: [],
        modified: [],
      },
    },
  },
  {
    id: "log-005",
    action: "dokumen_uploaded",
    actor: { id: "dosen-2", name: "Dr. Siti Rahmawati" },
    timestamp: "2026-02-14T14:30:00Z",
    description: "Laporan kegiatan diunggah",
    collectionChanges: {
      dokumen_pendukung: {
        added: [{ id: "doc-2", name: "Laporan Kegiatan.pdf" }],
        removed: [],
        modified: [],
      },
    },
  },
  {
    id: "log-006",
    action: "updated",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-02-20T11:00:00Z",
    description: "Data kegiatan diperbarui",
    changes: {
      kategori: { old: "Workshop", new: "Seminar Nasional" },
    },
  },
  {
    id: "log-007",
    action: "member_removed",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-02-25T08:00:00Z",
    description: "Dosen dikeluarkan dari kegiatan",
    collectionChanges: {
      dosen_terlibat: {
        added: [],
        removed: [{ id: "dosen-3", name: "Ir. Agus Wijaya" }],
        modified: [],
      },
    },
  },
  {
    id: "log-008",
    action: "member_added",
    actor: { id: "tu-1", name: "Tata Usaha FT" },
    timestamp: "2026-02-25T08:05:00Z",
    description: "Dosen baru ditambahkan menggantikan dosen yang keluar",
    collectionChanges: {
      dosen_terlibat: {
        added: [{ id: "dosen-4", name: "Dr. Dewi Lestari" }],
        removed: [],
        modified: [],
      },
    },
  },
];
