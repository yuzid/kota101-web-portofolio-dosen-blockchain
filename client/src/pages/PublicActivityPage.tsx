import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Clock,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Eye,
  History,
  Pencil,
  Upload,
  UserCheck,
  UserX,
  X,
  Check,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  transformPublicActivity,
  getFileType,
  getOwnerDosenIds,
  type PublicActivity,
  type RawDocEntry,
} from "../lib/publicActivityTransform";
import { PublicPdfPreview } from "../components/public/PublicPdfPreview";
import type { Highlight } from "../services/highlightService";

const API_URL = import.meta.env.VITE_API_URL;

const jenisColor: Record<string, string> = {
  pendidikan: "border-l-blue-500 dark:border-l-blue-400",
  penelitian: "border-l-green-500 dark:border-l-green-400",
  pengabdian: "border-l-purple-500 dark:border-l-purple-400",
  tugas_tambahan: "border-l-orange-500 dark:border-l-orange-400",
};
const jenisBadge: Record<string, string> = {
  pendidikan: "border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  penelitian: "border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  pengabdian: "border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  tugas_tambahan: "border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
};
const jenisIcon: Record<string, React.ReactNode> = {
  pendidikan: <GraduationCap className="w-4 h-4" />,
  penelitian: <BookOpen className="w-4 h-4" />,
  pengabdian: <Users className="w-4 h-4" />,
  tugas_tambahan: <FileText className="w-4 h-4" />,
};

interface ActivityLog {
  id: string;
  action: string;
  actor: { id: string; name: string };
  timestamp: string;
  description: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  collectionChanges?: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }>;
  payload?: Record<string, unknown>;
  previousPayload?: Record<string, unknown> | null;
}

interface DocPreviewItem {
  id: string;
  name: string;
  fileUrl: string;
  kepemilikanId?: string;
  snapshotHighlights?: Highlight[];
}

interface SnapshotDocument {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
  hashFile: string;
  filePath: string;
  highlights: Highlight[];
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

const activityFieldLabels: Record<string, string> = {
  nama_kegiatan: "Nama Kegiatan",
  jenis_tridharma: "Jenis Tridharma",
  kategori: "Kategori",
  tanggal_mulai: "Tanggal Mulai",
  tanggal_selesai: "Tanggal Selesai",
  tahun_akademik: "Tahun Akademik",
  semester: "Semester",
  program_studi: "Program Studi",
};

function formatAuditValue(val: unknown): string {
  if (val === null || val === undefined) return "-";
  if (typeof val === "boolean") return val ? "Ya" : "Tidak";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function getRecordId(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? String(record[key]) : "";
}

function getActivityChanges(
  changes: Record<string, { old: unknown; new: unknown }>
): Array<{ field: string; oldValue: string; newValue: string }> {
  return Object.entries(changes)
    .filter(([key]) => key !== "updated_at")
    .map(([key, change]) => ({
      field: activityFieldLabels[key] || key,
      oldValue: formatAuditValue(change.old),
      newValue: formatAuditValue(change.new),
    }));
}

function getCollectionChanges(
  collectionChanges: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }>
): Array<{ collection: string; added: number; removed: number; modified: number }> {
  return Object.entries(collectionChanges).map(([collection, data]) => ({
    collection,
    added: data.added?.length || 0,
    removed: data.removed?.length || 0,
    modified: data.modified?.length || 0,
  }));
}

function isDocumentMetadataAction(action: string) {
  return action === "document_metadata_updated";
}

function isDocumentHighlightAction(action: string) {
  return action.startsWith("document_highlight");
}

function getDocumentMetadataChanges(
  current: Record<string, unknown>,
  previous?: Record<string, unknown>
) {
  if (!previous) return [];

  const labels: Record<string, string> = {
    nama: "Nama",
    jenis_dokumen: "Jenis",
    sumber_dokumen: "Sumber",
    tanggal_upload: "Tanggal",
  };

  return Object.entries(labels)
    .filter(([field]) => current[field] !== previous[field])
    .map(([field, label]) => ({
      label,
      oldValue: formatAuditValue(previous[field]),
      newValue: formatAuditValue(current[field]),
    }));
}

function getSnapshotDocuments(payload?: Record<string, unknown>): SnapshotDocument[] {
  const documents = Array.isArray(payload?.dokumen_pendukung)
    ? payload.dokumen_pendukung
    : [];

  return documents.map((doc: unknown) => {
    const d = toRecord(doc);
    const rawHighlights = Array.isArray(d.highlights) ? d.highlights : [];
    const highlights: Highlight[] = rawHighlights.map((highlight: unknown) => {
      const h = toRecord(highlight);
      const rects = Array.isArray(h.rects) ? h.rects : [];
      return {
        id: String(h.highlight_id ?? crypto.randomUUID()),
        kepemilikan_id: String(h.kepemilikan_id ?? ""),
        page_number: Number(h.page_number ?? 1),
        highlighted_text: String(h.highlighted_text ?? ""),
        highlight_rect: rects.map((rect: unknown) => {
          const r = toRecord(rect);
          return {
            id: String(r.id ?? crypto.randomUUID()),
            x1: Number(r.x1 ?? 0),
            x2: Number(r.x2 ?? 0),
            y1: Number(r.y1 ?? 0),
            y2: Number(r.y2 ?? 0),
            width: Number(r.width ?? 0),
            height: Number(r.height ?? 0),
            boundary_rect: Boolean(r.boundary_rect),
          };
        }),
      };
    });

    return {
      id: String(d.dokumen_id ?? ""),
      name: String(d.nama ?? "Tanpa Nama"),
      jenis: String(d.jenis_dokumen ?? "-"),
      tanggalUpload: String(d.tanggal_upload ?? ""),
      hashFile: String(d.hash_file ?? "-"),
      filePath: String(d.file_path ?? d.nama ?? ""),
      highlights,
    };
  }).filter((doc) => doc.id);
}

function transformSnapshotLog(log: ActivityLog, activityId: string): PublicActivity {
  const payload = log.payload || {};
  const kegiatan = toRecord(payload.kegiatan);
  const pencatat = toRecord(payload.pencatat);
  const programStudi = toRecord(pencatat.program_studi);
  const documents = getSnapshotDocuments(payload);
  const participants = Array.isArray(payload.partisipasi)
    ? payload.partisipasi.map((item) => toRecord(item))
    : [];

  return {
    id: activityId,
    namaKegiatan: String(kegiatan.nama_kegiatan ?? ""),
    jenisTridharma: String(kegiatan.kategori_tridharma ?? "").toLowerCase(),
    kategori: String(kegiatan.jenis_kegiatan ?? ""),
    tanggalMulai: String(kegiatan.tanggal_mulai ?? ""),
    tanggalSelesai: String(kegiatan.tanggal_selesai ?? ""),
    tahunAkademik: String(kegiatan.periode ?? ""),
    semester: String(kegiatan.semester ?? "").toLowerCase(),
    programStudi: String(programStudi.nama ?? "Umum"),
    statusKelengkapan: documents.length > 0 ? "lengkap" : "tidak_lengkap",
    jenisBukti: "BERSAMA",
    dosenTerlibat: participants.map((participant) => ({
      id: String(participant.dosen_id ?? participant.nama ?? crypto.randomUUID()),
      name: String(participant.nama ?? "Unknown"),
      nidn: String(participant.nidn ?? participant.nip ?? "-"),
      peran: String(participant.peran ?? "ANGGOTA"),
      status: String(participant.status ?? "DITERIMA"),
      dokumen: [],
    })),
    dokumenBersama: documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      jenis: doc.jenis,
      tanggalUpload: doc.tanggalUpload,
      hashFile: doc.hashFile,
      filePath: doc.filePath,
      fileUrl: `${API_URL}/api/public/kegiatan/${activityId}/audit-trail/${log.id}/dokumen/${doc.id}/content`,
      snapshotHighlights: doc.highlights,
    })),
  };
}

