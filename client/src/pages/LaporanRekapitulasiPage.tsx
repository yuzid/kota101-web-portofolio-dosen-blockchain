import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  FileText,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  listRekap,
  getRekap,
  deleteRekap,
  exportRekapXlsx,
  exportRekapCsv,
  type RekapLaporan,
} from "../lib/rekapStorage";

export function LaporanRekapitulasiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [rekaps, setRekaps] = useState<RekapLaporan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isKajur = location.pathname.includes("/monitoring/jurusan");
  const roleTitle = isKajur ? "Jurusan" : "Program Studi";

  const [deleteRekapId, setDeleteRekapId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRekaps();
  }, []);

  const loadRekaps = () => {
    setIsLoading(true);
    const data = listRekap();
    setRekaps(data);
    setIsLoading(false);
  };

  const filteredRekaps = rekaps.filter((r) =>
    r.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteRekapId) return;
    setIsDeleting(true);
    const success = deleteRekap(deleteRekapId);
    if (success) {
      toast.success("Rekap berhasil dihapus");
      setDeleteRekapId(null);
      loadRekaps();
    } else {
      toast.error("Gagal menghapus rekap");
    }
    setIsDeleting(false);
  };

  const handleExportXlsx = (id: string) => {
    const rekap = getRekap(id);
    if (rekap) {
      exportRekapXlsx(rekap);
      toast.success("File Excel berhasil diunduh");
    }
  };

  const handleExportCsv = (id: string) => {
    const rekap = getRekap(id);
    if (rekap) {
      exportRekapCsv(rekap);
      toast.success("File CSV berhasil diunduh");
    }
  };

  const handleShare = (rekap: RekapLaporan) => {
    const shareData = {
      title: `Rekap: ${rekap.nama}`,
      text: `Laporan Rekapitulasi: ${rekap.nama}\nDibuat: ${format(new Date(rekap.tanggalPerekapan), "dd MMM yyyy")}\nOleh: ${rekap.dibuatOleh.nama}\nJumlah Kegiatan: ${rekap.kegiatanData.length}`,
    };
    navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
    toast.success("Data rekap disalin ke clipboard");
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  return (
    <MainLayout
      title={`Laporan Rekapitulasi ${roleTitle}`}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: `Monitoring ${roleTitle}`, path: isKajur ? "/monitoring/jurusan" : "/monitoring/prodi" },
        { label: "Laporan Rekapitulasi" },
      ]}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Laporan Rekapitulasi</h2>
            <p className="text-sm text-muted-foreground">
              {isKajur ? "Seluruh rekap di jurusan" : "Rekap program studi"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari laporan rekap..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Rekap</TableHead>
                <TableHead>Tanggal Perekapan</TableHead>
                <TableHead>Dibuat Oleh</TableHead>
                {isKajur && <TableHead>Prodi</TableHead>}
                <TableHead className="text-center">Jumlah Kegiatan</TableHead>
                <TableHead>Filter</TableHead>
                <TableHead>Dibuat Pada</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isKajur ? 8 : 7} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Memuat data rekap...</p>
                  </TableCell>
                </TableRow>
              ) : filteredRekaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isKajur ? 8 : 7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="w-8 h-8" />
                      <p>Belum ada laporan rekapitulasi</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRekaps.map((rekap) => {
                  const basePath = isKajur ? "/monitoring/jurusan/rekap" : "/monitoring/prodi/rekap";
                  return (
                    <TableRow key={rekap.id}>
                      <TableCell className="font-medium">{rekap.nama}</TableCell>
                      <TableCell>{formatDate(rekap.tanggalPerekapan)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{rekap.dibuatOleh.nama}</p>
                          <Badge variant="outline" className="text-xs">
                            {rekap.dibuatOleh.role === "kajur" ? "Kajur" : "Kaprodi"}
                          </Badge>
                        </div>
                      </TableCell>
                      {isKajur && (
                        <TableCell>{rekap.prodiNama || "-"}</TableCell>
                      )}
                      <TableCell className="text-center">
                        <Badge variant="secondary">{rekap.kegiatanData.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rekap.filter.kategori && rekap.filter.kategori.length > 0 ? (
                            rekap.filter.kategori.slice(0, 2).map((k) => (
                              <Badge key={k} variant="outline" className="text-xs">
                                {k.replace(/_/g, " ")}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Semua</span>
                          )}
                          {rekap.filter.kategori && rekap.filter.kategori.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{rekap.filter.kategori.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(rekap.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/${rekap.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/${rekap.id}/edit`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExportXlsx(rekap.id)}>
                                Format Excel (XLSX)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportCsv(rekap.id)}>
                                Format CSV
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(rekap)}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteRekapId(rekap.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteRekapId} onOpenChange={(open) => !open && setDeleteRekapId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rekap?</AlertDialogTitle>
            <AlertDialogDescription>
              Laporan rekapitulasi ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
