import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router";
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
}

interface DocPreviewItem {
  id: string;
  name: string;
  fileUrl: string;
  kepemilikanId?: string;
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
     case "dokumen_removed":
       return "bg-red-500 dark:bg-red-400";
     case "status_changed":
       return "bg-green-500 dark:bg-green-400";
     default:
        return "bg-muted-foreground/50";
   }
 }

export function PublicActivityPage() {
  const { id } = useParams();
  const location = useLocation();
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocPreviewItem | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const isDokumenMode = location.pathname.endsWith("/dokumen");

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem("mock_public_audit_trail");
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
        return;
      } catch {
        // ignore
      }
    }
    import("../mocks/mockPublicAuditTrail").then((m) => setLogs(m.mockAuditTrail));
  }, [id]);

  useEffect(() => {
    if (id) fetchActivity();
  }, [id]);

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
    return renderDokumenMode(activity, jType, getInitials, statusBadge);
  }

  return renderFullMode(activity, jType, getInitials, statusBadge, previewDoc, setPreviewDoc, logs, selectedLog, setSelectedLog);
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
  setSelectedLog: React.Dispatch<React.SetStateAction<ActivityLog | null>>
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
                                  fileUrl: `${API_URL}/api/public/dokumen/${doc.id}/content`,
                                  kepemilikanId: doc.kepemilikanId,
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
                          fileUrl: `${API_URL}/api/public/dokumen/${doc.id}/content`,
                          kepemilikanId: doc.kepemilikanId,
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
                    <ScrollArea className="max-h-[600px] pr-2">
                      <div className="space-y-0">
                        {logs.map((log, idx) => (
                          <button
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="w-full text-left group"
                          >
                            <div className="relative flex gap-4 pb-6 last:pb-0">
                              {idx < logs.length - 1 && (
                                <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                              )}
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${getTimelineColor(log.action)}`}>
                                <div className={`h-2.5 w-2.5 rounded-full ${getTimelineDot(log.action)}`} />
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-center gap-2">
                                  {getTimelineIcon(log.action)}
                                  <p className="text-xs font-medium capitalize">
                                    {log.action.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm", { locale: localeId })}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Oleh: {log.actor.name}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
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
                        {getCollectionChanges(selectedLog.collectionChanges).map((cc, i) => (
                          <div key={i} className="rounded-lg border p-3 text-xs">
                            <p className="font-medium capitalize mb-1">{cc.collection.replace(/_/g, " ")}</p>
                            <div className="flex gap-3 text-muted-foreground">
                              {cc.added > 0 && <span className="text-green-600">+{cc.added} ditambah</span>}
                              {cc.removed > 0 && <span className="text-red-600">-{cc.removed} dihapus</span>}
                              {cc.modified > 0 && <span className="text-blue-600">~{cc.modified} diubah</span>}
                            </div>
                          </div>
                        ))}
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
              <PublicPdfPreview fileUrl={previewDoc.fileUrl} kepemilikanId={previewDoc.kepemilikanId} />
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
  _statusBadge: (status: string) => React.ReactNode
) {
  const allDocs =
    activity.jenisBukti === "BERSAMA"
      ? activity.dokumenBersama
      : activity.dosenTerlibat.flatMap((d) => d.dokumen);

  return (
    <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
       >
       <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
             Dokumen Bukti Kegiatan
           </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activity.namaKegiatan}
          </p>
        </div>

        {activity.jenisBukti === "BERSAMA" ? (
          <div className="space-y-6">
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
          </div>
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

        {/* Blockchain status summary */}
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
  doc: { id: string; name: string; filePath: string; hashFile: string };
  label: string;
}) {
  const fileType = getFileType(doc.filePath);

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
            fileUrl={`${API_URL}/api/public/dokumen/${doc.id}/content`}
            kepemilikanId={doc.kepemilikanId}
          />
        )}
        {fileType === "image" && (
          <div className="p-4 flex justify-center">
            <img
              src={`${API_URL}/api/public/dokumen/${doc.id}/content`}
              alt={label}
              className="max-w-full max-h-[600px] object-contain rounded"
            />
          </div>
        )}
        {fileType === "other" && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Pratinjau tidak tersedia untuk format ini</p>
            <a
              href={`${API_URL}/api/public/dokumen/${doc.id}/content`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Buka Dokumen
            </a>
          </div>
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