function getTimelineIcon(action: string) {
  switch (action) {
    case "created":
      return <Plus className="w-4 h-4 text-green-600" />;
    case "updated":
      return <Pencil className="w-4 h-4 text-blue-600" />;
    case "deleted":
      return <Trash2 className="w-4 h-4 text-red-600" />;
    case "member_added":
      return <UserCheck className="w-4 h-4 text-purple-600" />;
    case "member_removed":
      return <UserX className="w-4 h-4 text-orange-600" />;
    case "dokumen_uploaded":
      return <Upload className="w-4 h-4 text-cyan-600" />;
    case "document_metadata_updated":
    case "document_highlight_synced":
    case "document_highlight_added":
    case "document_highlight_updated":
    case "document_highlight_deleted":
      return <Pencil className="w-4 h-4 text-amber-600" />;
    case "dokumen_removed":
      return <X className="w-4 h-4 text-red-600" />;
    case "status_changed":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    default:
      return <History className="w-4 h-4 text-muted-foreground" />;
  }
}

function getTimelineColor(action: string) {
   switch (action) {
     case "created":
       return "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950";
     case "updated":
       return "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950";
     case "deleted":
       return "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950";
     case "member_added":
       return "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950";
     case "member_removed":
       return "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950";
     case "dokumen_uploaded":
       return "border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950";
     case "document_metadata_updated":
     case "document_highlight_synced":
     case "document_highlight_added":
     case "document_highlight_updated":
     case "document_highlight_deleted":
       return "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950";
     case "dokumen_removed":
       return "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950";
     case "status_changed":
       return "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950";
     default:
        return "border-muted-foreground/20 bg-muted/50";
   }
 }

function getTimelineDot(action: string) {
   switch (action) {
     case "created":
       return "bg-green-500 dark:bg-green-400";
     case "updated":
       return "bg-blue-500 dark:bg-blue-400";
     case "deleted":
       return "bg-red-500 dark:bg-red-400";
     case "member_added":
       return "bg-purple-500 dark:bg-purple-400";
     case "member_removed":
       return "bg-orange-500 dark:bg-orange-400";
     case "dokumen_uploaded":
       return "bg-cyan-500 dark:bg-cyan-400";
     case "document_metadata_updated":
     case "document_highlight_synced":
     case "document_highlight_added":
     case "document_highlight_updated":
     case "document_highlight_deleted":
       return "bg-amber-500 dark:bg-amber-400";
     case "dokumen_removed":
       return "bg-red-500 dark:bg-red-400";
     case "status_changed":
       return "bg-green-500 dark:bg-green-400";
     default:
        return "bg-muted-foreground/50";
   }
 }

