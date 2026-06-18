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
import { Input } from "../components/ui/input";
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
  XCircle,
  Copy,
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
}

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  MENUNGGU_KONFIRMASI: {
    label: "Menunggu Konfirmasi",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  DITERIMA: {
    label: "Diterima",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
  },
  DITOLAK: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="w-3 h-3 mr-1" />,
  },
};

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
  const [shareLink, setShareLink] = useState("");

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (id) {
      fetchActivityDetail();
    }
  }, [id]);

  const fetchActivityDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setActivity(result.data);
      } else {
        toast.error(result.error || 'Gagal mengambil detail kegiatan');
        navigate('/activities');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi ke server');
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
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.error || 'Gagal mengambil riwayat blockchain');
      }
      setLogs(result.data);
      setAuditLoaded(true);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Gagal mengambil riwayat blockchain');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'riwayat') {
      void fetchAuditTrail();
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Memuat Detail..." breadcrumbs={[{ label: "Kegiatan Tridharma", path: "/activities" }, { label: "Detail" }]}>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Mengambil data kegiatan...</p>
        </div>
      </MainLayout>
    );
  }

  if (!activity) return null;

  const isCurrentUserMember = activity.dosenTerlibat.some(d => d.isCurrentUser);
  const isReadOnlyView =
    !isCurrentUserMember ||
    location.pathname.includes("/ami-recap/");

  const handleEdit = () => {
    navigate(`/activities/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus kegiatan "${activity.namaKegiatan}"?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success("Kegiatan berhasil dihapus");
        navigate("/activities");
      } else {
        toast.error(result.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus kegiatan');
    }
  };

  const handleShare = () => {
    const link = `${window.location.origin}/activities/${id}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link berhasil disalin!');
    } catch (err) {
      toast.info(`Link: ${shareLink}`);
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis.toLowerCase()) {
      case "pendidikan":
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

  const getStatusBadge = (status: string) => {
    const s = statusBadge[status];
    if (!s) return <Badge variant="outline">{status}</Badge>;
    return (
      <Badge variant="outline" className={s.className}>
        {s.icon}
        {s.label}
      </Badge>
    );
  };

  const getKelengkapanBadge = (status: string) => {
    if (status === "lengkap") {
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
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
            {!isReadOnlyView && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {activity.isCurrentUserPencatat && !location.pathname.includes("/ami-recap/") && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {getJenisBadge(activity.jenisTridharma)}
                  <Badge variant="secondary">{activity.kategori}</Badge>
                </div>
                <h2 className="text-2xl font-bold">{activity.namaKegiatan}</h2>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
              <div>{getKelengkapanBadge(activity.statusKelengkapan)}</div>
            </div>
          </CardHeader>
        </Card>

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

          <TabsContent value="detail" className="space-y-6 mt-4">
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
                        {format(new Date(activity.tanggalMulai), "dd MMMM yyyy", { locale: localeId })}
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
                        {format(new Date(activity.tanggalSelesai), "dd MMMM yyyy", { locale: localeId })}
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
                </div>
              </CardContent>
            </Card>

            {activity.jenisBukti === 'BERSAMA' && (
              <Card>
                <CardHeader>
                  <CardTitle>Dokumen Bersama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dokumen milik kegiatan, dapat diakses oleh semua anggota yang sudah DITERIMA
                  </p>
                  {activity.dokumenBersama && activity.dokumenBersama.length > 0 ? (
                    <div className="space-y-2">
                      {activity.dokumenBersama.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {doc.jenis}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Upload oleh: {doc.uploadedBy.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(doc.tanggalUpload), "dd MMM yyyy", { locale: localeId })}
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
                                navigate(`/documents/${doc.id}/preview`, {
                                  state: {
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
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Belum ada dokumen bersama
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dosen Terlibat</CardTitle>
                  <Badge variant="outline">
                    <Users className="w-4 h-4 mr-1" />
                    {activity.dosenTerlibat.length} Dosen
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.jenisBukti === 'MASING_MASING' && (
                  <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Setiap dosen memiliki dokumen bukti masing-masing
                    </p>
                  </div>
                )}

                {activity.dosenTerlibat.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(dosen.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{dosen.name}</p>
                            {dosen.isPencatat && (
                              <Badge className="bg-blue-500">Pembuat</Badge>
                            )}
                            {dosen.isKetua && !dosen.isPencatat && (
                              <Badge className="bg-purple-500">Ketua</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {dosen.nidn ? `NIDN/NIP: ${dosen.nidn}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(dosen.status || "MENUNGGU_KONFIRMASI")}
                        {activity.jenisBukti !== 'BERSAMA' && (
                          <div className="text-right">
                            {dosen.dokumen.length > 0 ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {dosen.dokumen.length} Dokumen
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                {dosen.isCurrentUser ? "Upload" : "Belum Upload"}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {activity.jenisBukti !== 'BERSAMA' && dosen.dokumen.length > 0 && (
                      <div className="space-y-2 pl-12">
                        <label className="text-sm font-medium text-muted-foreground">
                          Dokumen Bukti:
                        </label>
                        {dosen.dokumen.map((doc) => {
                          const isOwner = 'isOwner' in doc ? (doc as any).isOwner : true;
                          const uploadedBy = (doc as any).uploadedBy;
                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {doc.jenis}
                                    </Badge>
                                    {!isOwner && uploadedBy && (
                                      <span className="text-xs text-muted-foreground">
                                        Upload oleh: {uploadedBy.name}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Upload:{" "}
                                      {format(new Date(doc.tanggalUpload), "dd MMM yyyy", { locale: localeId })}
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
                                    navigate(`/documents/${doc.id}/preview`, {
                                      state: {
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
                        })}
                      </div>
                    )}

                    {activity.jenisBukti !== 'BERSAMA' && dosen.dokumen.length === 0 && (
                      <div className="pl-12 text-sm text-muted-foreground italic">
                        {dosen.status === "DITERIMA"
                          ? dosen.isCurrentUser
                            ? "Anda belum mengupload dokumen bukti, silahkan upload"
                            : "Dosen ini belum mengupload dokumen bukti"
                          : dosen.status === "MENUNGGU_KONFIRMASI"
                          ? dosen.isCurrentUser
                            ? "Anda belum konfirmasi keikutsertaan"
                            : "Menunggu konfirmasi dosen"
                          : "Dosen telah menolak keikutsertaan"}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

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
                      {activity.jenisBukti === 'BERSAMA'
                        ? (activity.dokumenBersama?.length || 0)
                        : activity.dosenTerlibat.reduce(
                            (sum, d) => sum + d.dokumen.length, 0
                          )
                      }
                    </p>
                  </div>
                  {activity.jenisBukti === 'BERSAMA' ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {activity.dokumenBersama && activity.dokumenBersama.length > 0
                          ? 'Dokumen milik kegiatan (dibagikan ke semua anggota)'
                          : 'Belum ada dokumen bersama'
                        }
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Dosen Belum Upload
                      </p>
                      <p className="text-2xl font-bold">
                        {
                          activity.dosenTerlibat.filter(
                            (d) => d.dokumen.length === 0 && d.status === "DITERIMA"
                          ).length
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                    <Button variant="outline" onClick={() => void fetchAuditTrail()}>
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
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", { locale: localeId })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {log.action.replaceAll("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{log.actor}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-mono text-xs" title={log.txId}>
                                  {log.txId.slice(0, 12)}...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.documentCount} dokumen pendukung
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <p>#{log.blockHeight ?? "-"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {log.confirmations} konfirmasi
                                </p>
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
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bagikan Kegiatan Ini</DialogTitle>
            <DialogDescription>
              Bagikan link kegiatan <strong>{activity?.namaKegiatan}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={shareLink} readOnly className="font-mono text-sm" />
            <Button onClick={copyShareLink} size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </MainLayout>
  );
}
