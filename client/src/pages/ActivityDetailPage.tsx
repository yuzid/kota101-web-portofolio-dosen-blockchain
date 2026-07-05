import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
import { StatCard } from "../components/ui/stat-card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { EmptyState } from "../components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogContent as DetailDialogContent,
  DialogHeader,
  DialogHeader as DetailDialogHeader,
  DialogTitle,
  DialogTitle as DetailDialogTitle,
  DialogDescription as DetailDialogDescription,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Highlighter,
  Edit,
  Trash2,
  Share2,
  History as HistoryIcon,
  Loader2,
  Clock,
  XCircle,
  Copy,
  GraduationCap,
  BookOpen,
  Check,
  ChevronRight,
  FileWarning,
  UserCheck,
  UserX,
  Upload,
  ShieldCheck,
  CheckCircle2 as CheckCircle2Icon,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface DosenDoc {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
  hasHighlight: boolean;
  isOwner?: boolean;
  uploadedBy?: { id: string; name: string };
  lampiranId?: string;
}

interface SharedDoc {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
  hasHighlight: boolean;
  uploadedBy: { id: string; name: string };
  isUploader: boolean;
  lampiranId?: string;
}

interface DosenBukti {
  id: string;
  name: string;
  nidn: string;
  isPencatat: boolean;
  isKetua: boolean;
  status: "MENUNGGU_KONFIRMASI" | "DITERIMA" | "DITOLAK";
  isCurrentUser?: boolean;
  dokumen: DosenDoc[];
}

interface ActivityDetail {
  id: string;
  namaKegiatan: string;
  jenisTridharma: string;
  kategori: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tahunAkademik: string;
  semester: string;
  programStudi: string;
  dosenTerlibat: DosenBukti[];
  statusKelengkapan: "lengkap" | "tidak_lengkap";
  jenisBukti: "MASING_MASING" | "BERSAMA";
  dokumenBersama?: SharedDoc[];
  currentUserId?: string;
  isCurrentUserPencatat?: boolean;
}

interface ActivityLog {
  id: string;
  txId: string;
  action: string;
  actor: string;
  publisher: string | null;
  timestamp: string;
  details: string;
  documentCount: number;
  confirmations: number;
  blockHeight: number | null;
  payload: {
    event_type?: string;
    payload_version?: number;
    recorded_at?: string;
    kegiatan?: Record<string, unknown>;
    pencatat?: Record<string, unknown> & {
      program_studi?: Record<string, unknown>;
    };
    partisipasi?: Array<Record<string, unknown>>;
    dokumen_pendukung?: Array<Record<string, unknown>>;
  };
}

const activityFieldLabels: Record<string, string> = {
  nama_kegiatan: "Nama kegiatan",
  kategori_tridharma: "Kategori Tridharma",
  jenis_kegiatan: "Jenis kegiatan",
  tanggal_mulai: "Tanggal mulai",
  tanggal_selesai: "Tanggal selesai",
  periode: "Tahun akademik",
  semester: "Semester",
};

const statusBadge: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  MENUNGGU_KONFIRMASI: {
    label: "Menunggu Konfirmasi",
    className: "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800",
    icon: <Clock className="w-3 h-3" />,
  },
  DITERIMA: {
    label: "Diterima",
    className: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  DITOLAK: {
    label: "Ditolak",
    className: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",
    icon: <XCircle className="w-3 h-3" />,
  },
};

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

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value !== "string") return String(value);
  const parsedDate = new Date(value);
  if (value.includes("T") && !Number.isNaN(parsedDate.getTime())) {
    return format(parsedDate, "dd MMM yyyy HH:mm", { locale: localeId });
  }
  return value.replaceAll("_", " ");
}

function getRecordId(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? String(record[key]) : "";
}