function getNameChangedDocuments(log: ActivityLog) {
  const modifiedDocs = log.collectionChanges?.dokumen_bukti?.modified || [];
  const previousDocs = Array.isArray(log.previousPayload?.dokumen_pendukung)
    ? log.previousPayload?.dokumen_pendukung as Array<Record<string, unknown>>
    : [];

  return modifiedDocs.filter((doc) => {
    const currentDoc = toRecord(doc);
    const previousDoc = previousDocs.find((item) => item.dokumen_id === currentDoc.dokumen_id);
    return previousDoc && currentDoc.nama !== previousDoc.nama;
  });
}

function hasDocumentCollectionAddOrRemove(log: ActivityLog) {
  const docChanges = log.collectionChanges?.dokumen_bukti;
  return Boolean(
    docChanges &&
      ((docChanges.added?.length || 0) > 0 || (docChanges.removed?.length || 0) > 0)
  );
}

function getDocumentHistoryLogs(logs: ActivityLog[]) {
  return logs.filter((log) => {
    if (isDocumentMetadataAction(log.action)) {
      return getNameChangedDocuments(log).length > 0;
    }

    return hasDocumentCollectionAddOrRemove(log) || isDocumentHighlightAction(log.action);
  });
}

function getDocumentNamesFromChanges(log: ActivityLog) {
  if (isDocumentMetadataAction(log.action)) {
    const names = getNameChangedDocuments(log)
      .map((doc) => String(toRecord(doc).nama ?? ""))
      .filter(Boolean);

    return Array.from(new Set(names));
  }

  const docs = log.collectionChanges?.dokumen_bukti;
  const changedDocs = [
    ...(docs?.added || []),
    ...(docs?.removed || []),
    ...(docs?.modified || []),
  ];
  const names = changedDocs
    .map((doc) => String(toRecord(doc).nama ?? ""))
    .filter(Boolean);

  return Array.from(new Set(names));
}

function getDocumentHistoryDescription(log: ActivityLog) {
  const names = getDocumentNamesFromChanges(log);
  const docLabel = names.length > 0 ? names.join(", ") : "dokumen";

  if (log.action === "dokumen_uploaded") return `Dokumen ditambahkan: ${docLabel}.`;
  if (log.action === "dokumen_removed") return `Dokumen dihapus: ${docLabel}.`;
  if (isDocumentMetadataAction(log.action)) {
    const renamedDocs = getNameChangedDocuments(log);
    const descriptions = renamedDocs.map((doc) => {
      const currentDoc = toRecord(doc);
      const previousDocs = Array.isArray(log.previousPayload?.dokumen_pendukung)
        ? log.previousPayload?.dokumen_pendukung as Array<Record<string, unknown>>
        : [];
      const previousDoc = previousDocs.find((item) => item.dokumen_id === currentDoc.dokumen_id);
      return `Nama dokumen ${formatAuditValue(previousDoc?.nama)} diubah menjadi ${formatAuditValue(currentDoc.nama)}.`;
    });

    return descriptions.length > 0 ? descriptions.join(" ") : `Nama dokumen ${docLabel} diperbarui.`;
  }
  if (isDocumentHighlightAction(log.action)) return `Highlight ${docLabel} diperbarui.`;

  return log.description;
}

