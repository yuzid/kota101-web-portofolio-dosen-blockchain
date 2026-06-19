import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
  Calendar,
  User,
  Filter,
  Loader2,
  ArrowLeft,
  Edit,
  FileText,
  ChevronDown,
  Clock,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getRekap, exportRekapXlsx, exportRekapCsv, type RekapLaporan } from "../lib/rekapStorage";

export function RekapLaporanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [rekap, setRekap] = useState<RekapLaporan | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("detail");

  const isKajur = location.pathname.includes("/monitoring/jurusan");

  useEffect(() => {
    if (id) {
      loadRekap();
    }
  }, [id, isKajur]);

  const loadRekap = async () => {
    setIsLoading(true);
    try {
      const data = await getRekap(id!, isKajur);
      setRekap(data);
    } catch (error) {
      toast.error("Gagal memuat detail rekap");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Detail Rekap" breadcrumbs={[{ label: "Detail Rekap" }]}>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-2">Memuat data rekap...</p>
        </div>
      </MainLayout>
    );
  }

  if (!rekap) {
    return (
      <MainLayout title="Detail Rekap" breadcrumbs={[{ label: "Detail Rekap" }]}>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="w-8 h-8" />
          <p className="mt-2">Rekap tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd MMM yyyy"); } catch { return dateStr; }
  };

  const formatDateTime = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd MMM yyyy HH:mm"); } catch { return dateStr; }
  };

  const getKegiatanDateRange = (): { mulai: string; selesai: string } | null => {
    const dates = rekap.kegiatanData
      .filter((k: any) => k.tanggal_mulai)
      .map((k: any) => new Date(k.tanggal_mulai).getTime());
    if (dates.length === 0) return null;
    const min = new Date(Math.min(...dates));
    const max = rekap.kegiatanData
      .filter((k: any) => k.tanggal_selesai)
      .reduce((latest: Date | null, k: any) => {
        const d = new Date(k.tanggal_selesai);
        return !latest || d > latest ? d : latest;
      }, null);
    return {
      mulai: formatDate(min.toISOString()),
      selesai: max ? formatDate(max.toISOString()) : formatDate(min.toISOString()),
    };
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case "PENDIDIKAN": return <Badge className="bg-blue-500">Pendidikan</Badge>;
      case "PENELITIAN": return <Badge className="bg-green-500">Penelitian</Badge>;
      case "PENGABDIAN": return <Badge className="bg-purple-500">Pengabdian</Badge>;
      case "TUGAS_TAMBAHAN": return <Badge className="bg-orange-500">Tugas Tambahan</Badge>;
      default: return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      exportRekapXlsx(rekap);
      toast.success('File Excel berhasil diunduh');
    } else {
      exportRekapCsv(rekap);
      toast.success('File CSV berhasil diunduh');
    }
  };

  const backPath = isKajur ? "/monitoring/jurusan/rekap" : "/monitoring/prodi/rekap";

  return (
    <MainLayout
      title={`Laporan Rekapitulasi - ${rekap.nama}`}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: isKajur ? "Monitoring Jurusan" : "Monitoring Prodi", path: isKajur ? "/monitoring/jurusan" : "/monitoring/prodi" },
        { label: "Laporan Rekapitulasi", path: backPath },
        { label: rekap.nama },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Unduh
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  Format Excel (XLSX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Format CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate(`${backPath}/${rekap.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Rekap
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="detail">
              <FileText className="w-4 h-4 mr-2" />
              Detail
            </TabsTrigger>
            <TabsTrigger value="riwayat">
              <History className="w-4 h-4 mr-2" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-6 mt-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Nama Rekap
                </p>
                <p className="font-medium">{rekap.nama}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tanggal Perekapan
                </p>
                <p className="font-medium">{formatDate(rekap.tanggalPerekapan)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> Dibuat Oleh
                </p>
                <p className="font-medium">{rekap.dibuatOleh.nama}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {rekap.dibuatOleh.role === "kajur" ? "Kajur" : "Kaprodi"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Kegiatan</p>
                <p className="font-medium">{rekap.kegiatanData.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tgl Mulai Pelaksanaan</p>
                <p className="font-medium">{getKegiatanDateRange()?.mulai || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tgl Selesai Pelaksanaan</p>
                <p className="font-medium">{getKegiatanDateRange()?.selesai || '-'}</p>
              </div>
              {isKajur && rekap.prodiNama && (
                <div>
                  <p className="text-sm text-muted-foreground">Program Studi</p>
                  <p className="font-medium">{rekap.prodiNama}</p>
                </div>
              )}
              {rekap.filter.tanggalAwal && (
                <div>
                  <p className="text-sm text-muted-foreground">Rentang Tanggal</p>
                  <p className="font-medium">
                    {formatDate(rekap.filter.tanggalAwal)} -
                    {rekap.filter.tanggalAkhir ? formatDate(rekap.filter.tanggalAkhir) : " Sekarang"}
                  </p>
                </div>
              )}
              {rekap.filter.jenisTridharma && rekap.filter.jenisTridharma.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Jenis Tridharma
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rekap.filter.jenisTridharma.map((j) => (
                      <Badge key={j} variant="outline" className="text-xs">{j}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {rekap.filter.kategori && rekap.filter.kategori.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Kategori
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rekap.filter.kategori.map((k) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {k.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kegiatan */}
            <div>
              <h3 className="font-semibold mb-3">Daftar Kegiatan ({rekap.kegiatanData.length})</h3>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead className="min-w-[180px]">Nama Kegiatan</TableHead>
                      <TableHead className="min-w-[140px]">Dosen</TableHead>
                      <TableHead className="min-w-[120px]">Kategori Tridharma</TableHead>
                      <TableHead className="min-w-[140px]">Jenis Kegiatan</TableHead>
                      <TableHead className="min-w-[120px]">Tanggal</TableHead>
                      <TableHead className="min-w-[200px]">Dokumen Bukti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekap.kegiatanData.map((kegiatan: any, i: number) => (
                      <TableRow key={kegiatan.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{kegiatan.nama_kegiatan}</TableCell>
                        <TableCell>{kegiatan.dosen?.nama || "-"}</TableCell>
                        <TableCell>{getJenisBadge(kegiatan.kategori_tridharma)}</TableCell>
                        <TableCell className="text-sm">{kegiatan.jenis_kegiatan?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDate(kegiatan.tanggal_mulai)}
                          {kegiatan.tanggal_selesai && ` - ${formatDate(kegiatan.tanggal_selesai)}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {kegiatan.lampiran_bukti && kegiatan.lampiran_bukti.length > 0 ? (
                              kegiatan.lampiran_bukti.map((lb: any, j: number) => (
                                <a
                                  key={j}
                                  href={lb.file_url || lb.path || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 underline hover:text-blue-800 truncate max-w-[180px] block"
                                >
                                  {lb.nama_file || lb.nama || `Dokumen ${j + 1}`}
                                </a>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rekap.kegiatanData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          Tidak ada data kegiatan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="riwayat" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 bg-background">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Riwayat Aktivitas
              </h3>
              <div className="space-y-3">
                {[...rekap.riwayat].reverse().map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.aktivitas}</p>
                      {r.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.dilakukanOleh} &middot; {formatDateTime(r.waktu)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!rekap.riwayat || rekap.riwayat.length === 0) && (
                  <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