export function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("detail");
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMode, setShareMode] = useState<"detail" | "dokumen">("detail");
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const token = localStorage.getItem("token");
  const fromPendingConfirmation = (location.state as Record<string, unknown>)?.fromPendingConfirmation === true;
  const partisipasiId = (location.state as Record<string, unknown>)?.partisipasiId as string | undefined;

  const handleConfirmAccept = async () => {
    if (!id || !partisipasiId) return;
    setIsConfirming(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}/partisipasi/${partisipasiId}/terima`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Undangan kegiatan diterima");
        navigate("/activities");
      } else {
        toast.error(result.error || "Gagal menerima undangan");
      }
    } catch {
      toast.error("Gagal menerima undangan");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!id || !partisipasiId) return;
    setIsConfirming(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}/partisipasi/${partisipasiId}/tolak`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Undangan kegiatan ditolak");
        navigate("/activities");
      } else {
        toast.error(result.error || "Gagal menolak undangan");
      }
    } catch {
      toast.error("Gagal menolak undangan");
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (id) fetchActivityDetail();
  }, [id]);

  const fetchActivityDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        const act = result.data;
        setActivity(act);
      } else {
        toast.error(result.error || "Gagal mengambil detail kegiatan");
        navigate("/activities");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditTrail = async () => {
    if (!id || auditLoaded || isAuditLoading) return;
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}/audit-trail`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.error || "Gagal mengambil riwayat blockchain");
      }
      setLogs(result.data);
      setAuditLoaded(true);
    } catch (error) {
      setAuditError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil riwayat blockchain"
      );
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "riwayat") fetchAuditTrail();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeShareLink);
      setCopied(true);
      toast.success("Link berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Link: ${activeShareLink}`);
    }
  };

  const getPreviousLog = (log: ActivityLog) => {
    const selectedIndex = logs.findIndex((item) => item.id === log.id);
    return selectedIndex >= 0 ? logs[selectedIndex + 1] ?? null : null;
  };

  const getActivityChanges = (log: ActivityLog) => {
    const current = log.payload.kegiatan ?? {};
    const previous = getPreviousLog(log)?.payload.kegiatan ?? null;
    return Object.entries(activityFieldLabels)
      .filter(([field]) => !previous || current[field] !== previous[field])
      .map(([field, label]) => ({
        label,
        before: previous?.[field],
        after: current[field],
        isInitial: !previous,
      }));
  };

  const getCollectionChanges = (
    log: ActivityLog,
    collection: "partisipasi" | "dokumen_pendukung",
    idKey: string,
  ) => {
    const current = log.payload[collection] ?? [];
    const previous = getPreviousLog(log)?.payload[collection] ?? [];
    const currentById = new Map(current.map((item) => [getRecordId(item, idKey), item]));
    const previousById = new Map(previous.map((item) => [getRecordId(item, idKey), item]));
    return {
      added: current.filter((item) => !previousById.has(getRecordId(item, idKey))),
      removed: previous.filter((item) => !currentById.has(getRecordId(item, idKey))),
      changed: current.filter((item) => {
        const oldItem = previousById.get(getRecordId(item, idKey));
        return oldItem && JSON.stringify(oldItem) !== JSON.stringify(item);
      }),
    };
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Kegiatan berhasil dihapus");
        navigate("/activities");
      } else {
        toast.error(result.error || "Gagal menghapus kegiatan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus kegiatan");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <MainLayout
        title="Detail Kegiatan"
        breadcrumbs={[
          { label: "Kegiatan Tridharma", path: "/activities" },
          { label: "Detail" },
        ]}
      >
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded-xl animate-pulse" />
            <div className="h-20 bg-muted rounded-xl animate-pulse" />
            <div className="h-20 bg-muted rounded-xl animate-pulse" />
            <div className="h-20 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!activity) return null;

  const isCurrentUserMember = activity.dosenTerlibat.some(
    (d) => d.isCurrentUser
  );
  const isReadOnlyView =
    !isCurrentUserMember || location.pathname.includes("/ami-recap/");
  const shareLinkDetail = `${window.location.origin}/public/kegiatan/${id}`;
  const shareLinkDokumen = `${window.location.origin}/public/kegiatan/${id}/dokumen`;
  const activeShareLink = shareMode === "detail" ? shareLinkDetail : shareLinkDokumen;

  const jType = activity.jenisTridharma?.toLowerCase() || "";

  return (
    <MainLayout
      title="Detail Kegiatan"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Kegiatan Tridharma", path: "/activities" },
        { label: "Detail Kegiatan" },
      ]}
    >
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
        <div className="space-y-6 max-w-5xl mx-auto">
         {/* ── Top Bar ── */}
         <div className="flex items-center justify-between">
           <Button variant="ghost" onClick={() => navigate(-1)}>
             <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
           </Button>
          <div className="flex gap-2">
            <RippleButton
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-1.5" /> Bagikan
            </RippleButton>
            {!isReadOnlyView && (
              <RippleButton
                variant="outline"
                size="sm"
                onClick={() => navigate(`/activities/${id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-1.5" /> Edit
              </RippleButton>
            )}
            {activity.isCurrentUserPencatat &&
              !location.pathname.includes("/ami-recap/") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                </Button>
              )}
          </div>
        </div>

        {/* ── Share Dialog ── */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bagikan Kegiatan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex gap-3">
                <div
                  className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                    shareMode === "detail"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => { setShareMode("detail"); setCopied(false); }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      shareMode === "detail" ? "border-primary bg-primary" : ""
                    }`}>
                      {shareMode === "detail" && <div className="w-1.5 h-1.5 rounded-full bg-white m-0.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Detail Kegiatan</p>
                      <p className="text-xs text-muted-foreground">
                        Bagikan halaman detail kegiatan lengkap
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                    shareMode === "dokumen"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => { setShareMode("dokumen"); setCopied(false); }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      shareMode === "dokumen" ? "border-primary bg-primary" : ""
                    }`}>
                      {shareMode === "dokumen" && <div className="w-1.5 h-1.5 rounded-full bg-white m-0.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dokumen Saja</p>
                      <p className="text-xs text-muted-foreground">
                        Bagikan dokumen tanpa detail kegiatan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {shareMode === "detail" ? "Link detail kegiatan" : "Link dokumen"}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={activeShareLink}
                    readOnly
                    className="font-mono text-sm flex-1 min-w-0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-600" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" /> Salin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {fromPendingConfirmation && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-blue-900 dark:text-blue-300">Undangan Kegiatan</p>
                <p className="text-sm text-blue-700 mt-1">
                  Anda diundang sebagai anggota kegiatan ini. Konfirmasi untuk melanjutkan.
                </p>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
              <RippleButton
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmAccept}
                disabled={isConfirming}
              >
                <Check className="w-4 h-4 mr-1" /> Terima
              </RippleButton>
              <RippleButton
                size="sm"
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={isConfirming}
              >
                <XCircle className="w-4 h-4 mr-1" /> Tolak
              </RippleButton>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero Card ── */}
        <Card
          className={`overflow-hidden border-l-4 ${
            jenisColor[jType] || "border-l-gray-300"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={jenisBadge[jType] || ""}>
                    {jenisIcon[jType]}{" "}
                    <span className="ml-1 capitalize">
                      {activity.jenisTridharma?.replace("_", " ") || "-"}
                    </span>
                  </Badge>
                  <Badge variant="secondary">{activity.kategori}</Badge>
                  {getKelengkapanBadge(activity.statusKelengkapan)}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {activity.namaKegiatan}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="detail">
              <FileText className="w-4 h-4 mr-2" /> Detail Kegiatan
            </TabsTrigger>
            <TabsTrigger value="riwayat">
              <HistoryIcon className="w-4 h-4 mr-2" /> Riwayat Blockchain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-6 mt-4">
            {/* ── Info Grid ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informasi Kegiatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Tanggal Mulai"
                    value={format(
                      new Date(activity.tanggalMulai),
                      "dd MMMM yyyy",
                      { locale: localeId }
                    )}
                  />
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Tanggal Selesai"
                    value={format(
                      new Date(activity.tanggalSelesai),
                      "dd MMMM yyyy",
                      { locale: localeId }
                    )}
                  />
                  <InfoItem
                    icon={<GraduationCap className="w-4 h-4" />}
                    label="Tahun Akademik"
                    value={activity.tahunAkademik}
                  />
                  <InfoItem
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Semester"
                    value={activity.semester}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Dokumen Bersama ── */}
            {activity.jenisBukti === "BERSAMA" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Dokumen Bersama
                    <Badge variant="secondary" className="text-xs">
                      {activity.dokumenBersama?.length || 0} file
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.dokumenBersama &&
                  activity.dokumenBersama.length > 0 ? (
                    <div className="space-y-2">
                      {activity.dokumenBersama.map((doc) => (
                        <FileRow key={doc.id} doc={doc} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">Belum ada dokumen bersama</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Dosen Terlibat ── */}
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
                {activity.jenisBukti === "MASING_MASING" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Setiap dosen memiliki dokumen bukti masing-masing
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.dosenTerlibat.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="border rounded-xl overflow-hidden"
                  >
                    {/* Dosen header */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {getInitials(dosen.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm truncate">
                              {dosen.name}
                            </span>
                            {dosen.isPencatat && (
                               <Badge className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs h-5">
                                 Pembuat
                               </Badge>
                             )}
                             {dosen.isKetua && !dosen.isPencatat && (
                               <Badge className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs h-5">
                                 Ketua
                               </Badge>
                             )}
                          </div>
                          {dosen.nidn && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              NIDN: {dosen.nidn}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(dosen.status || "MENUNGGU_KONFIRMASI")}
                        {activity.jenisBukti !== "BERSAMA" &&
                           (dosen.dokumen.length > 0 ? (
                             <Badge className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs whitespace-nowrap">
                               <CheckCircle className="w-3 h-3 mr-1" />
                               {dosen.dokumen.length} dokumen
                             </Badge>
                           ) : (
                             <Badge
                               variant="outline"
                               className="text-xs text-muted-foreground whitespace-nowrap"
                             >
                               Belum upload
                             </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Dokumen list per dosen */}
                    {activity.jenisBukti !== "BERSAMA" && (
                      <div className="p-4 space-y-2">
                        {dosen.dokumen.length > 0 ? (
                          dosen.dokumen.map((doc) => {
                            const isOwner =
                              "isOwner" in doc ? (doc as any).isOwner : true;
                            const uploadedBy = (doc as any).uploadedBy;
                            return (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {doc.name}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {doc.jenis}
                                      </Badge>
                                      {!isOwner && uploadedBy && (
                                        <span className="text-xs text-muted-foreground">
                                          Upload: {uploadedBy.name}
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {format(
                                          new Date(doc.tanggalUpload),
                                          "dd MMM yyyy",
                                          { locale: localeId }
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {doc.hasHighlight && (
                                    <Highlighter className="w-4 h-4 text-yellow-500" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/documents/${doc.id}/preview`, {
                                        state: {
                                          isDocumentOwner: dosen.isCurrentUser === true,
                                          activityId: activity.id,
                                          breadcrumbs: [
                                            {
                                              label: "Beranda",
                                              path: "/dashboard",
                                            },
                                            {
                                              label: "Kegiatan Tridharma",
                                              path: "/activities",
                                            },
                                            {
                                              label: activity.namaKegiatan,
                                              path: `/activities/${id}`,
                                            },
                                            { label: doc.name },
                                          ],
                                        },
                                      })
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {dosen.status === "DITERIMA"
                              ? dosen.isCurrentUser
                                ? "Anda belum mengupload dokumen bukti"
                                : "Dosen ini belum mengupload dokumen bukti"
                              : dosen.status === "MENUNGGU_KONFIRMASI"
                              ? dosen.isCurrentUser
                                ? "Anda belum konfirmasi keikutsertaan"
                                : "Menunggu konfirmasi dosen"
                              : "Dosen telah menolak keikutsertaan"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                 label="Total Dosen Terlibat"
                 value={activity.dosenTerlibat.length}
                 color="blue"
               />
               <StatCard
                 icon={<FileText className="w-5 h-5" />}
                 label={
                   activity.jenisBukti === "BERSAMA"
                     ? "Total Dokumen Bersama"
                     : "Total Dokumen Bukti"
                 }
                 value={
                   activity.jenisBukti === "BERSAMA"
                     ? (activity.dokumenBersama?.length || 0)
                     : activity.dosenTerlibat
                         .reduce((s, d) => s + d.dokumen.length, 0)
                 }
                 color="emerald"
               />
               <StatCard
                 icon={<AlertCircle className="w-5 h-5" />}
                 label={
                   activity.jenisBukti === "BERSAMA"
                     ? "Status Dokumen"
                     : "Dosen Belum Upload"
                 }
                 value={
                   activity.jenisBukti === "BERSAMA"
                     ? activity.dokumenBersama &&
                       activity.dokumenBersama.length > 0
                       ? "Ada"
                       : "Kosong"
                     : activity.dosenTerlibat
                         .filter(
                           (d) =>
                             d.dokumen.length === 0 && d.status === "DITERIMA"
                         )
                         .length
                 }
                 color="amber"
               />
            </div>
          </TabsContent>

          <TabsContent value="riwayat" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                  Riwayat Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAuditLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mengambil riwayat dari blockchain...</span>
                  </div>
                ) : auditError ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <p className="text-sm text-destructive">{auditError}</p>
                    <Button variant="outline" onClick={() => fetchAuditTrail()}>
                      Coba Lagi
                    </Button>
                  </div>
                ) : logs.length > 0 ? (
                  <div className="space-y-0">
                    {logs.map((log, idx) => (
                      <div
                        key={log.id}
                        role="button"
                        tabIndex={0}
                        className="relative flex gap-4 pb-8 last:pb-0 cursor-pointer transition-colors hover:bg-muted/30 rounded-lg px-3 py-2 -mx-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setSelectedLog(log)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedLog(log);
                          }
                        }}
                      >
                        {idx < logs.length - 1 && (
                          <div className="absolute left-[23px] top-10 h-full w-px bg-border" />
                        )}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                          {getTimelineIcon(log.action)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium capitalize">
                              {log.action.replaceAll("_", " ").toLowerCase()}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(log.timestamp),
                                "dd MMM yyyy, HH:mm",
                                { locale: localeId }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Oleh: {log.actor}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Tx: {log.txId.slice(0, 12)}...</span>
                            <span>Blok #{log.blockHeight ?? "-"}</span>
                            <span>{log.confirmations} konfirmasi</span>
                            <span>{log.documentCount} dokumen</span>
                          </div>
                        </div>
                        <div className="shrink-0 self-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-muted-foreground">
                    <HistoryIcon className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">
                      Belum ada riwayat tercatat untuk kegiatan ini.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
       </div>
       </motion.div>

       <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Kegiatan?"
        description={`Apakah Anda yakin ingin menghapus kegiatan ${activity?.namaKegiatan}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DetailDialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          {selectedLog && (() => {
            const activityChanges = getActivityChanges(selectedLog);
            const participantChanges = getCollectionChanges(selectedLog, "partisipasi", "dosen_id");
            const documentChanges = getCollectionChanges(selectedLog, "dokumen_pendukung", "dokumen_id");
            const activitySnapshot = selectedLog.payload.kegiatan ?? {};
            const recorder = selectedLog.payload.pencatat ?? {};
            const participants = selectedLog.payload.partisipasi ?? [];
            const documents = selectedLog.payload.dokumen_pendukung ?? [];
            const hasCollectionChanges =
              participantChanges.added.length > 0 ||
              participantChanges.removed.length > 0 ||
              participantChanges.changed.length > 0 ||
              documentChanges.added.length > 0 ||
              documentChanges.removed.length > 0 ||
              documentChanges.changed.length > 0;

            return (
              <>
                <DetailDialogHeader className="border-b px-6 py-5 pr-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <DetailDialogTitle>Detail Perubahan</DetailDialogTitle>
                    <Badge variant="secondary">
                      {selectedLog.action.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <DetailDialogDescription>
                    Dicatat oleh {selectedLog.actor} pada{" "}
                    {format(new Date(selectedLog.timestamp), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                  </DetailDialogDescription>
                </DetailDialogHeader>

                <ScrollArea className="max-h-[calc(90vh-110px)]">
                  <div className="space-y-6 p-6">
                    <section className="grid gap-3 sm:grid-cols-3">
                      <div className="border p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Block</p>
                        <p className="mt-1 font-medium">#{selectedLog.blockHeight ?? "Belum dikonfirmasi"}</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Konfirmasi</p>
                        <p className="mt-1 font-medium">{selectedLog.confirmations}</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Versi payload</p>
                        <p className="mt-1 font-medium">{selectedLog.payload.payload_version ?? "-"}</p>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div>
                        <h3 className="font-semibold">Perubahan Tercatat</h3>
                        <p className="text-sm text-muted-foreground">
                          Dibandingkan dengan snapshot blockchain sebelumnya.
                        </p>
                      </div>

                      {activityChanges.length > 0 && (
                        <div className="divide-y border rounded-lg">
                          {activityChanges.map((change) => (
                            <div key={change.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[170px_1fr]">
                              <p className="text-sm font-medium">{change.label}</p>
                              {change.isInitial ? (
                                <p className="text-sm">{formatAuditValue(change.after)}</p>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-muted-foreground line-through">
                                    {formatAuditValue(change.before)}
                                  </span>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="font-medium">{formatAuditValue(change.after)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {participantChanges.added.map((p) => (
                        <div key={`pa-${getRecordId(p, "dosen_id")}`} className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-900 dark:text-green-300 rounded-lg">
                           Dosen ditambahkan: <strong>{String(p.nama ?? "-")}</strong> sebagai {formatAuditValue(p.peran)}.
                         </div>
                       ))}
                       {participantChanges.removed.map((p) => (
                         <div key={`pr-${getRecordId(p, "dosen_id")}`} className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-900 dark:text-red-300 rounded-lg">
                           Dosen dihapus: <strong>{String(p.nama ?? "-")}</strong>.
                         </div>
                       ))}
                       {participantChanges.changed.map((p) => (
                         <div key={`pc-${getRecordId(p, "dosen_id")}`} className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-300 rounded-lg">
                           Data partisipasi berubah: <strong>{String(p.nama ?? "-")}</strong>.
                         </div>
                       ))}
 
                       {documentChanges.added.map((d) => (
                         <div key={`da-${getRecordId(d, "dokumen_id")}`} className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-900 dark:text-green-300 rounded-lg">
                           Dokumen ditambahkan: <strong>{String(d.nama ?? "-")}</strong>.
                         </div>
                       ))}
                       {documentChanges.removed.map((d) => (
                         <div key={`dr-${getRecordId(d, "dokumen_id")}`} className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-900 dark:text-red-300 rounded-lg">
                           Dokumen dihapus: <strong>{String(d.nama ?? "-")}</strong>.
                         </div>
                       ))}
                       {documentChanges.changed.map((d) => (
                         <div key={`dc-${getRecordId(d, "dokumen_id")}`} className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-300 rounded-lg">
                           Data atau hash dokumen berubah: <strong>{String(d.nama ?? "-")}</strong>.
                         </div>
                      ))}

                      {activityChanges.length === 0 && !hasCollectionChanges && (
                        <div className="border bg-muted/30 px-4 py-3 text-sm text-muted-foreground rounded-lg">
                          Tidak ada perbedaan data dengan snapshot sebelumnya.
                        </div>
                      )}
                    </section>

                    <section className="space-y-3">
                      <h3 className="font-semibold">Snapshot Kegiatan</h3>
                      <div className="grid gap-x-6 gap-y-3 border rounded-lg p-4 sm:grid-cols-2">
                        {Object.entries(activityFieldLabels).map(([field, label]) => (
                          <div key={field}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="mt-1 text-sm font-medium">{formatAuditValue(activitySnapshot[field])}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="font-semibold">Pencatat dan Publisher</h3>
                      <div className="space-y-3 border rounded-lg p-4 text-sm">
                        <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                          <span className="text-muted-foreground">Nama</span>
                          <span className="font-medium">{String(recorder.nama ?? selectedLog.actor)}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                          <span className="text-muted-foreground">Program studi</span>
                          <span>{String(recorder.program_studi?.nama ?? "-")}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                          <span className="text-muted-foreground">Publisher</span>
                          <span className="break-all font-mono text-xs">{selectedLog.publisher ?? "-"}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                          <span className="text-muted-foreground">Transaction ID</span>
                          <span className="break-all font-mono text-xs">{selectedLog.txId}</span>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="font-semibold">Dosen Terlibat ({participants.length})</h3>
                      {participants.length > 0 ? (
                        <div className="divide-y border rounded-lg">
                          {participants.map((p) => (
                            <div key={getRecordId(p, "dosen_id")} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">{String(p.nama ?? "-")}</p>
                                <p className="text-xs text-muted-foreground">NIDN {String(p.nidn ?? "-")}</p>
                              </div>
                              <Badge variant="outline">{formatAuditValue(p.peran)}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState title="Tidak Ada Partisipan" description="Tidak ada data partisipan pada snapshot ini." icon={Users} />
                      )}
                    </section>

                    <section className="space-y-3">
                      <h3 className="font-semibold">Dokumen Pendukung ({documents.length})</h3>
                      {documents.length > 0 ? (
                        <div className="divide-y border rounded-lg">
                          {documents.map((d) => (
                            <div key={getRecordId(d, "dokumen_id")} className="space-y-2 px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">{String(d.nama ?? "-")}</p>
                                <Badge variant="outline">{formatAuditValue(d.jenis_dokumen)}</Badge>
                              </div>
                              <p className="break-all font-mono text-xs text-muted-foreground">SHA-256: {String(d.hash_file ?? "-")}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="border rounded-lg p-4 text-sm text-muted-foreground">Tidak ada dokumen pendukung pada snapshot ini.</p>
                      )}
                    </section>
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DetailDialogContent>
      </Dialog>
    </MainLayout>
  );
}

/* ── Helper Functions ── */

function getTimelineIcon(action: string) {
  const a = action.toUpperCase();
  if (a.includes("CREATED") || a.includes("ADDED")) {
    return <Upload className="h-4 w-4 text-blue-500" />;
  }
  if (a.includes("UPDATED") || a.includes("EDITED")) {
    return <Edit className="h-4 w-4 text-amber-500" />;
  }
  if (a.includes("REMOVED") || a.includes("DELETED")) {
    return <Trash2 className="h-4 w-4 text-red-500" />;
  }
  if (a.includes("CONFIRMED") || a.includes("VERIFIED")) {
    return <ShieldCheck className="h-4 w-4 text-green-500" />;
  }
  if (a.includes("PARTISIPASI") || a.includes("MEMBER")) {
    return <UserCheck className="h-4 w-4 text-blue-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

/* ── Helper Components ── */

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



function FileRow({
  doc,
  activity,
}: {
  doc: SharedDoc;
  activity: ActivityDetail;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 shrink-0">
           <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{doc.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {doc.jenis}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Upload: {doc.uploadedBy.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(doc.tanggalUpload), "dd MMM yyyy", {
                locale: localeId,
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {doc.hasHighlight && (
          <Highlighter className="w-4 h-4 text-yellow-500" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/documents/${doc.id}/preview`, {
              state: {
                isDocumentOwner: doc.isUploader === true,
                activityId: activity.id,
                breadcrumbs: [
                  { label: "Beranda", path: "/dashboard" },
                  { label: "Kegiatan Tridharma", path: "/activities" },
                  { label: activity.namaKegiatan, path: `/activities/${id}` },
                  { label: doc.name },
                ],
              },
            })
          }
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function getKelengkapanBadge(status: string) {
  if (status === "lengkap") {
    return (
      <Badge variant="outline" className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />
        Dokumen Lengkap
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs">
      <AlertCircle className="w-3 h-3 mr-1" />
      Dokumen Tidak Lengkap
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const s = statusBadge[status];
  if (!s)
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  return (
    <Badge variant="outline" className={`${s.className} text-xs`}>
      <span className="flex items-center gap-1">
        {s.icon}
        {s.label}
      </span>
    </Badge>
  );
}
