import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
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
  UserCheck,
  UserX,
  XCircle,
  Ban,
  Shield,
  Upload,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import {
  getKonfirmasi,
  getKonfirmasiByKegiatan,
  updateKonfirmasi,
  createKonfirmasi,
} from "../lib/kegiatanKonfirmasi";

interface DosenBukti {
  id: string;
  name: string;
  nidn: string;
  isPencatat: boolean;
  isKetua: boolean;
  dokumen: {
    id: string;
    name: string;
    jenis: string;
    tanggalUpload: string;
    hasHighlight: boolean;
  }[];
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
  sumberDana: string;
  biaya: number;
  programStudi: string;
  dosenTerlibat: DosenBukti[];
  statusKelengkapan: "lengkap" | "tidak_lengkap";
  jenisBukti?: "masing-masing" | "bersama";
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
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("detail");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (id) {
      fetchActivityDetail();
    }
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
        setActivity(result.data);
      } else {
        toast.error(result.error || "Gagal mengambil detail kegiatan");
        if (
          !result.error?.includes("Format") &&
          !result.error?.includes("ditemukan")
        ) {
          navigate("/activities");
        }
      }
    } catch (error) {
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
    if (value === "riwayat") {
      void fetchAuditTrail();
    }
  };

  const handleAccept = () => {
    if (!id || !user?.uuid || !activity) return;
    const existing = getKonfirmasi(id, user.uuid);
    if (!existing) {
      const pencatat = activity.dosenTerlibat.find((d) => d.isPencatat);
      createKonfirmasi(
        id,
        [user.uuid],
        pencatat?.id || "",
        pencatat?.name || "Pembuat Kegiatan",
        activity.namaKegiatan
      );
    }
    updateKonfirmasi(id, user.uuid, "diterima");
    toast.success("Anda menerima undangan kegiatan ini.");
    addNotification({
      type: "approval",
      title: "Undangan Kegiatan Diterima",
      description: `Anda menerima undangan kegiatan "${activity?.namaKegiatan}".`,
      actor: user.name,
      priority: "medium",
      category: "Kegiatan",
    });
  };

  const handleReject = () => {
    if (!id || !user?.uuid || !activity) return;
    const existing = getKonfirmasi(id, user.uuid);
    if (!existing) {
      const pencatat = activity.dosenTerlibat.find((d) => d.isPencatat);
      createKonfirmasi(
        id,
        [user.uuid],
        pencatat?.id || "",
        pencatat?.name || "Pembuat Kegiatan",
        activity.namaKegiatan
      );
    }
    updateKonfirmasi(id, user.uuid, "ditolak");
    toast.info("Anda menolak undangan kegiatan ini.");
    addNotification({
      type: "approval",
      title: "Undangan Kegiatan Ditolak",
      description: `Anda menolak undangan kegiatan "${activity?.namaKegiatan}".`,
      actor: user.name,
      priority: "low",
      category: "Kegiatan",
    });
    navigate("/activities");
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
    idKey: string
  ) => {
    const current = log.payload[collection] ?? [];
    const previous = getPreviousLog(log)?.payload[collection] ?? [];
    const currentById = new Map(
      current.map((item) => [getRecordId(item, idKey), item])
    );
    const previousById = new Map(
      previous.map((item) => [getRecordId(item, idKey), item])
    );

    return {
      added: current.filter(
        (item) => !previousById.has(getRecordId(item, idKey))
      ),
      removed: previous.filter(
        (item) => !currentById.has(getRecordId(item, idKey))
      ),
      changed: current.filter((item) => {
        const oldItem = previousById.get(getRecordId(item, idKey));
        return oldItem && JSON.stringify(oldItem) !== JSON.stringify(item);
      }),
    };
  };

  if (isLoading) {
    return (
      <MainLayout
        title="Memuat Detail..."
        breadcrumbs={[
          { label: "Kegiatan Tridharma", path: "/activities" },
          { label: "Detail" },
        ]}
      >
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Mengambil data kegiatan...</p>
        </div>
      </MainLayout>
    );
  }

  if (!activity) return null;

  const isPencatat =
    activity.dosenTerlibat.find((d) => d.isPencatat)?.id === user?.uuid;

  const isAnggotaTerlibat = activity.dosenTerlibat.some(
    (d) => d.id === user?.uuid
  );

  const konfirmasiSaya = user?.uuid
    ? getKonfirmasi(activity.id, user.uuid)
    : undefined;
  // No record = treat as menunggu for non-pembuat
  const statusSaya =
    konfirmasiSaya?.status ||
    (isAnggotaTerlibat && !isPencatat ? "menunggu" : undefined);
  const isUndangan = statusSaya === "menunggu" && !isPencatat;
  const isInvolved = isPencatat || konfirmasiSaya?.status === "diterima";
  const konfirmasiAll = getKonfirmasiByKegiatan(activity.id);
  const jenisBukti = (activity as any).jenisBukti || "masing-masing";

  const getStatusKonfirmasiBadge = (dosenId: string) => {
    const k = konfirmasiAll.find((k) => k.dosenId === dosenId);
    if (!k) return null;
    if (k.status === "diterima") {
      return (
        <Badge
          variant="outline"
          className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
        >
          <UserCheck className="w-3 h-3 mr-1" />
          Dikonfirmasi
        </Badge>
      );
    }
    if (k.status === "menunggu") {
      return (
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
        >
          <Clock className="w-3 h-3 mr-1" />
          Menunggu
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
      >
        <UserX className="w-3 h-3 mr-1" />
        Ditolak
      </Badge>
    );
  };

  const handleEdit = () => {
    navigate(`/activities/${id}/edit`);
  };

  const handleDelete = async () => {
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
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus kegiatan");
    }
  };

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Link berhasil disalin"))
      .catch(() => toast.error("Gagal menyalin link"));
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis.toLowerCase()) {
      case "pengajaran":
        return <Badge className="bg-blue-500">Pendidikan</Badge>;
      case "penelitian":
        return <Badge className="bg-green-500">Penelitian</Badge>;
      case "pengabdian":
        return <Badge className="bg-purple-500">Pengabdian</Badge>;
      case "tugas_tambahan":
        return <Badge className="bg-orange-500">Tugas Tambahan</Badge>;
      default:
        return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  const getKelengkapanBadge = () => {
    if (!activity) return null;

    const nonDitolak = activity.dosenTerlibat.filter(
      (d) =>
        !konfirmasiAll.find((k) => k.dosenId === d.id && k.status === "ditolak")
    );

    let lengkap = false;
    if (jenisBukti === "bersama") {
      // Bukti bersama: cukup 1 dokumen oleh siapapun
      lengkap = activity.dosenTerlibat.some((d) => d.dokumen.length > 0);
    } else {
      // Masing-masing: SEMUA dosen (yg tidak ditolak) harus punya dokumen
      lengkap = nonDitolak.every((d) => d.dokumen.length > 0);
    }

    if (lengkap) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="w-4 h-4 mr-1" />
          Dokumen Lengkap
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500 text-white">
        <AlertCircle className="w-4 h-4 mr-1" />
        Dokumen Tidak Lengkap
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout
      title="Detail Kegiatan"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Kegiatan Tridharma", path: "/activities" },
        { label: "Detail Kegiatan" },
      ]}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Back Button + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          {isInvolved && !isUndangan && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Bagikan
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {isPencatat && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Undangan Banner */}
        {isUndangan && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-lg">Undangan Kegiatan</p>
                    <p className="text-sm text-muted-foreground">
                      Anda diundang oleh{" "}
                      {activity.dosenTerlibat.find((d) => d.isPencatat)?.name ||
                        "pencatat"}{" "}
                      untuk bergabung sebagai anggota kegiatan ini.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAccept}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Terima
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                    onClick={handleReject}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getJenisBadge(activity.jenisTridharma)}
                  <Badge variant="secondary">{activity.kategori}</Badge>
                  <Badge
                    variant="outline"
                    className="text-purple-600 border-purple-300"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {jenisBukti === "bersama"
                      ? "Bukti Bersama"
                      : "Bukti Masing-masing"}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold">{activity.namaKegiatan}</h2>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
              <div>{getKelengkapanBadge()}</div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="detail">
              <FileText className="w-4 h-4 mr-2" />
              Detail Kegiatan
            </TabsTrigger>
            <TabsTrigger value="riwayat">
              <HistoryIcon className="w-4 h-4 mr-2" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          {/* Tab: Detail */}
          <TabsContent value="detail" className="space-y-6 mt-4">
            {/* Informasi Kegiatan */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kegiatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tanggal Mulai
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(activity.tanggalMulai),
                          "dd MMMM yyyy",
                          { locale: localeId }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tanggal Selesai
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(activity.tanggalSelesai),
                          "dd MMMM yyyy",
                          { locale: localeId }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tahun Akademik
                    </label>
                    <p className="font-medium">{activity.tahunAkademik}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Semester
                    </label>
                    <p className="font-medium capitalize">
                      {activity.semester}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Jenis Bukti
                    </label>
                    <p className="font-medium">
                      {jenisBukti === "bersama"
                        ? "Bukti Bersama"
                        : "Bukti diunggah masing-masing"}
                    </p>
                  </div>

                  {activity.sumberDana && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Sumber Dana
                      </label>
                      <p className="font-medium">{activity.sumberDana}</p>
                    </div>
                  )}

                  {activity.biaya > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Biaya Kegiatan
                      </label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatRupiah(activity.biaya)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dosen Terlibat & Bukti Dokumen */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dosen Terlibat & Bukti Dokumen</CardTitle>
                  <Badge variant="outline">
                    <Users className="w-4 h-4 mr-1" />
                    {activity.dosenTerlibat.length} Dosen
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {activity.dosenTerlibat.map((dosen) => {
                  const kStatus = konfirmasiAll.find(
                    (k) => k.dosenId === dosen.id
                  );
                  const isDitolak = kStatus?.status === "ditolak";
                  return (
                    <div
                      key={dosen.id}
                      className={`border rounded-lg p-4 space-y-4 ${
                        isDitolak ? "opacity-50" : ""
                      }`}
                    >
                      {/* Dosen Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(dosen.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{dosen.name}</p>
                              {dosen.isPencatat && (
                                <Badge className="bg-blue-500">Pembuat</Badge>
                              )}
                              {dosen.isKetua && (
                                <Badge className="bg-purple-500">Ketua</Badge>
                              )}
                              {!dosen.isPencatat && !dosen.isKetua && (
                                <Badge variant="secondary">Anggota</Badge>
                              )}
                              {!dosen.isPencatat &&
                                getStatusKonfirmasiBadge(dosen.id)}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              {dosen.nidn
                                ? `NIDN/NIP: ${dosen.nidn}`
                                : "Data identitas tidak tersedia"}
                            </p>
                          </div>
                        </div>
                        {jenisBukti === "masing-masing" && !isDitolak && (
                          <div className="text-right">
                            {dosen.dokumen.length > 0 ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {dosen.dokumen.length} Dokumen
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Belum Upload
                              </Badge>
                            )}
                          </div>
                        )}
                        {isDitolak && (
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className="text-red-600 border-red-300"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Tidak Terlibat
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Dokumen List — berbeda tampilan untuk masing-masing vs bersama */}
                      {!isDitolak && (
                        <>
                          {jenisBukti === "masing-masing" &&
                            dosen.dokumen.length > 0 && (
                              <div className="space-y-2 pl-12">
                                <label className="text-sm font-medium text-muted-foreground">
                                  Dokumen Bukti:
                                </label>
                                {dosen.dokumen.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <FileText className="w-5 h-5 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium text-sm">
                                          {doc.name}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {doc.jenis}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            Upload:{" "}
                                            {format(
                                              new Date(doc.tanggalUpload),
                                              "dd MMM yyyy",
                                              { locale: localeId }
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {doc.hasHighlight && (
                                        <Highlighter className="w-4 h-4 text-yellow-500" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          navigate(
                                            `/documents/${doc.id}/preview`,
                                            {
                                              state: {
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
                                                    label:
                                                      activity.namaKegiatan,
                                                    path: `/activities/${id}`,
                                                  },
                                                  { label: doc.name },
                                                ],
                                              },
                                            }
                                          )
                                        }
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                          {jenisBukti === "masing-masing" &&
                            dosen.dokumen.length === 0 &&
                            dosen.isPencatat && (
                              <div className="pl-12 text-sm text-muted-foreground italic">
                                Upload dokumen bukti untuk melengkapi kegiatan
                                ini.
                              </div>
                            )}

                          {jenisBukti === "masing-masing" &&
                            dosen.dokumen.length === 0 &&
                            !dosen.isPencatat && (
                              <div className="pl-12 text-sm text-muted-foreground italic">
                                Dosen ini belum mengupload dokumen bukti.
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Bukti Bersama Section */}
                {jenisBukti === "bersama" && (
                  <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold">Dokumen Bukti Bersama</h4>
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-300"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Bukti Bersama
                        </Badge>
                      </div>
                      {isPencatat && (
                        <Badge className="bg-green-500">
                          <Shield className="w-3 h-3 mr-1" />
                          Uploader
                        </Badge>
                      )}
                    </div>

                    {/* Shared documents for bersama */}
                    {(() => {
                      const allDocs = activity.dosenTerlibat.flatMap((d) =>
                        d.dokumen.map((doc) => ({
                          ...doc,
                          dosenNama: d.name,
                          dosenId: d.id,
                        }))
                      );
                      const uniqueDocs = Array.from(
                        new Map(allDocs.map((doc) => [doc.id, doc])).values()
                      );

                      return uniqueDocs.length > 0 ? (
                        <div className="space-y-2">
                          {uniqueDocs.map((doc) => {
                            const uploader = activity.dosenTerlibat.find(
                              (d) => d.id === doc.dosenId
                            );
                            const canEdit =
                              isPencatat ||
                              user?.roles?.includes("administrator");
                            return (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-background"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-sm">
                                      {doc.name}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {doc.jenis}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Upload oleh: {doc.dosenNama}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(
                                          new Date(doc.tanggalUpload),
                                          "dd MMM yyyy",
                                          { locale: localeId }
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Dokumen ini terhubung ke seluruh dosen
                                      yang menyetujui keterlibatannya.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.hasHighlight && (
                                    <Highlighter className="w-4 h-4 text-yellow-500" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/documents/${doc.id}/preview`, {
                                        state: {
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
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg bg-background">
                          <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Belum ada dokumen bukti bersama</p>
                          {isPencatat && (
                            <p className="text-sm mt-1">
                              Upload satu dokumen yang akan menjadi bukti
                              bersama
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Hanya uploader/pencatat yang dapat mengedit atau menghapus
                      dokumen bukti bersama. Dosen lain hanya dapat melihat.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Dosen Terlibat
                    </p>
                    <p className="text-2xl font-bold">
                      {activity.dosenTerlibat.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Dokumen Bukti
                    </p>
                    <p className="text-2xl font-bold">
                      {activity.dosenTerlibat.reduce(
                        (sum, d) => sum + d.dokumen.length,
                        0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {jenisBukti === "bersama"
                        ? "Dosen Dikonfirmasi"
                        : "Dosen Belum Upload"}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {jenisBukti === "bersama"
                        ? konfirmasiAll.filter(
                            (k) => k.status === "diterima" || !k
                          ).length
                        : activity.dosenTerlibat.filter(
                            (d) => d.dokumen.length === 0
                          ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Riwayat */}
          <TabsContent value="riwayat" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Aktivitas</CardTitle>
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
                    <Button
                      variant="outline"
                      onClick={() => void fetchAuditTrail()}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                ) : logs.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Aksi</TableHead>
                          <TableHead>Pelaku</TableHead>
                          <TableHead>Transaksi</TableHead>
                          <TableHead>Blok</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow
                            key={log.id}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            onClick={() => setSelectedLog(log)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedLog(log);
                              }
                            }}
                          >
                            <TableCell className="text-sm">
                              {format(
                                new Date(log.timestamp),
                                "dd MMM yyyy HH:mm",
                                { locale: localeId }
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {log.action.replaceAll("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.actor}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p
                                  className="font-mono text-xs"
                                  title={log.txId}
                                >
                                  {log.txId.slice(0, 12)}...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.documentCount} dokumen pendukung
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1 text-sm">
                                  <p>#{log.blockHeight ?? "-"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.confirmations} konfirmasi
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <HistoryIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Belum ada riwayat tercatat untuk kegiatan ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog
          open={selectedLog !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedLog(null);
          }}
        >
          <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
            {selectedLog &&
              (() => {
                const activityChanges = getActivityChanges(selectedLog);
                const participantChanges = getCollectionChanges(
                  selectedLog,
                  "partisipasi",
                  "dosen_id"
                );
                const documentChanges = getCollectionChanges(
                  selectedLog,
                  "dokumen_pendukung",
                  "dokumen_id"
                );
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
                    <DialogHeader className="border-b px-6 py-5 pr-12">
                      <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle>Detail Perubahan</DialogTitle>
                        <Badge variant="secondary">
                          {selectedLog.action.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <DialogDescription>
                        Dicatat oleh {selectedLog.actor} pada{" "}
                        {format(
                          new Date(selectedLog.timestamp),
                          "dd MMMM yyyy, HH:mm",
                          {
                            locale: localeId,
                          }
                        )}
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-110px)]">
                      <div className="space-y-6 p-6">
                        <section className="grid gap-3 sm:grid-cols-3">
                          <div className="border p-3">
                            <p className="text-xs text-muted-foreground">
                              Block
                            </p>
                            <p className="mt-1 font-medium">
                              #{selectedLog.blockHeight ?? "Belum dikonfirmasi"}
                            </p>
                          </div>
                          <div className="border p-3">
                            <p className="text-xs text-muted-foreground">
                              Konfirmasi
                            </p>
                            <p className="mt-1 font-medium">
                              {selectedLog.confirmations}
                            </p>
                          </div>
                          <div className="border p-3">
                            <p className="text-xs text-muted-foreground">
                              Versi payload
                            </p>
                            <p className="mt-1 font-medium">
                              {selectedLog.payload.payload_version ?? "-"}
                            </p>
                          </div>
                        </section>

                        <section className="space-y-3">
                          <div>
                            <h3 className="font-semibold">
                              Perubahan Tercatat
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Dibandingkan dengan snapshot blockchain
                              sebelumnya.
                            </p>
                          </div>

                          {activityChanges.length > 0 && (
                            <div className="divide-y border">
                              {activityChanges.map((change) => (
                                <div
                                  key={change.label}
                                  className="grid gap-1 px-4 py-3 sm:grid-cols-[170px_1fr]"
                                >
                                  <p className="text-sm font-medium">
                                    {change.label}
                                  </p>
                                  {change.isInitial ? (
                                    <p className="text-sm">
                                      {formatAuditValue(change.after)}
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="text-muted-foreground line-through">
                                        {formatAuditValue(change.before)}
                                      </span>
                                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatAuditValue(change.after)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {participantChanges.added.map((participant) => (
                            <div
                              key={`participant-added-${getRecordId(
                                participant,
                                "dosen_id"
                              )}`}
                              className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
                            >
                              Dosen ditambahkan:{" "}
                              <strong>{String(participant.nama ?? "-")}</strong>{" "}
                              sebagai {formatAuditValue(participant.peran)}.
                            </div>
                          ))}
                          {participantChanges.removed.map((participant) => (
                            <div
                              key={`participant-removed-${getRecordId(
                                participant,
                                "dosen_id"
                              )}`}
                              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                            >
                              Dosen dihapus:{" "}
                              <strong>{String(participant.nama ?? "-")}</strong>
                              .
                            </div>
                          ))}
                          {participantChanges.changed.map((participant) => (
                            <div
                              key={`participant-changed-${getRecordId(
                                participant,
                                "dosen_id"
                              )}`}
                              className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                            >
                              Data partisipasi berubah:{" "}
                              <strong>{String(participant.nama ?? "-")}</strong>
                              .
                            </div>
                          ))}

                          {documentChanges.added.map((document) => (
                            <div
                              key={`document-added-${getRecordId(
                                document,
                                "dokumen_id"
                              )}`}
                              className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
                            >
                              Dokumen ditambahkan:{" "}
                              <strong>{String(document.nama ?? "-")}</strong>.
                            </div>
                          ))}
                          {documentChanges.removed.map((document) => (
                            <div
                              key={`document-removed-${getRecordId(
                                document,
                                "dokumen_id"
                              )}`}
                              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                            >
                              Dokumen dihapus:{" "}
                              <strong>{String(document.nama ?? "-")}</strong>.
                            </div>
                          ))}
                          {documentChanges.changed.map((document) => (
                            <div
                              key={`document-changed-${getRecordId(
                                document,
                                "dokumen_id"
                              )}`}
                              className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                            >
                              Data atau hash dokumen berubah:{" "}
                              <strong>{String(document.nama ?? "-")}</strong>.
                            </div>
                          ))}

                          {activityChanges.length === 0 &&
                            !hasCollectionChanges && (
                              <div className="border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                Tidak ada perbedaan data dengan snapshot
                                sebelumnya.
                              </div>
                            )}
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-semibold">Snapshot Kegiatan</h3>
                          <div className="grid gap-x-6 gap-y-3 border p-4 sm:grid-cols-2">
                            {Object.entries(activityFieldLabels).map(
                              ([field, label]) => (
                                <div key={field}>
                                  <p className="text-xs text-muted-foreground">
                                    {label}
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {formatAuditValue(activitySnapshot[field])}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-semibold">
                            Pencatat dan Publisher
                          </h3>
                          <div className="space-y-3 border p-4 text-sm">
                            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                              <span className="text-muted-foreground">
                                Nama
                              </span>
                              <span className="font-medium">
                                {String(recorder.nama ?? selectedLog.actor)}
                              </span>
                            </div>
                            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                              <span className="text-muted-foreground">
                                Program studi
                              </span>
                              <span>
                                {String(recorder.program_studi?.nama ?? "-")}
                              </span>
                            </div>
                            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                              <span className="text-muted-foreground">
                                Publisher
                              </span>
                              <span className="break-all font-mono text-xs">
                                {selectedLog.publisher ?? "-"}
                              </span>
                            </div>
                            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                              <span className="text-muted-foreground">
                                Transaction ID
                              </span>
                              <span className="break-all font-mono text-xs">
                                {selectedLog.txId}
                              </span>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-semibold">
                            Dosen Terlibat ({participants.length})
                          </h3>
                          {participants.length > 0 ? (
                            <div className="divide-y border">
                              {participants.map((participant) => (
                                <div
                                  key={getRecordId(participant, "dosen_id")}
                                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {String(participant.nama ?? "-")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      NIDN {String(participant.nidn ?? "-")}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {formatAuditValue(participant.peran)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="border p-4 text-sm text-muted-foreground">
                              Tidak ada data partisipan pada snapshot ini.
                            </p>
                          )}
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-semibold">
                            Dokumen Pendukung ({documents.length})
                          </h3>
                          {documents.length > 0 ? (
                            <div className="divide-y border">
                              {documents.map((document) => (
                                <div
                                  key={getRecordId(document, "dokumen_id")}
                                  className="space-y-2 px-4 py-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium">
                                      {String(document.nama ?? "-")}
                                    </p>
                                    <Badge variant="outline">
                                      {formatAuditValue(document.jenis_dokumen)}
                                    </Badge>
                                  </div>
                                  <p className="break-all font-mono text-xs text-muted-foreground">
                                    SHA-256: {String(document.hash_file ?? "-")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="border p-4 text-sm text-muted-foreground">
                              Tidak ada dokumen pendukung pada snapshot ini.
                            </p>
                          )}
                        </section>
                      </div>
                    </ScrollArea>
                  </>
                );
              })()}
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kegiatan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kegiatan "
              {activity?.namaKegiatan}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
