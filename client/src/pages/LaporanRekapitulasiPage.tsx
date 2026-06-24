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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  MoreVertical,
  FileText,
  Loader2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const isKajur = location.pathname.includes("/monitoring/jurusan");
  const roleTitle = isKajur ? "Jurusan" : "Program Studi";

  const [deleteRekapId, setDeleteRekapId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRekaps();
  }, [isKajur]);

  const loadRekaps = async () => {
    setIsLoading(true);
    try {
      const data = await listRekap(isKajur);
      setRekaps(data);
    } catch (error) {
      toast.error("Gagal memuat rekap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortData = (data: RekapLaporan[]) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortColumn) {
        case "nama":
          aVal = a.nama.toLowerCase();
          bVal = b.nama.toLowerCase();
          break;
        case "tanggalPerekapan":
          aVal = a.tanggalPerekapan;
          bVal = b.tanggalPerekapan;
          break;
        case "dibuatOleh":
          aVal = a.dibuatOleh.nama.toLowerCase();
          bVal = b.dibuatOleh.nama.toLowerCase();
          break;
        case "prodi":
          aVal = (a.prodiNama || "").toLowerCase();
          bVal = (b.prodiNama || "").toLowerCase();
          break;
        case "jumlahKegiatan":
          aVal = a.kegiatanData.length;
          bVal = b.kegiatanData.length;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredRekaps = sortData(
    rekaps.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        r.nama.toLowerCase().includes(q) ||
        (r.dibuatOleh.nama || "").toLowerCase().includes(q) ||
        (r.prodiNama || "").toLowerCase().includes(q) ||
        (r.jurusanNama || "").toLowerCase().includes(q)
      );
    })
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const handleDelete = async () => {
    if (!deleteRekapId) return;
    setIsDeleting(true);
    try {
      const success = await deleteRekap(deleteRekapId, isKajur);
      if (success) {
        toast.success("Rekap berhasil dihapus");
        setDeleteRekapId(null);
        loadRekaps();
      } else {
        toast.error("Gagal menghapus rekap");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus rekap");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportXlsx = async (id: string) => {
    try {
      const rekap = await getRekap(id, isKajur);
      if (rekap) {
        exportRekapXlsx(rekap);
        toast.success("File Excel berhasil diunduh");
      }
    } catch (error) {
      toast.error("Gagal mengunduh file Excel");
    }
  };

  const handleExportCsv = async (id: string) => {
    try {
      const rekap = await getRekap(id, isKajur);
      if (rekap) {
        exportRekapCsv(rekap);
        toast.success("File CSV berhasil diunduh");
      }
    } catch (error) {
      toast.error("Gagal mengunduh file CSV");
    }
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
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nama")}>
                    Nama Rekap <SortIcon column="nama" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("tanggalPerekapan")}>
                    Tanggal Perekapan <SortIcon column="tanggalPerekapan" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("dibuatOleh")}>
                    Dibuat Oleh <SortIcon column="dibuatOleh" />
                  </TableHead>
                  {isKajur && (
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("prodi")}>
                      Prodi <SortIcon column="prodi" />
                    </TableHead>
                  )}
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("jumlahKegiatan")}>
                    Jumlah Kegiatan <SortIcon column="jumlahKegiatan" />
                  </TableHead>
                  <TableHead>Filter</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                    Dibuat Pada <SortIcon column="createdAt" />
                  </TableHead>
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
                          <p className="text-xs text-muted-foreground">
                            {rekap.dibuatOleh.role === "kajur"
                              ? `Kajur ${rekap.jurusanNama || ""}`
                              : `Kaprodi ${rekap.prodiNama || ""}`}
                          </p>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`${basePath}/${rekap.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`${basePath}/${rekap.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleExportXlsx(rekap.id)}>
                                  Format Excel (XLSX)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportCsv(rekap.id)}>
                                  Format CSV
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteRekapId(rekap.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
