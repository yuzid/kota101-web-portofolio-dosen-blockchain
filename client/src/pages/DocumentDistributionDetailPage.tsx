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
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDetail();
  }, [id]);

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

  if (loading) {
    return (
      <MainLayout title="Detail Dokumen" breadcrumbs={[{ label: "Detail Dokumen" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
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
      <div className="space-y-6 max-w-5xl">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-muted-foreground" />
              {doc.nama}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Jenis Dokumen</p>
                <Badge variant="secondary" className="mt-1">{doc.jenis_dokumen}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Upload</p>
                <p className="font-medium mt-1">{format(new Date(doc.tanggal_upload), "dd MMMM yyyy")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">File</p>
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 underline break-all mt-1 inline-block"
                >
                  {doc.file_path}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribusi</CardTitle>
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
                      <TableCell className="text-sm">
                        {format(new Date(d.tanggal_distribusi), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.tanggal_keputusan
                          ? format(new Date(d.tanggal_keputusan), "dd MMM yyyy HH:mm")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
    </MainLayout>
  );
}
