import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Check,
  X,
  Clock,
  RotateCcw,
  UserX,
  Download,
  Share2,
  Copy,
  FileWarning,
  Calendar,
  Eye,
  ExternalLink,
  UserPlus,
  RefreshCw,
  UserMinus,
  PieChart,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface DistribusiItem {
  id: string;
  dosen_id: string;
  status: string;
  tanggal_distribusi: string;
  tanggal_keputusan: string | null;
  dosen: {
    nama: string;
    nip: string;
    nidn: string;
  };
  kepemilikan: { id: string } | null;
}

interface DokumenDetail {
  id: string;
  nama: string;
  jenis_dokumen: string;
  file_path: string;
  hash_file: string;
  sumber_dokumen: string;
  tanggal_upload: string;
  deleted_at: string | null;
  distribusi: DistribusiItem[];
  kepemilikan: {
    dosen: { nama: string; nip: string; nidn: string };
  }[];
}

const statusLabel: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const statusBadgeClass: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "bg-amber-100 text-amber-800 border-amber-200",
  DISETUJUI: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DITOLAK: "bg-red-100 text-red-800 border-red-200",
};

const avatarStatusBg: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "bg-amber-100 text-amber-700",
  DISETUJUI: "bg-emerald-100 text-emerald-700",
  DITOLAK: "bg-red-100 text-red-700",
};

