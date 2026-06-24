import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Share2,
  Loader2,
  Clock,
  XCircle,
  Copy,
  GraduationCap,
  BookOpen,
  Check,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
  getMonitoringActivityDetail,
  clearMonitoringActivityDetail,
} from "../lib/monitoringStorage";

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

const statusBadge: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  MENUNGGU_KONFIRMASI: {
    label: "Menunggu Konfirmasi",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="w-3 h-3" />,
  },
  DITERIMA: {
    label: "Diterima",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  DITOLAK: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const jenisColor: Record<string, string> = {
  pendidikan: "border-l-blue-500",
  penelitian: "border-l-green-500",
  pengabdian: "border-l-purple-500",
  tugas_tambahan: "border-l-orange-500",
};
const jenisBadge: Record<string, string> = {
  pendidikan: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  penelitian: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  pengabdian:
    "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  tugas_tambahan:
    "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
};
const jenisIcon: Record<string, React.ReactNode> = {
  pendidikan: <GraduationCap className="w-4 h-4" />,
  penelitian: <BookOpen className="w-4 h-4" />,
  pengabdian: <Users className="w-4 h-4" />,
  tugas_tambahan: <FileText className="w-4 h-4" />,
};

export function MonitoringActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMode, setShareMode] = useState<"detail" | "dokumen">("detail");
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isKajur = location.pathname.includes("/monitoring/jurusan");
  const roleTitle = isKajur ? "Jurusan" : "Program Studi";

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = () => {
    const data = getMonitoringActivityDetail<ActivityDetail>();
    if (data && data.id === id) {
      setActivity(data);
      setIsLoading(false);
      return;
    }
    toast.error("Data kegiatan tidak tersedia. Silakan kembali ke daftar.");
    navigate(`/monitoring/${isKajur ? "jurusan" : "prodi"}`);
  };

  const handleDownload = () => {
    if (!activity) return;
    try {
      const jsonStr = JSON.stringify(activity, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kegiatan-${activity.namaKegiatan.replace(/\s+/g, "-").toLowerCase()}-${activity.id.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data kegiatan berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh data kegiatan");
    }
  };

  const handleBack = () => {
    clearMonitoringActivityDetail();
    navigate(-1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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

  const jType = activity?.jenisTridharma?.toLowerCase() || "";

  const shareLinkDetail = activity
    ? `${window.location.origin}/public/kegiatan/${activity.id}`
    : "";
  const shareLinkDokumen = activity
    ? `${window.location.origin}/public/kegiatan/${activity.id}/dokumen`
    : shareLinkDetail;
  const activeShareLink = shareMode === "detail" ? shareLinkDetail : shareLinkDokumen;

  if (isLoading) {
    return (
      <MainLayout
        title="Detail Kegiatan"
        breadcrumbs={[
          { label: `Monitoring ${roleTitle}`, path: `/monitoring/${isKajur ? "jurusan" : "prodi"}` },
          { label: "Detail" },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!activity) return null;

  return (
    <MainLayout
      title="Detail Kegiatan"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: `Monitoring ${roleTitle}`, path: `/monitoring/${isKajur ? "jurusan" : "prodi"}` },
        { label: "Detail Kegiatan" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-1.5" /> Bagikan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-1.5" /> Unduh
            </Button>
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
        <Tabs defaultValue="detail">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="detail">
              <FileText className="w-4 h-4 mr-2" /> Detail Kegiatan
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
                              <Badge className="bg-blue-500 text-xs h-5">
                                Pembuat
                              </Badge>
                            )}
                            {dosen.isKetua && !dosen.isPencatat && (
                              <Badge className="bg-purple-500 text-xs h-5">
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
                            <Badge className="bg-green-500 text-xs whitespace-nowrap">
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

                    {activity.jenisBukti !== "BERSAMA" && (
                      <div className="p-4 space-y-2">
                        {dosen.dokumen.length > 0 ? (
                          dosen.dokumen.map((doc) => (
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/documents/${doc.id}/preview`, {
                                      state: {
                                        isDocumentOwner: false,
                                        activityId: activity.id,
                                        breadcrumbs: [
                                          { label: "Beranda", path: "/dashboard" },
                                          { label: `Monitoring ${roleTitle}`, path: `/monitoring/${isKajur ? "jurusan" : "prodi"}` },
                                          { label: activity.namaKegiatan, path: `/monitoring/${isKajur ? "jurusan" : "prodi"}/kegiatan/${id}` },
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
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {dosen.status === "DITERIMA"
                              ? "Dosen ini belum mengupload dokumen bukti"
                              : dosen.status === "MENUNGGU_KONFIRMASI"
                                ? "Menunggu konfirmasi dosen"
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
              <SummaryCard
                icon={<Users className="w-5 h-5 text-blue-600" />}
                label="Total Dosen Terlibat"
                value={activity.dosenTerlibat.length.toString()}
                bg="bg-blue-50 border-blue-200"
              />
              <SummaryCard
                icon={<FileText className="w-5 h-5 text-green-600" />}
                label={
                  activity.jenisBukti === "BERSAMA"
                    ? "Total Dokumen Bersama"
                    : "Total Dokumen Bukti"
                }
                value={
                  activity.jenisBukti === "BERSAMA"
                    ? (activity.dokumenBersama?.length || 0).toString()
                    : activity.dosenTerlibat
                        .reduce((s, d) => s + d.dokumen.length, 0)
                        .toString()
                }
                bg="bg-green-50 border-green-200"
              />
              <SummaryCard
                icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
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
                        .length.toString()
                }
                bg="bg-amber-50 border-amber-200"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
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

function SummaryCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
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
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 shrink-0">
          <FileText className="w-4 h-4 text-blue-600" />
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/documents/${doc.id}/preview`, {
              state: {
                isDocumentOwner: false,
                activityId: activity.id,
                breadcrumbs: [
                  { label: "Beranda", path: "/dashboard" },
                  { label: "Monitoring", path: "/monitoring" },
                  { label: activity.namaKegiatan, path: "#" },
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
      <Badge className="bg-green-500 text-white text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />
        Dokumen Lengkap
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500 text-white text-xs">
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
