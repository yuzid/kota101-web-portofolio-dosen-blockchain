import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Filter,
  FileText,
  Save,
  ChevronDown,
  BookOpen,
  Clock,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import {
  getRekap,
  updateRekap,
  exportRekapXlsx,
  exportRekapCsv,
  type RekapLaporan,
} from "../lib/rekapStorage";

export function RekapLaporanEditPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [rekap, setRekap] = useState<RekapLaporan | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [tanggalPerekapan, setTanggalPerekapan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setNama(data.nama);
      setTanggalPerekapan(data.tanggalPerekapan.split('T')[0]);
    } catch (error) {
      toast.error("Gagal memuat rekap");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Edit Rekap" breadcrumbs={[{ label: "Edit Rekap" }]}>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-2">Memuat data rekap...</p>
        </div>
      </MainLayout>
    );
  }

  if (!rekap) {
    return (
      <MainLayout title="Edit Rekap" breadcrumbs={[{ label: "Edit Rekap" }]}>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Rekap tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const backPath = isKajur ? "/monitoring/jurusan/rekap" : "/monitoring/prodi/rekap";

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

  const handleSubmit = async () => {
    if (!nama.trim()) {
      toast.error("Nama rekap harus diisi");
      return;
    }
    if (!tanggalPerekapan) {
      toast.error("Tanggal perekapan harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateRekap(rekap.id, {
        nama: nama.trim(),
        tanggalPerekapan,
      }, isKajur);
      
      if (updated) {
        toast.success("Rekap berhasil diperbarui");
        navigate(`${backPath}/${rekap.id}`);
      } else {
        toast.error("Gagal memperbarui rekap");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui rekap");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      title={`Laporan Rekapitulasi - ${rekap.nama}`}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: isKajur ? "Monitoring Jurusan" : "Monitoring Prodi", path: isKajur ? "/monitoring/jurusan" : "/monitoring/prodi" },
        { label: "Laporan Rekapitulasi", path: backPath },
        { label: rekap.nama, path: `${backPath}/${rekap.id}` },
        { label: "Edit" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate(`${backPath}/${rekap.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Detail
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
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Laporan Rekapitulasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Rekap *</Label>
                <Input
                  id="edit-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama rekap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tanggal">Tanggal Perekapan *</Label>
                <Input
                  id="edit-tanggal"
                  type="date"
                  value={tanggalPerekapan}
                  onChange={(e) => setTanggalPerekapan(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate(`${backPath}/${rekap.id}`)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Rekap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> Dibuat Oleh
                </p>
                <p className="font-medium text-sm">{rekap.dibuatOleh.nama}</p>
                <Badge variant="outline" className="text-xs">{rekap.dibuatOleh.role === "kajur" ? "Kajur" : "Kaprodi"}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Jumlah Kegiatan
                </p>
                <p className="font-medium text-sm">{rekap.kegiatanData.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tgl Mulai Pelaksanaan
                </p>
                <p className="font-medium text-sm">{getKegiatanDateRange()?.mulai || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tgl Selesai Pelaksanaan
                </p>
                <p className="font-medium text-sm">{getKegiatanDateRange()?.selesai || '-'}</p>
              </div>
              {isKajur && rekap.prodiNama && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Program Studi</p>
                  <p className="font-medium text-sm">{rekap.prodiNama}</p>
                </div>
              )}
              {rekap.filter.tanggalAwal && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Rentang Tanggal</p>
                  <p className="font-medium text-sm">
                    {formatDate(rekap.filter.tanggalAwal)} - {rekap.filter.tanggalAkhir ? formatDate(rekap.filter.tanggalAkhir) : "Sekarang"}
                  </p>
                </div>
              )}
              {rekap.filter.jenisTridharma && rekap.filter.jenisTridharma.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
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
          </CardContent>
        </Card>

        {/* Riwayat Aktivitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Riwayat Aktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...rekap.riwayat].reverse().map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.aktivitas}</p>
                    <p className="text-muted-foreground">
                      {r.dilakukanOleh} &middot; {formatDateTime(r.waktu)}
                    </p>
                  </div>
                </div>
              ))}
              {(!rekap.riwayat || rekap.riwayat.length === 0) && (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kegiatan ({rekap.kegiatanData.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                                href={`/documents/${lb.dokumen?.id || lb.dokumen_id}/preview`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 underline hover:text-blue-800 truncate max-w-[180px] block"
                              >
                                {lb.dokumen?.nama || lb.nama_file || lb.nama || `Dokumen ${j + 1}`}
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