export function DocumentDistributionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DokumenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchDetail(); }, [id]);
  useEffect(() => { if (doc?.id) loadFilePreview(); }, [doc?.id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/detail`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === "success") setDoc(result.data);
      else { toast.error("Gagal memuat detail dokumen"); navigate("/document-distribution"); }
    } catch { toast.error("Gagal memuat data dari server"); navigate("/document-distribution"); }
    finally { setLoading(false); }
  };

  const loadFilePreview = async () => {
    setFileLoading(true);
    try {
      const previewRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`, { headers: { Authorization: `Bearer ${token}` } });
      const previewResult = await previewRes.json();
      if (previewResult.status !== "success") { setFileLoading(false); return; }
      setIsPdf(previewResult.data.contentType === "application/pdf");
      const contentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/content`, { headers: { Authorization: `Bearer ${token}` } });
      if (!contentRes.ok) { setFileLoading(false); return; }
      const blob = await contentRes.blob();
      setFileUrl(URL.createObjectURL(blob));
    } catch { /* ignore */ }
    finally { setFileLoading(false); }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === "success") { toast.success("Dokumen berhasil dihapus."); navigate("/document-distribution"); }
      else toast.error(result.error || "Gagal menghapus dokumen.");
    } catch { toast.error("Gagal menghapus dokumen."); }
  };

  const handleResend = async (distribusiId: string) => {
    setShowResendDialog(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribusi/${distribusiId}/resend`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === "success") { toast.success("Dokumen berhasil dikirim ulang."); fetchDetail(); }
      else toast.error(result.error || "Gagal mengirim ulang.");
    } catch { toast.error("Gagal mengirim ulang."); }
  };

  const handleRemoveRecipient = async (distribusiId: string) => {
    setShowRemoveDialog(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribusi/${distribusiId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === "success") { toast.success("Penerima berhasil dihapus."); fetchDetail(); }
      else toast.error(result.error || "Gagal menghapus penerima.");
    } catch { toast.error("Gagal menghapus penerima."); }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = doc?.nama || "dokumen";
    a.click();
  };

  const handleCopyLink = async () => {
    const link = doc?.file_path || `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`;
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Link berhasil disalin"); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("Gagal menyalin link"); }
  };

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  if (loading) {
    return (
      <MainLayout title="Detail Dokumen" breadcrumbs={[{ label: "Detail Dokumen" }]}>
        <div className="space-y-4 max-w-6xl mx-auto">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 space-y-4 lg:space-y-0">
            <div className="h-[500px] bg-muted rounded-xl animate-pulse" />
            <div className="h-[400px] bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!doc) return null;

  const distribusi = doc.distribusi || [];
  const totalPenerima = distribusi.length;
  const disetujui = distribusi.filter(d => d.status === "DISETUJUI").length;
  const ditolak = distribusi.filter(d => d.status === "DITOLAK").length;
  const menunggu = distribusi.filter(d => d.status === "MENUNGGU_KONFIRMASI").length;
  const approvalPct = totalPenerima > 0 ? Math.round((disetujui / totalPenerima) * 100) : 0;

  const fileExt = doc.file_path?.split('.').pop()?.toUpperCase() || "-";

  return (
    <MainLayout
      title="Detail Dokumen"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Distribusi Dokumen", path: "/document-distribution" },
        { label: doc.nama },
      ]}
    >
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* ── Topbar ── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/document-distribution")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/document-distribution/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-1.5" /> Edit Dokumen
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!fileUrl}>
              <Download className="w-4 h-4 mr-1.5" /> Unduh
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
            </Button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 space-y-5 lg:space-y-0">
          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-5 min-w-0">
            {/* ── Info Card ── */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold tracking-tight truncate">{doc.nama}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-medium">{doc.jenis_dokumen.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(doc.tanggal_upload), "dd MMMM yyyy", { locale: localeId })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetaItem label="Diunggah oleh" value={doc.sumber_dokumen === "TATA_USAHA" ? "Staff Tata Usaha" : doc.sumber_dokumen} />
                  <MetaItem label="Terakhir diubah" value={format(new Date(doc.tanggal_upload), "dd MMM yyyy", { locale: localeId })} />
                  <MetaItem label="Ukuran file" value="—" />
                  <MetaItem label="Format" value={fileExt} />
                </div>
              </CardContent>
            </Card>

            {/* ── Preview Card ── */}
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview dokumen</span>
                </div>
                <div className="flex items-center gap-1">
                  {fileUrl && isPdf && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, "_blank")} className="h-7 text-xs">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Buka tab baru
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs">
                        <Download className="w-3.5 h-3.5 mr-1" /> Unduh
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowShare(!showShare)} className={`h-7 text-xs ${showShare ? "bg-accent" : ""}`}>
                    <Share2 className="w-3.5 h-3.5 mr-1" /> Bagikan
                  </Button>
                </div>
              </div>

              {showShare && (
                <div className="px-5 py-3 border-b bg-muted/10">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground mb-0.5">Link dokumen</p>
                      <p className="text-sm font-mono text-foreground truncate">{doc?.file_path || `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0 h-8 text-xs">
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1 text-green-600" /> Tersalin</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Salin</>}
                    </Button>
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                {fileLoading ? (
                  <div className="p-5 space-y-3">
                    <div className="h-7 w-40 bg-muted rounded-lg animate-pulse" />
                    <div className="h-[450px] bg-muted rounded-lg animate-pulse" />
                  </div>
                ) : fileUrl && isPdf ? (
                  <div className="bg-gray-900/5">
                    <div className="flex items-center justify-between px-5 py-2 bg-gray-900/10 border-b">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        Dokumen PDF
                      </div>
                    </div>
                    <iframe src={fileUrl} className="w-full h-[550px]" title="Preview Dokumen" />
                  </div>
                ) : fileUrl && !isPdf ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="p-4 rounded-full bg-orange-50 border border-orange-200 mb-4">
                      <FileWarning className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-sm font-medium mb-1">File tidak dapat dipratinjau</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">Format DOCX tidak didukung untuk preview langsung.</p>
                    <Button variant="outline" onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> Unduh File</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="p-4 rounded-full bg-muted border border-border mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium mb-1">Preview tidak tersedia</h3>
                    <p className="text-sm text-muted-foreground">File dokumen belum tersedia.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ════ RIGHT COLUMN (SIDEBAR) ════ */}
          <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
            {/* ── Ringkasan Distribusi ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-muted-foreground" />
                  Ringkasan distribusi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SideStat value={totalPenerima} label="Total Penerima" />
                  <SideStat value={disetujui} label="Disetujui" className="text-emerald-600" />
                  <SideStat value={ditolak} label="Ditolak" className="text-red-600" />
                  <SideStat value={menunggu} label="Menunggu" className="text-amber-600" />
                </div>
                {totalPenerima > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tingkat penyetujuan</span>
                      <span className="font-medium text-emerald-600">{approvalPct}%</span>
                    </div>
                    <Progress value={approvalPct} className="h-2 bg-gray-200" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Daftar Penerima ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Daftar penerima
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">{totalPenerima}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {totalPenerima === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 px-4">Belum ada penerima</p>
                ) : (
                  <div className="divide-y">
                    {distribusi.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className={`text-[10px] font-medium ${avatarStatusBg[d.status] || "bg-gray-100 text-gray-600"}`}>
                            {getInitials(d.dosen.nama)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{d.dosen.nama}</p>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${statusBadgeClass[d.status] || ""}`}>
                              {statusLabel[d.status] || d.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>{d.dosen.nip}</span>
                            <span>·</span>
                            <span>{format(new Date(d.tanggal_distribusi), "dd MMM", { locale: localeId })}</span>
                          </div>
                        </div>
                        {d.status === "DITOLAK" && (
                          <div className="flex gap-0.5 shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowResendDialog(d.id)} title="Kirim ulang">
                              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowRemoveDialog(d.id)} title="Hapus penerima">
                              <UserMinus className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Separator />
                <div className="p-3">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => navigate(`/document-distribution/${id}/edit`)}>
                    <UserPlus className="w-3.5 h-3.5" /> Tambah penerima
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus dokumen <strong>{doc.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showResendDialog} onOpenChange={(o) => { if (!o) setShowResendDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Ulang Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>Dokumen akan dikirim ulang ke dosen ini. Status akan direset menjadi "Menunggu Konfirmasi".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => showResendDialog && handleResend(showResendDialog)}>Kirim Ulang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showRemoveDialog} onOpenChange={(o) => { if (!o) setShowRemoveDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penerima?</AlertDialogTitle>
            <AlertDialogDescription>Dosen ini akan dihapus dari daftar penerima dokumen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => showRemoveDialog && handleRemoveRecipient(showRemoveDialog)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function SideStat({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-center">
      <p className={`text-lg font-bold ${className || ""}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
