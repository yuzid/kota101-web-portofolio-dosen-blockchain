import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
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
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
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
  CalendarIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
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
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

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
        case "periode":
          aVal = a.filter?.tanggalAwal || "";
          bVal = b.filter?.tanggalAwal || "";
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
      const matchesSearch = (
        r.nama.toLowerCase().includes(q) ||
        (r.dibuatOleh.nama || "").toLowerCase().includes(q) ||
        (r.prodiNama || "").toLowerCase().includes(q) ||
        (r.jurusanNama || "").toLowerCase().includes(q)
      );
      let matchesDate = true;
      if (filterDateFrom) {
        matchesDate = matchesDate && new Date(r.tanggalPerekapan) >= filterDateFrom;
      }
      if (filterDateTo) {
        matchesDate = matchesDate && new Date(r.tanggalPerekapan) <= filterDateTo;
      }
      return matchesSearch && matchesDate;
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
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari laporan rekap..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[170px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDateFrom ? format(filterDateFrom, "dd MMM yyyy") : "Dari tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} initialFocus />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[170px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDateTo ? format(filterDateTo, "dd MMM yyyy") : "Sampai tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} initialFocus />
            </PopoverContent>
          </Popover>
          {(filterDateFrom || filterDateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterDateFrom(undefined); setFilterDateTo(undefined); }}>
              <X className="w-4 h-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>

        <div className="border rounded-lg bg-background overflow-x-auto">
          <Table className="table-fixed">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-28" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-24" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-20" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nama")}>
                    Nama Rekap <SortIcon column="nama" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("periode")}>
                    Periode Kegiatan <SortIcon column="periode" />
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
                      <TableCell className="font-medium truncate max-w-[220px]">{rekap.nama}</TableCell>
                      <TableCell>
                        {rekap.filter.tanggalAwal
                          ? `${formatDate(rekap.filter.tanggalAwal)}${rekap.filter.tanggalAkhir ? ` – ${formatDate(rekap.filter.tanggalAkhir)}` : ' – Sekarang'}`
                          : <span className="text-xs text-muted-foreground">Semua periode</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{rekap.dibuatOleh.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {rekap.dibuatOleh.role === "kajur" ? "Kajur" : "Kaprodi"}
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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRekaps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <FileText className="w-8 h-8" />
              <p className="text-sm">Belum ada laporan rekapitulasi</p>
            </div>
          ) : (
            filteredRekaps.map((rekap) => {
              const basePath = isKajur ? "/monitoring/jurusan/rekap" : "/monitoring/prodi/rekap";
              return (
                <Card key={rekap.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {rekap.dibuatOleh.nama?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{rekap.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              {rekap.filter.tanggalAwal
                                ? `${formatDate(rekap.filter.tanggalAwal)}${rekap.filter.tanggalAkhir ? ` – ${formatDate(rekap.filter.tanggalAkhir)}` : ' – Sekarang'}`
                                : 'Semua periode'
                              }
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
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
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{rekap.dibuatOleh.nama}</span>
                          <Badge variant="secondary" className="text-xs">
                            {rekap.dibuatOleh.role === "kajur" ? "Kajur" : "Kaprodi"}
                          </Badge>
                        </div>
                        {isKajur && (
                          <p className="text-xs text-muted-foreground">
                            {rekap.prodiNama || "-"}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="secondary" className="text-xs">
                            {rekap.kegiatanData.length} Kegiatan
                          </Badge>
                          {rekap.filter.kategori && rekap.filter.kategori.length > 0 ? (
                            rekap.filter.kategori.slice(0, 2).map((k) => (
                              <Badge key={k} variant="outline" className="text-xs">
                                {k.replace(/_/g, " ")}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Semua filter</span>
                          )}
                          {rekap.filter.kategori && rekap.filter.kategori.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{rekap.filter.kategori.length - 2}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dibuat: {formatDateTime(rekap.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
       </motion.div>

       <ConfirmDialog
         open={!!deleteRekapId}
         onOpenChange={(open) => !open && setDeleteRekapId(null)}
         title="Hapus Rekap?"
         description="Laporan rekapitulasi ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
         confirmLabel="Hapus"
         variant="destructive"
         onConfirm={handleDelete}
         disabled={isDeleting}
         loading={isDeleting}
       />
      </MainLayout>
   );
}
