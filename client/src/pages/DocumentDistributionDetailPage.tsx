import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
} from "lucide-react";
import { format } from "date-fns";
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
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const statusIcon: Record<string, React.ReactNode> = {
  MENUNGGU_KONFIRMASI: <Clock className="w-4 h-4 text-yellow-500" />,
  DISETUJUI: <Check className="w-4 h-4 text-green-500" />,
  DITOLAK: <X className="w-4 h-4 text-red-500" />,
};

const statusBadge: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DISETUJUI: "bg-green-100 text-green-800 border-green-200",
  DITOLAK: "bg-red-100 text-red-800 border-red-200",
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

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (doc?.id) loadFilePreview();
  }, [doc?.id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/detail`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        setDoc(result.data);
      } else {
        toast.error("Gagal memuat detail dokumen");
        navigate("/document-distribution");
      }
    } catch {
      toast.error("Gagal memuat data dari server");
      navigate("/document-distribution");
    } finally {
      setLoading(false);
    }
  };

  const loadFilePreview = async () => {
    setFileLoading(true);
    try {
      const previewRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const previewResult = await previewRes.json();
      if (previewResult.status !== "success") {
        setFileLoading(false);
        return;
      }

      setIsPdf(previewResult.data.contentType === "application/pdf");

      const contentRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/content`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!contentRes.ok) {
        setFileLoading(false);
        return;
      }

      const blob = await contentRes.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch {
    } finally {
      setFileLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen berhasil dihapus.");
        navigate("/document-distribution");
      } else {
        toast.error(result.error || "Gagal menghapus dokumen.");
      }
    } catch {
      toast.error("Gagal menghapus dokumen.");
    }
  };

  const handleResend = async (distribusiId: string) => {
    setShowResendDialog(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribusi/${distribusiId}/resend`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen berhasil dikirim ulang.");
        fetchDetail();
      } else {
        toast.error(result.error || "Gagal mengirim ulang.");
      }
    } catch {
      toast.error("Gagal mengirim ulang.");
    }
  };

  const handleRemoveRecipient = async (distribusiId: string) => {
    setShowRemoveDialog(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribusi/${distribusiId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Penerima berhasil dihapus.");
        fetchDetail();
      } else {
        toast.error(result.error || "Gagal menghapus penerima.");
      }
    } catch {
      toast.error("Gagal menghapus penerima.");
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = doc?.nama || "dokumen";
    a.click();
  };

  const handleCopyLink = async () => {
    const link = doc?.file_path || `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link berhasil disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <MainLayout title="Detail Dokumen" breadcrumbs={[{ label: "Detail Dokumen" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!doc) return null;

  return (
    <MainLayout
      title="Detail Dokumen"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Distribusi Dokumen", path: "/document-distribution" },
        { label: doc.nama },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* ── Top Navigation ── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/document-distribution")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/document-distribution/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Dokumen
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Hapus
            </Button>
          </div>
        </div>

        {/* ── Header Info ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight truncate">{doc.nama}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <Badge variant="secondary" className="text-xs">{doc.jenis_dokumen}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(doc.tanggal_upload), "dd MMMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Preview Dokumen ── */}
        <Card className="overflow-hidden">
          <div className="border-b border-border">
            <div className="p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Preview Dokumen</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShare(!showShare)}
                  className={showShare ? "bg-accent" : ""}
                  title="Bagikan link dokumen"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Bagikan
                </Button>
                {fileUrl && (
                  <Button variant="ghost" size="sm" onClick={handleDownload} title="Unduh file">
                    <Download className="w-4 h-4 mr-1.5" />
                    Unduh
                  </Button>
                )}
              </div>
            </div>

            {showShare && (
              <div className="px-4 sm:px-6 pb-4 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Link dokumen</p>
                    <p className="text-sm font-mono text-foreground truncate">
                      {doc?.file_path || `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
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
            )}
          </div>

          <CardContent className="p-4 sm:p-6">
            {fileLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="h-[450px] bg-muted rounded-lg animate-pulse" />
              </div>
            ) : fileUrl && isPdf ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  <FileText className="w-3.5 h-3.5" />
                  Dokumen PDF — gunakan tombol unduh atau bagikan untuk menyimpan
                </div>
                <div className="border rounded-lg overflow-hidden bg-accent/20">
                  <iframe
                    src={fileUrl}
                    className="w-full h-[550px]"
                    title="Preview Dokumen"
                  />
                </div>
              </div>
            ) : fileUrl && !isPdf ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-4 rounded-full bg-orange-50 border border-orange-200 mb-4">
                  <FileWarning className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">File tidak dapat dipratinjau</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
                  Format file ini (DOCX) tidak didukung untuk preview langsung. Silakan unduh file untuk melihat isinya.
                </p>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" /> Unduh File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-4 rounded-full bg-muted border border-border mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">Preview tidak tersedia</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  File dokumen belum tersedia untuk ditampilkan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Status Distribusi ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Status Distribusi
              {doc.distribusi && doc.distribusi.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {doc.distribusi.length} penerima
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosen</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Distribusi</TableHead>
                  <TableHead>Tanggal Keputusan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc.distribusi && doc.distribusi.length > 0 ? (
                  doc.distribusi.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.dosen.nama}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.dosen.nip}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge[d.status] || ""}`}>
                          {statusIcon[d.status]}
                          {statusLabel[d.status] || d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(d.tanggal_distribusi), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {d.tanggal_keputusan
                          ? format(new Date(d.tanggal_keputusan), "dd MMM yyyy HH:mm")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.status === "DITOLAK" && (
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowResendDialog(d.id)}
                              title="Kirim Ulang"
                            >
                              <RotateCcw className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowRemoveDialog(d.id)}
                              title="Hapus dari daftar penerima"
                            >
                              <UserX className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Dokumen belum didistribusikan ke dosen mana pun.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen <strong>{doc.nama}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showResendDialog} onOpenChange={(o) => { if (!o) setShowResendDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Ulang Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen akan dikirim ulang ke dosen ini. Status akan direset menjadi "Menunggu Konfirmasi".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => showResendDialog && handleResend(showResendDialog)}>
              Kirim Ulang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showRemoveDialog} onOpenChange={(o) => { if (!o) setShowRemoveDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penerima?</AlertDialogTitle>
            <AlertDialogDescription>
              Dosen ini akan dihapus dari daftar penerima dokumen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => showRemoveDialog && handleRemoveRecipient(showRemoveDialog)} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