export function PublicActivityPage() {
  const { id, txId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocPreviewItem | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [latestActivityName, setLatestActivityName] = useState<string>("");

  const isDokumenMode = location.pathname.includes("/dokumen");

  const fetchLatestActivityName = async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/kegiatan/${id}`);
      if (!response.ok) return "";
      const result = await response.json();
      return result.status === "success" ? String(result.data?.nama_kegiatan || "") : "";
    } catch {
      return "";
    }
  };

  const fetchAuditTrail = async (): Promise<ActivityLog[]> => {
    try {
      const response = await fetch(`${API_URL}/api/public/kegiatan/${id}/audit-trail`);
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const sorted = result.data.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const processed: ActivityLog[] = [];
        
        const computeDiff = (current: any, prev: any) => {
          const changes: Record<string, { old: unknown; new: unknown }> = {};
          const collectionChanges: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }> = {};

          if (!prev) {
            return { changes, collectionChanges };
          }

          const curKegiatan = current.kegiatan || {};
          const prevKegiatan = prev.kegiatan || {};

          const keys = ['nama_kegiatan', 'kategori_tridharma', 'jenis_kegiatan', 'tanggal_mulai', 'tanggal_selesai', 'periode', 'semester'];
          for (const key of keys) {
            const curVal = curKegiatan[key];
            const prevVal = prevKegiatan[key];
            if (curVal !== prevVal) {
              changes[key] = { old: prevVal, new: curVal };
            }
          }

          const curPart = current.partisipasi || [];
          const prevPart = prev.partisipasi || [];
          const addedPart = curPart.filter((p: any) => !prevPart.some((op: any) => op.dosen_id === p.dosen_id));
          const removedPart = prevPart.filter((op: any) => !curPart.some((p: any) => p.dosen_id === op.dosen_id));
          const modifiedPart = curPart.filter((p: any) => {
            const oldPart = prevPart.find((op: any) => op.dosen_id === p.dosen_id);
            return oldPart && JSON.stringify(oldPart) !== JSON.stringify(p);
          });
          if (addedPart.length > 0 || removedPart.length > 0 || modifiedPart.length > 0) {
            collectionChanges['anggota_kegiatan'] = {
              added: addedPart,
              removed: removedPart,
              modified: modifiedPart
            };
          }

          const curDocs = current.dokumen_pendukung || [];
          const prevDocs = prev.dokumen_pendukung || [];
          const addedDocs = curDocs.filter((d: any) => !prevDocs.some((od: any) => od.dokumen_id === d.dokumen_id));
          const removedDocs = prevDocs.filter((od: any) => !curDocs.some((d: any) => d.dokumen_id === od.dokumen_id));
          const modifiedDocs = curDocs.filter((d: any) => {
            const oldDoc = prevDocs.find((od: any) => od.dokumen_id === d.dokumen_id);
            return oldDoc && JSON.stringify(oldDoc) !== JSON.stringify(d);
          });
          if (addedDocs.length > 0 || removedDocs.length > 0 || modifiedDocs.length > 0) {
            collectionChanges['dokumen_bukti'] = {
              added: addedDocs,
              removed: removedDocs,
              modified: modifiedDocs
            };
          }

          return { changes, collectionChanges };
        };

        const generateDescription = (action: string, changes: any, collectionChanges: any): string => {
          if (action === 'created') return 'Membuat catatan kegiatan baru.';
          if (action === 'document_metadata_updated') return 'Metadata dokumen diperbarui.';
          if (action === 'document_highlight_synced') return 'Highlight dokumen diperbarui.';
          if (action === 'document_highlight_added') return 'Highlight dokumen ditambahkan.';
          if (action === 'document_highlight_updated') return 'Highlight dokumen diperbarui.';
          if (action === 'document_highlight_deleted') return 'Highlight dokumen dihapus.';
          
          const descParts: string[] = [];
          const modifiedFields = Object.keys(changes);
          if (modifiedFields.length > 0) {
            const fieldLabels = modifiedFields.map(f => activityFieldLabels[f] || f);
            descParts.push(`Mengubah field: ${fieldLabels.join(', ')}.`);
          }

          const partChange = collectionChanges['anggota_kegiatan'];
          if (partChange) {
            if (partChange.added.length > 0) {
              descParts.push(`Menambahkan anggota: ${partChange.added.map((p: any) => p.nama).join(', ')}.`);
            }
            if (partChange.removed.length > 0) {
              descParts.push(`Mengeluarkan anggota: ${partChange.removed.map((p: any) => p.nama).join(', ')}.`);
            }
            if (partChange.modified.length > 0) {
              descParts.push(`Mengubah status anggota: ${partChange.modified.map((p: any) => `${p.nama} menjadi ${formatAuditValue(p.status)}`).join(', ')}.`);
            }
          }

          const docChange = collectionChanges['dokumen_bukti'];
          if (docChange) {
            if (docChange.added.length > 0) {
              descParts.push(`Mengunggah dokumen bukti baru: ${docChange.added.map((d: any) => d.nama).join(', ')}.`);
            }
            if (docChange.removed.length > 0) {
              descParts.push(`Menghapus dokumen bukti: ${docChange.removed.map((d: any) => d.nama).join(', ')}.`);
            }
          }

          return descParts.join(' ') || 'Melakukan pembaruan data kegiatan.';
        };

        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          const rawPayload = item.payload || {};
          const prevPayload = i > 0 ? sorted[i - 1].payload : null;
          
          let actionMapped = 'updated';
          if (item.action === 'KEGIATAN_CREATED') actionMapped = 'created';
          if (item.action === 'KEGIATAN_DELETED') actionMapped = 'deleted';
          if (item.action === 'DOKUMEN_ADDED') actionMapped = 'dokumen_uploaded';
          if (item.action === 'DOKUMEN_REMOVED') actionMapped = 'dokumen_removed';
          if (item.action === 'DOKUMEN_METADATA_UPDATED') actionMapped = 'document_metadata_updated';
          if (item.action === 'DOKUMEN_HIGHLIGHTS_SYNCED') actionMapped = 'document_highlight_synced';
          if (item.action === 'DOKUMEN_HIGHLIGHT_ADDED') actionMapped = 'document_highlight_added';
          if (item.action === 'DOKUMEN_HIGHLIGHT_UPDATED') actionMapped = 'document_highlight_updated';
          if (item.action === 'DOKUMEN_HIGHLIGHT_DELETED') actionMapped = 'document_highlight_deleted';
          
          const { changes, collectionChanges } = computeDiff(rawPayload, prevPayload);
          if (
            (actionMapped === 'document_metadata_updated' || actionMapped === 'document_highlight_synced') &&
            !collectionChanges.dokumen_bukti &&
            Array.isArray(rawPayload.dokumen_pendukung)
          ) {
            collectionChanges.dokumen_bukti = {
              added: [],
              removed: [],
              modified: rawPayload.dokumen_pendukung,
            };
          }
          const description = generateDescription(actionMapped, changes, collectionChanges);
          
          processed.push({
            id: item.id,
            action: actionMapped,
            actor: typeof item.actor === 'string' ? { id: '', name: item.actor } : item.actor,
            timestamp: item.timestamp,
            description,
            changes,
            collectionChanges,
            payload: rawPayload,
            previousPayload: prevPayload,
          });
        }
        const reversed = processed.reverse();
        setLogs(reversed);
        return reversed;
      }
    } catch (e) {
      console.error("Gagal memuat audit trail:", e);
    }
    return [];
  };

  useEffect(() => {
    if (id) {
      void loadPage();
    }
  }, [id, txId]);

  const loadPage = async () => {
    setIsLoading(true);
    setError(null);
    const auditLogs = await fetchAuditTrail();
    if (txId) {
      const selected = auditLogs.find((log) => log.id === txId);
      if (!selected) {
        setError("NOT_FOUND");
        setIsLoading(false);
        return;
      }
      const snapshotActivity = transformSnapshotLog(selected, id!);
      if (isDokumenMode) {
        const latestName = latestActivityName || await fetchLatestActivityName();
        if (latestName) setLatestActivityName(latestName);
        setActivity({
          ...snapshotActivity,
          namaKegiatan: latestName || snapshotActivity.namaKegiatan,
        });
      } else {
        setActivity(snapshotActivity);
      }
      setIsLoading(false);
      return;
    }

    await fetchActivity();
  };

  const fetchActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/public/kegiatan/${id}`);
      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }
      if (!response.ok) {
        throw new Error("SERVER_ERROR");
      }
      const result = await response.json();
      if (result.status !== "success" || !result.data) {
        throw new Error(result.error || "Kegiatan tidak ditemukan");
      }
      const { activity: transformed, docEntries } = transformPublicActivity(result.data);
      setLatestActivityName(transformed.namaKegiatan);

      if (docEntries.length > 0) {
        const docResults = await Promise.allSettled(
          docEntries.map((doc: RawDocEntry) =>
            fetch(`${API_URL}/api/public/dokumen/${doc.id}`)
              .then((r) => r.json())
              .then((r) => (r.status === "success" ? r.data : null))
          )
        );

        if (transformed.jenisBukti === "BERSAMA") {
          docResults.forEach((result) => {
            if (result.status !== "fulfilled" || !result.value) return;
            const detail = result.value;
            const sharedDoc = transformed.dokumenBersama.find(
              (d) => d.id === detail.id
            );
            if (sharedDoc) {
              if (detail.file_path) sharedDoc.filePath = detail.file_path;
              if (detail.hash_file) sharedDoc.hashFile = detail.hash_file;
              sharedDoc.kepemilikanId = detail.kepemilikan?.[0]?.id || undefined;
            }
          });
        } else {
          docResults.forEach((result) => {
            if (result.status !== "fulfilled" || !result.value) return;
            const detail = result.value;
            const ownerIds = getOwnerDosenIds(detail);
            transformed.dosenTerlibat.forEach((dosen) => {
              if (ownerIds.includes(dosen.id)) {
                const existing = dosen.dokumen.find(
                  (d) => d.id === detail.id
                );
                if (!existing) {
                  dosen.dokumen.push({
                    id: detail.id,
                    name: detail.nama || "Tanpa Nama",
                    jenis: detail.jenis_dokumen || "-",
                    tanggalUpload: detail.tanggal_upload || "",
                    hashFile: detail.hash_file || "",
                    filePath: detail.file_path || "",
                    kepemilikanId: detail.kepemilikan?.find((k: any) => k.dosen?.id === dosen.id)?.id || undefined,
                  });
                } else {
                  if (detail.file_path) existing.filePath = detail.file_path;
                  if (detail.hash_file) existing.hashFile = detail.hash_file;
                  existing.kepemilikanId = detail.kepemilikan?.find((k: any) => k.dosen?.id === dosen.id)?.id || undefined;
                }
              }
            });
          });
        }
      }

      setActivity(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data kegiatan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const statusBadge = (status: string) => {
     switch (status) {
       case "DITERIMA":
         return (
           <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-xs">
             <CheckCircle className="w-3 h-3 mr-1" /> Diterima
           </Badge>
         );
       case "DITOLAK":
         return (
           <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-xs">
             <AlertCircle className="w-3 h-3 mr-1" /> Ditolak
           </Badge>
         );
       default:
         return (
           <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 text-xs">
             <Clock className="w-3 h-3 mr-1" /> Menunggu
           </Badge>
         );
     }
   };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Memuat data kegiatan...</p>
        </div>
    </div>
  );
}

  if (error || !activity) {
    const is404 = error === "NOT_FOUND";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {is404 ? "Kegiatan Tidak Ditemukan" : "Gagal Memuat Data"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {is404
                ? "Kegiatan yang Anda cari tidak tersedia atau telah dihapus."
                : "Terjadi kesalahan saat memuat data. Silakan coba lagi nanti."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jType = activity.jenisTridharma?.toLowerCase() || "";

  if (isDokumenMode) {
    return renderDokumenMode(activity, jType, getInitials, statusBadge, logs, navigate, txId, latestActivityName);
  }

  return renderFullMode(activity, jType, getInitials, statusBadge, previewDoc, setPreviewDoc, logs, selectedLog, setSelectedLog, navigate, txId);
}

function renderFullMode(
  activity: PublicActivity,
  jType: string,
  getInitials: (name: string) => string,
  statusBadge: (status: string) => React.ReactNode,
  previewDoc: DocPreviewItem | null,
  setPreviewDoc: React.Dispatch<React.SetStateAction<DocPreviewItem | null>>,
  logs: ActivityLog[],
  selectedLog: ActivityLog | null,
  setSelectedLog: React.Dispatch<React.SetStateAction<ActivityLog | null>>,
  navigate: ReturnType<typeof useNavigate>,
  activeTxId?: string,
) {
  return (
    <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
       >
       <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
         {/* ── Full-width Info Card (merged header + info) ── */}
         <Card className={`overflow-hidden border-l-4 ${jenisColor[jType] || "border-l-gray-300"}`}>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={jenisBadge[jType] || ""}>
                    {jenisIcon[jType]}{" "}
                    <span className="ml-1 capitalize">
                      {activity.jenisTridharma?.replace("_", " ") || "-"}
                    </span>
                  </Badge>
                  <Badge variant="secondary">{activity.kategori}</Badge>
                  {activity.statusKelengkapan === "lengkap" ? (
                     <Badge className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs">
                       <CheckCircle className="w-3 h-3 mr-1" /> Dokumen Lengkap
                     </Badge>
                   ) : (
                     <Badge className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs">
                       <AlertCircle className="w-3 h-3 mr-1" /> Dokumen Tidak Lengkap
                     </Badge>
                   )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {activity.namaKegiatan}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Tanggal Mulai" value={formatDate(activity.tanggalMulai)} />
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Tanggal Selesai" value={formatDate(activity.tanggalSelesai)} />
              <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="Tahun Akademik" value={activity.tahunAkademik} />
              <InfoItem icon={<BookOpen className="w-4 h-4" />} label="Semester" value={activity.semester} />
            </div>
          </CardContent>
        </Card>

        {/* ── 2-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dosen Terlibat */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Dosen Terlibat
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {activity.dosenTerlibat.length} dosen
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.dosenTerlibat.map((dosen) => (
                  <div key={dosen.id} className="border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {getInitials(dosen.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm truncate">{dosen.name}</span>
                            {dosen.peran === "KETUA" && (
                               <Badge className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs h-5">{dosen.peran}</Badge>
                             )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">NIDN: {dosen.nidn}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(dosen.status)}
                      </div>
                    </div>

                    {activity.jenisBukti !== "BERSAMA" && (
                      <div className="p-4 space-y-2">
                        {dosen.dokumen.length > 0 ? (
                          dosen.dokumen.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() =>
                                setPreviewDoc({
                                  id: doc.id,
                                  name: doc.name,
                                  fileUrl: doc.fileUrl || `${API_URL}/api/public/dokumen/${doc.id}/content`,
                                  kepemilikanId: doc.kepemilikanId,
                                  snapshotHighlights: doc.snapshotHighlights,
                                })
                              }
                              className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-sm font-medium truncate flex-1">{doc.name}</span>
                              <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic px-2">
                            Belum ada dokumen bukti
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dokumen Bersama (only if BERSAMA) */}
            {activity.jenisBukti === "BERSAMA" && activity.dokumenBersama.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Dokumen Bersama
                    <Badge variant="secondary" className="text-xs">
                      {activity.dokumenBersama.length} file
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activity.dokumenBersama.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() =>
                        setPreviewDoc({
                          id: doc.id,
                          name: doc.name,
                          fileUrl: doc.fileUrl || `${API_URL}/api/public/dokumen/${doc.id}/content`,
                          kepemilikanId: doc.kepemilikanId,
                          snapshotHighlights: doc.snapshotHighlights,
                        })
                      }
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">{doc.name}</span>
                      <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column (col-span-1) — Riwayat Blockchain */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    Riwayat Blockchain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <div className="text-center py-6">
                      <History className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Riwayat perubahan akan muncul setelah tersedia.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                      <div className="relative space-y-1">
                        {logs.length > 1 && (
                          <div className="absolute bottom-6 left-4 top-6 w-px -translate-x-1/2 bg-border" />
                        )}
                        {logs.map((log, idx) => (
                          <button
                            key={log.id}
                            onClick={() => navigate(`/public/kegiatan/${activity.id}/entry/${log.id}`)}
                            className="relative block w-full text-left group"
                          >
                            <div className="relative flex items-center gap-3 rounded-md py-1.5">
                              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${getTimelineColor(log.action)}`}>
                                <div className={`h-2.5 w-2.5 rounded-full ${getTimelineDot(log.action)}`} />
                              </div>
                              <div className={`min-w-0 flex-1 space-y-1 rounded-md px-2 py-1 pt-1.5 ${activeTxId === log.id ? "bg-primary/5" : "group-hover:bg-muted/40"}`}>
                                <div className="flex min-w-0 items-start gap-2">
                                  <span className="mt-0.5 shrink-0">{getTimelineIcon(log.action)}</span>
                                  <p className="min-w-0 break-words text-xs font-medium capitalize leading-snug">
                                    {log.action.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <p className="text-[11px] leading-snug text-muted-foreground">
                                  {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm", { locale: localeId })}
                                </p>
                                <p className="break-words text-[11px] leading-snug text-muted-foreground">
                                  Oleh: {log.actor.name}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ── Timeline Detail Dialog ── */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 capitalize">
                {selectedLog && getTimelineIcon(selectedLog.action)}
                {selectedLog && selectedLog.action.replace(/_/g, " ")}
              </DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedLog.timestamp), "dd MMMM yyyy, HH:mm", { locale: localeId })} &mdash; Oleh: {selectedLog.actor.name}
                      </div>
                      <p className="text-sm">{selectedLog.description}</p>

                      {selectedLog.changes && getActivityChanges(selectedLog.changes).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Perubahan Data</h4>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="text-left p-2 font-medium">Field</th>
                                  <th className="text-left p-2 font-medium">Nilai Lama</th>
                                  <th className="text-left p-2 font-medium">Nilai Baru</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getActivityChanges(selectedLog.changes).map((change, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2 font-medium">{change.field}</td>
                                    <td className="p-2 text-muted-foreground">{change.oldValue}</td>
                                    <td className="p-2">{change.newValue}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {selectedLog.collectionChanges && getCollectionChanges(selectedLog.collectionChanges).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Perubahan Koleksi</h4>
                          <div className="space-y-2">
                            {selectedLog.collectionChanges.dokumen_bukti?.modified?.map((doc: unknown, i: number) => {
                              const currentDoc = doc as Record<string, unknown>;
                              const previousDocs = Array.isArray(selectedLog.previousPayload?.dokumen_pendukung)
                                ? selectedLog.previousPayload?.dokumen_pendukung as Array<Record<string, unknown>>
                                : [];
                              const previousDoc = previousDocs.find((item) => item.dokumen_id === currentDoc.dokumen_id);
                              const metadataChanges = getDocumentMetadataChanges(currentDoc, previousDoc);

                              return (
                                <div key={`doc-mod-${i}`} className="rounded-lg border p-3 text-xs">
                                  {isDocumentHighlightAction(selectedLog.action) ? (
                                    <p>
                                      Highlight dokumen <strong>{String(currentDoc.nama ?? "-")}</strong> diperbarui.
                                    </p>
                                  ) : isDocumentMetadataAction(selectedLog.action) ? (
                                    <div className="space-y-2">
                                      <p>
                                        Metadata dokumen <strong>{String(currentDoc.nama ?? "-")}</strong> diperbarui.
                                      </p>
                                      {metadataChanges.length > 0 ? (
                                        <div className="space-y-1">
                                          {metadataChanges.map((change) => (
                                            <div key={change.label} className="grid gap-1 sm:grid-cols-[110px_1fr]">
                                              <span className="font-medium">{change.label}</span>
                                              <span>
                                                <span className="text-muted-foreground line-through">{change.oldValue}</span>
                                                <span className="mx-1 text-muted-foreground">→</span>
                                                <strong>{change.newValue}</strong>
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground">
                                          Detail field metadata sebelumnya tidak tersedia pada snapshot pembanding.
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p>
                                      Dokumen diubah: <strong>{String(currentDoc.nama ?? "-")}</strong>.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            {getCollectionChanges(selectedLog.collectionChanges)
                              .filter((cc) => cc.collection !== "dokumen_bukti")
                              .map((cc, i) => (
                                <div key={i} className="rounded-lg border p-3 text-xs">
                                  <p className="font-medium capitalize mb-1">{cc.collection.replace(/_/g, " ")}</p>
                                  <div className="flex gap-3 text-muted-foreground">
                                    {cc.added > 0 && <span className="text-green-600">+{cc.added} ditambah</span>}
                                    {cc.removed > 0 && <span className="text-red-600">-{cc.removed} dihapus</span>}
                                    {cc.modified > 0 && <span className="text-blue-600">~{cc.modified} diubah</span>}
                                  </div>
                                </div>
                              ))}
                            {selectedLog.collectionChanges.dokumen_bukti && (
                              <>
                                {selectedLog.collectionChanges.dokumen_bukti.added.map((doc: unknown, i: number) => {
                                  const d = doc as Record<string, unknown>;
                                  return (
                                    <div key={`doc-add-${i}`} className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                                      Dokumen ditambahkan: <strong>{String(d.nama ?? "-")}</strong>.
                                    </div>
                                  );
                                })}
                                {selectedLog.collectionChanges.dokumen_bukti.removed.map((doc: unknown, i: number) => {
                                  const d = doc as Record<string, unknown>;
                                  return (
                                    <div key={`doc-remove-${i}`} className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                                      Dokumen dihapus: <strong>{String(d.nama ?? "-")}</strong>.
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Document Preview Dialog ── */}
        <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
          <DialogContent className="!max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {previewDoc?.name}
              </DialogTitle>
            </DialogHeader>
            {previewDoc && (
              <PublicPdfPreview
                fileUrl={previewDoc.fileUrl}
                kepemilikanId={previewDoc.kepemilikanId}
                snapshotHighlights={previewDoc.snapshotHighlights}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
     </div>
       </motion.div>
   );
 }

function renderDokumenMode(
  activity: PublicActivity,
  _jType: string,
  _getInitials: (name: string) => string,
  _statusBadge: (status: string) => React.ReactNode,
  logs: ActivityLog[],
  navigate: ReturnType<typeof useNavigate>,
  activeTxId?: string,
  latestActivityName?: string
) {
  const allDocs =
    activity.jenisBukti === "BERSAMA"
      ? activity.dokumenBersama
      : activity.dosenTerlibat.flatMap((d) => d.dokumen);
  const documentLogs = getDocumentHistoryLogs(logs);

  return (
    <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
       >
       <div className="min-h-screen bg-background py-8 px-4">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
             Dokumen Bukti Kegiatan
           </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {latestActivityName || activity.namaKegiatan}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {activity.jenisBukti === "BERSAMA" ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Dokumen Bersama
                    <Badge variant="secondary" className="text-xs">
                      {activity.dokumenBersama.length} file
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {activity.dokumenBersama.map((doc) => (
                    <div key={doc.id} className="space-y-3">
                      <DocPreviewBlock doc={doc} label={doc.name} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {activity.dosenTerlibat.map((dosen) => (
                  <Card key={dosen.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {dosen.name}
                        <Badge variant="outline" className="text-xs">
                          NIDN: {dosen.nidn}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {dosen.dokumen.length > 0 ? (
                        dosen.dokumen.map((doc) => (
                          <DocPreviewBlock
                            key={doc.id}
                            doc={doc}
                            label={doc.name}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Belum ada dokumen bukti
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  Verifikasi Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allDocs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada dokumen yang tercatat
                    </p>
                  )}
                  {allDocs.map((doc) => {
                    const verified = doc.hashFile && doc.hashFile !== "-";
                    return (
                      <div
                        key={doc.id}
                        className={`rounded-lg border-2 p-4 ${
                           verified
                             ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
                             : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950"
                         }`}
                      >
                        <div className="flex items-start gap-3">
                          {verified ? (
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className={`text-sm font-semibold mt-1 ${
                              verified ? "text-green-700" : "text-yellow-700"
                            }`}>
                              {verified
                                ? "Terdokumentasi di Blockchain"
                                : "Belum Tercatat di Blockchain"}
                            </p>
                            <p className={`text-xs mt-0.5 ${
                              verified ? "text-green-600" : "text-yellow-600"
                            }`}>
                              {verified
                                ? "Dokumen ini telah diverifikasi dan dicatat pada jaringan blockchain."
                                : "Dokumen ini belum dicatat pada jaringan blockchain."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                Riwayat Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat perubahan dokumen.
                </p>
              ) : (
                <div className="max-h-[600px] overflow-y-auto pr-2">
                  <div className="relative space-y-1">
                    {documentLogs.map((log, index) => (
                      <button
                        key={log.id}
                        type="button"
                        onClick={() => navigate(`/public/kegiatan/${activity.id}/dokumen/entry/${log.id}`)}
                        className="group block w-full text-left"
                      >
                      <div className="relative flex items-center gap-3 rounded-md py-1.5">
                        {index > 0 && (
                          <div className="absolute bottom-1/2 left-4 top-[-0.25rem] w-px -translate-x-1/2 bg-border" />
                        )}
                        {index < documentLogs.length - 1 && (
                          <div className="absolute bottom-[-0.25rem] left-4 top-1/2 w-px -translate-x-1/2 bg-border" />
                        )}
                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${getTimelineColor(log.action)}`}>
                          <div className={`h-2.5 w-2.5 rounded-full ${getTimelineDot(log.action)}`} />
                        </div>
                        <div className={`min-w-0 flex-1 space-y-1 rounded-md px-2 py-1 pt-1.5 ${activeTxId === log.id ? "bg-primary/5" : "group-hover:bg-muted/40"}`}>
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="mt-0.5 shrink-0">{getTimelineIcon(log.action)}</span>
                            <p className="min-w-0 break-words text-xs font-medium capitalize leading-snug">
                              {log.action.replace(/_/g, " ")}
                            </p>
                          </div>
                          <p className="text-[11px] leading-snug text-muted-foreground">
                            {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm", { locale: localeId })}
                          </p>
                          <p className="break-words text-[11px] leading-snug text-muted-foreground">
                            Oleh: {log.actor.name}
                          </p>
                          <p className="break-words text-[11px] leading-snug text-muted-foreground">
                            {getDocumentHistoryDescription(log)}
                          </p>
                        </div>
                      </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">
          Dokumen ini bersifat publik dan dapat dibagikan.
        </p>
      </div>
     </div>
    </motion.div>
    );
  }

function DocPreviewBlock({
  doc,
  label,
}: {
  doc: {
    id: string;
    name: string;
    filePath: string;
    hashFile: string;
    kepemilikanId?: string;
    fileUrl?: string;
    snapshotHighlights?: Highlight[];
  };
  label: string;
}) {
  const fileType = getFileType(doc.filePath);
  const fileUrl = doc.fileUrl || `${API_URL}/api/public/dokumen/${doc.id}/content`;
  const verified = doc.hashFile && doc.hashFile !== "-";

  if (!doc.filePath) {
    return (
      <div className="border rounded-lg p-4 bg-muted/10">
        <p className="font-medium text-sm mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">
          Pratinjau tidak tersedia
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Penanda Integritas Dokumen */}
      <div className={`px-3 py-2 flex items-center justify-between border-b text-xs font-semibold ${
        verified 
          ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900" 
          : "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900"
      }`}>
        <div className="flex items-center gap-1.5">
          {verified ? (
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          )}
          <span>{verified ? "Integritas Terverifikasi di Blockchain" : "Belum Tercatat di Blockchain"}</span>
        </div>
        {verified && doc.hashFile && (
          <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[150px] md:max-w-xs" title={doc.hashFile}>
            Hash: {doc.hashFile}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/20 border-b">
        <p className="font-medium text-sm truncate flex-1">{label}</p>
        <Badge
          variant="outline"
          className="text-[10px] ml-2 shrink-0"
        >
          {fileType === "pdf"
            ? "PDF"
            : fileType === "image"
              ? "Gambar"
              : "Dokumen"}
        </Badge>
      </div>
      <div className="bg-card">
        {fileType === "pdf" && (
          <PublicPdfPreview
            fileUrl={fileUrl}
            kepemilikanId={doc.kepemilikanId}
            snapshotHighlights={doc.snapshotHighlights}
          />
        )}
        {fileType === "image" && (
          <div className="p-4 flex justify-center">
            <img
              src={fileUrl}
              alt={label}
              className="max-w-full max-h-[600px] object-contain rounded"
            />
          </div>
        )}
        {fileType === "other" && (
          doc.fileUrl ? (
            <div className="h-[720px] bg-muted/20">
              <iframe
                src={fileUrl}
                title={label}
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Pratinjau tidak tersedia untuk format ini</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-2 inline-block"
              >
                Buka Dokumen
              </a>
            </div>
          )
        )}
      </div>
     </div>
    );
  }

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="p-2 rounded-lg bg-background border shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium capitalize mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}
