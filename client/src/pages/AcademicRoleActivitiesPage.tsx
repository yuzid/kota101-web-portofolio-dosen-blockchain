import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Search,
  Eye,
  Activity,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  FileText,
  CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { createRekap } from "../lib/rekapStorage";

interface Activity {
  id: string;
  nama_kegiatan: string;
  kategori_tridharma: string;
  jenis_kegiatan: string;
  periode: string;
  semester: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dosen_id: string;
  dosen: {
    nama: string;
    nip: string;
    nidn: string;
    program_studi: {
      nama_prodi: string;
    }
  };
  partisipasi: any[];
  lampiran_bukti: any[];
}

export function AcademicRoleActivitiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State from AMIRecapPage structure
  const [activeTab, setActiveTab] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProdi, setFilterProdi] = useState("all");
  const [filterDosen, setFilterDosen] = useState("all");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterKelengkapan, setFilterKelengkapan] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  // Pagination and data state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  
  const [counts, setCounts] = useState({
    semua: 0,
    PENDIDIKAN: 0,
    PENELITIAN: 0,
    PENGABDIAN: 0,
    TUGAS_TAMBAHAN: 0,
  });
  
  // Filter options
  const [dosenList, setDosenList] = useState<{id: string, nama: string}[]>([]);
  const [prodiList, setProdiList] = useState<{id: string, nama: string}[]>([]);
  const [kategoriList, setKategoriList] = useState<string[]>([]);

  // Rekap modal state
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [rekapForm, setRekapForm] = useState({ nama: '', tanggalPerekapan: '', tanggalAwal: '', tanggalAkhir: '', jenisTridharma: [] as string[], kategori: [] as string[] });
  const [isSubmittingRekap, setIsSubmittingRekap] = useState(false);
  const [previewData, setPreviewData] = useState<Activity[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);

  const kategoriByJenis: Record<string, string[]> = {
    PENDIDIKAN: ["PENGAJARAN", "BAHAN_AJAR", "BIMBINGAN_MAHASISWA", "PEMBINAAN_MAHASISWA", "PENGUJIAN_MAHASISWA"],
    PENELITIAN: ["PENELITIAN", "PUBLIKASI_KARYA", "PATEN"],
    PENGABDIAN: ["PENGABDIAN", "PEMBICARA", "PENGELOLA_JURNAL"],
    TUGAS_TAMBAHAN: ["TUGAS_TAMBAHAN"],
  };

  const allKategoris = Object.values(kategoriByJenis).flat();

  const filteredKategoris = rekapForm.jenisTridharma.length > 0
    ? rekapForm.jenisTridharma.flatMap(j => kategoriByJenis[j] || [])
    : allKategoris;

  const token = localStorage.getItem('token');
  const isKajur = location.pathname.includes('/monitoring/jurusan');
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const roleTitle = isKajur ? 'Jurusan' : 'Program Studi';

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [page, size, activeTab, filterProdi, filterDosen, filterKategori, filterKelengkapan, filterDateFrom, filterDateTo]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch Dosen
      const dResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?role=dosen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dResult = await dResponse.json();
      if (dResult.status === 'success') {
        setDosenList(dResult.data.map((u: any) => ({ 
          id: u.id, 
          nama: u.dosen?.nama || u.admin?.nama || u.tata_usaha?.nama || u.email 
        })));
      }

      // Fetch Prodi
      const pResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pResult = await pResponse.json();
      if (pResult.status === 'success') {
        setProdiList(pResult.data.map((p: any) => ({ id: p.id, nama: p.nama_prodi })));
      }

      // Kategori are fixed but could be dynamic
      setKategoriList([
        "PENGAJARAN", "BAHAN_AJAR", "BIMBINGAN_MAHASISWA", 
        "PENELITIAN", "PUBLIKASI_KARYA", "PATEN", 
        "PENGABDIAN", "TUGAS_TAMBAHAN"
      ]);
    } catch (error) {
      console.error('Gagal mengambil opsi filter', error);
    }
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (activeTab !== 'semua') params.append('jenis', activeTab);
      if (isKajur && filterProdi !== 'all') params.append('prodiId', filterProdi);
      if (filterDosen !== 'all') params.append('dosenId', filterDosen);
      if (filterKategori !== 'all') params.append('kategori', filterKategori);
      if (filterKelengkapan !== 'all') params.append('status', filterKelengkapan);
      if (filterDateFrom) params.append('tanggalAwal', filterDateFrom.toISOString());
      if (filterDateTo) params.append('tanggalAkhir', filterDateTo.toISOString());

      // Fetch data
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/akademik-role/${endpoint}/kegiatan?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const result = await response.json();
      if (result.status === 'success') {
        setActivities(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.error || 'Gagal mengambil data kegiatan');
      }

      // Fetch Stats for badges
      const statsParams = new URLSearchParams();
      if (searchTerm) statsParams.append('search', searchTerm);
      if (isKajur && filterProdi !== 'all') statsParams.append('prodiId', filterProdi);
      if (filterDosen !== 'all') statsParams.append('dosenId', filterDosen);
      if (filterKategori !== 'all') statsParams.append('kategori', filterKategori);
      if (filterKelengkapan !== 'all') statsParams.append('status', filterKelengkapan);
      if (filterDateFrom) statsParams.append('tanggalAwal', filterDateFrom.toISOString());
      if (filterDateTo) statsParams.append('tanggalAkhir', filterDateTo.toISOString());

      const sResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/akademik-role/${endpoint}/stats?${statsParams.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const sResult = await sResponse.json();
      if (sResult.status === 'success') {
        setCounts(sResult.data);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case "PENDIDIKAN":
        return <Badge className="bg-blue-500">Pengajaran</Badge>;
      case "PENELITIAN":
        return <Badge className="bg-green-500">Penelitian</Badge>;
      case "PENGABDIAN":
        return <Badge className="bg-purple-500">Pengabdian</Badge>;
      case "TUGAS_TAMBAHAN":
        return <Badge className="bg-orange-500">Tugas Tambahan</Badge>;
      default:
        return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  const getKelengkapanBadge = (activity: Activity) => {
    // Logic: Lengkap jika ada minimal 1 lampiran bukti
    const isLengkap = activity.lampiran_bukti.length > 0;
    if (isLengkap) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Lengkap
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500">
        <AlertCircle className="w-3 h-3 mr-1" />
        Tidak Lengkap
      </Badge>
    );
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterProdi !== "all" ||
    filterDosen !== "all" ||
    filterKategori !== "all" ||
    filterKelengkapan !== "all" ||
    filterDateFrom ||
    filterDateTo;

  const resetFilters = () => {
    setSearchTerm("");
    setFilterProdi("all");
    setFilterDosen("all");
    setFilterKategori("all");
    setFilterKelengkapan("all");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setPage(1);
  };

  const openRekapModal = () => {
    setRekapForm({ nama: '', tanggalPerekapan: new Date().toISOString().split('T')[0], tanggalAwal: '', tanggalAkhir: '', jenisTridharma: [], kategori: [] });
    setPreviewData([]);
    setHasPreviewed(false);
    setShowRekapModal(true);
  };

  const handleBuatRekap = async () => {
    if (!rekapForm.nama.trim()) {
      toast.error('Nama rekap harus diisi');
      return;
    }
    if (!rekapForm.tanggalPerekapan) {
      toast.error('Tanggal perekapan harus diisi');
      return;
    }

    setIsSubmittingRekap(true);
    try {
      const params = new URLSearchParams({ page: '1', size: '1000' });
      if (rekapForm.tanggalAwal) params.append('tanggalAwal', new Date(rekapForm.tanggalAwal).toISOString());
      if (rekapForm.tanggalAkhir) params.append('tanggalAkhir', new Date(rekapForm.tanggalAkhir).toISOString());
      if (rekapForm.jenisTridharma.length > 0) {
        rekapForm.jenisTridharma.forEach(j => params.append('jenis', j));
      }
      if (rekapForm.kategori.length > 0) {
        rekapForm.kategori.forEach(k => params.append('kategori', k));
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/akademik-role/${endpoint}/kegiatan?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await response.json();

      if (result.status !== 'success') {
        toast.error(result.error || 'Gagal mengambil data kegiatan');
        return;
      }

      const kegiatanData = result.data.data;
      if (kegiatanData.length === 0) {
        toast.error('Tidak ada kegiatan yang sesuai dengan filter. Rekap tidak dibuat.');
        return;
      }

      const rekap = createRekap({
        nama: rekapForm.nama.trim(),
        tanggalPerekapan: rekapForm.tanggalPerekapan,
        dibuatOleh: { id: user?.id || '', nama: user?.name || '', role: isKajur ? 'kajur' : 'kaprodi' },
        prodiId: isKajur ? '' : (user?.programStudi || ''),
        prodiNama: isKajur ? '' : (user?.programStudi || ''),
        jurusanId: isKajur ? 'kajur' : '',
        jurusanNama: isKajur ? 'Jurusan' : '',
        filter: {
          tanggalAwal: rekapForm.tanggalAwal || undefined,
          tanggalAkhir: rekapForm.tanggalAkhir || undefined,
          jenisTridharma: rekapForm.jenisTridharma.length > 0 ? rekapForm.jenisTridharma : undefined,
          kategori: rekapForm.kategori.length > 0 ? rekapForm.kategori : undefined,
        },
        kegiatanData,
      });

      toast.success(`Rekap "${rekap.nama}" berhasil dibuat dengan ${kegiatanData.length} kegiatan`);
      setShowRekapModal(false);
    } catch {
      toast.error('Terjadi kesalahan saat membuat rekap');
    } finally {
      setIsSubmittingRekap(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewLoading(true);
    setHasPreviewed(true);
    try {
      const params = new URLSearchParams({ page: '1', size: '1000' });
      if (rekapForm.tanggalAwal) params.append('tanggalAwal', new Date(rekapForm.tanggalAwal).toISOString());
      if (rekapForm.tanggalAkhir) params.append('tanggalAkhir', new Date(rekapForm.tanggalAkhir).toISOString());
      if (rekapForm.jenisTridharma.length > 0) {
        rekapForm.jenisTridharma.forEach(j => params.append('jenis', j));
      }
      if (rekapForm.kategori.length > 0) {
        rekapForm.kategori.forEach(k => params.append('kategori', k));
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dosen/akademik-role/${endpoint}/kegiatan?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await response.json();
      if (result.status === 'success') {
        setPreviewData(result.data.data);
      } else {
        toast.error(result.error || 'Gagal memuat preview');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const toggleJenisTridharma = (jenis: string) => {
    setRekapForm(prev => {
      const newJenis = prev.jenisTridharma.includes(jenis)
        ? prev.jenisTridharma.filter(j => j !== jenis)
        : [...prev.jenisTridharma, jenis];
      const removedKategoris = kategoriByJenis[jenis] || [];
      const newKategori = prev.kategori.filter(k => !removedKategoris.includes(k) || newJenis.includes(jenis));
      return { ...prev, jenisTridharma: newJenis, kategori: newKategori };
    });
  };

  const toggleKategori = (kat: string) => {
    setRekapForm(prev => ({
      ...prev,
      kategori: prev.kategori.includes(kat) ? prev.kategori.filter(k => k !== kat) : [...prev.kategori, kat],
    }));
  };

  // UI Helper: formatting category names for display
  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <MainLayout
      title={`Monitoring Kegiatan ${roleTitle}`}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: `Monitoring ${roleTitle}` },
      ]}
    >
      <div className="space-y-4">
        {/* Header from AMIRecapPage */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Monitoring Kegiatan</h2>
            <p className="text-sm text-muted-foreground">
              {isKajur ? "Seluruh Jurusan" : `Program Studi: ${user?.programStudi || "Memuat..."}`}
            </p>
          </div>
          <Button onClick={openRekapModal}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Rekap
          </Button>
        </div>

        {/* Info Banner from AMIRecapPage */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 mb-1">
            ℹ️ Tentang Status Kelengkapan:
          </p>
          <p className="text-blue-800">
            Status <strong>"Lengkap"</strong> berarti kegiatan sudah memiliki minimal satu dokumen bukti yang terlampir. 
            Status <strong>"Tidak Lengkap"</strong> berarti kegiatan belum memiliki dokumen bukti sama sekali.
          </p>
        </div>

        {/* Stats Cards from AMIRecapPage (Placeholder counts based on current list or simple logic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Kegiatan
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Kegiatan ditemukan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Halaman Saat Ini
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activities.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Kegiatan ditampilkan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Halaman
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalPages}
              </div>
              <p className="text-xs text-muted-foreground">
                Data terpaginasi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content from AMIRecapPage */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="semua">
              Semua
              <Badge variant="secondary" className="ml-2">
                {counts.semua}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="PENDIDIKAN">
              Pengajaran
              <Badge variant="secondary" className="ml-2">
                {counts.PENDIDIKAN}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="PENELITIAN">
              Penelitian
              <Badge variant="secondary" className="ml-2">
                {counts.PENELITIAN}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="PENGABDIAN">
              Pengabdian
              <Badge variant="secondary" className="ml-2">
                {counts.PENGABDIAN}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="TUGAS_TAMBAHAN">
              Tugas Tambahan
              <Badge variant="secondary" className="ml-2">
                {counts.TUGAS_TAMBAHAN}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Filters from AMIRecapPage */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari kegiatan atau dosen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={filterDosen} onValueChange={setFilterDosen}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Dosen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dosen</SelectItem>
                    {dosenList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateFrom
                        ? format(filterDateFrom, "dd MMM yyyy")
                        : "Dari tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDateFrom}
                      onSelect={setFilterDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateTo
                        ? format(filterDateTo, "dd MMM yyyy")
                        : "Sampai tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDateTo}
                      onSelect={setFilterDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button variant="outline" onClick={resetFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {isKajur && (
                  <Select value={filterProdi} onValueChange={setFilterProdi}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Program Studi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Prodi</SelectItem>
                      {prodiList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={filterKategori}
                  onValueChange={setFilterKategori}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Kategori Kegiatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoriList.map((k) => (
                      <SelectItem key={k} value={k}>{formatCategory(k)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterKelengkapan}
                  onValueChange={setFilterKelengkapan}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kelengkapan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lengkap">Lengkap</SelectItem>
                    <SelectItem value="tidak_lengkap">Tidak Lengkap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table from AMIRecapPage */}
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kegiatan</TableHead>
                    <TableHead>Pencatat</TableHead>
                    {isKajur && <TableHead>Program Studi</TableHead>}
                    <TableHead>Kategori</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-center">Anggota</TableHead>
                    <TableHead className="text-center">Dokumen</TableHead>
                    <TableHead className="text-center">Kelengkapan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isKajur ? 9 : 8} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Memuat data monitoring...</p>
                      </TableCell>
                    </TableRow>
                  ) : activities.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isKajur ? 9 : 8}
                        className="text-center py-8"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Activity className="w-8 h-8" />
                          <p>Tidak ada kegiatan yang sesuai dengan filter</p>
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetFilters}
                            >
                              Reset Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {activity.nama_kegiatan}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.tanggal_mulai), "dd MMM yyyy")}
                              {activity.tanggal_selesai && ` - ${format(new Date(activity.tanggal_selesai), "dd MMM yyyy")}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.dosen.nama}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              NIDN: {activity.dosen.nidn}
                            </p>
                          </div>
                        </TableCell>
                        {isKajur && (
                          <TableCell className="text-sm">
                            {activity.dosen.program_studi.nama_prodi}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="space-y-1">
                            {getJenisBadge(activity.kategori_tridharma)}
                            <p className="text-xs text-muted-foreground">
                              {formatCategory(activity.jenis_kegiatan)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.periode}
                          <br />
                          <span className="text-xs text-muted-foreground capitalize">
                            Sem. {activity.semester.toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.partisipasi.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            {activity.lampiran_bukti.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getKelengkapanBadge(activity)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/activities/${activity.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls added for real data support */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * size + 1} sampai {Math.min(page * size, total)} dari {total} kegiatan
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Sebelumnya
                </Button>
                <div className="text-sm font-medium">
                  Halaman {page} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rekap Modal */}
      <Dialog open={showRekapModal} onOpenChange={setShowRekapModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>Buat Rekap Kegiatan</DialogTitle>
              <DialogDescription>
                Atur filter, lihat preview, lalu simpan rekap
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="bg-muted/20 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rekap-nama" className="text-sm font-semibold">Nama Rekap *</Label>
                <Input
                  id="rekap-nama"
                  value={rekapForm.nama}
                  onChange={(e) => setRekapForm({ ...rekapForm, nama: e.target.value })}
                  placeholder="Contoh: Rekap Pengajaran Ganjil 2025"
                  className="border-muted-foreground/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rekap-tanggal" className="text-sm font-semibold">Tanggal Perekapan *</Label>
                <Input
                  id="rekap-tanggal"
                  type="date"
                  value={rekapForm.tanggalPerekapan}
                  onChange={(e) => setRekapForm({ ...rekapForm, tanggalPerekapan: e.target.value })}
                  className="border-muted-foreground/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rekap-tanggal-awal" className="text-sm font-semibold">Tanggal Mulai</Label>
                  <Input
                    id="rekap-tanggal-awal"
                    type="date"
                    value={rekapForm.tanggalAwal}
                    onChange={(e) => setRekapForm({ ...rekapForm, tanggalAwal: e.target.value })}
                    className="border-muted-foreground/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rekap-tanggal-akhir" className="text-sm font-semibold">Tanggal Selesai</Label>
                  <Input
                    id="rekap-tanggal-akhir"
                    type="date"
                    value={rekapForm.tanggalAkhir}
                    onChange={(e) => setRekapForm({ ...rekapForm, tanggalAkhir: e.target.value })}
                    className="border-muted-foreground/20"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Jenis Tridharma</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(kategoriByJenis).map((jenis) => (
                    <Badge
                      key={jenis}
                      variant={rekapForm.jenisTridharma.includes(jenis) ? "default" : "outline"}
                      className={`cursor-pointer text-xs px-3 py-1.5 ${
                        rekapForm.jenisTridharma.includes(jenis)
                          ? jenis === "PENDIDIKAN" ? "bg-blue-500" :
                            jenis === "PENELITIAN" ? "bg-green-500" :
                            jenis === "PENGABDIAN" ? "bg-purple-500" : "bg-orange-500"
                          : ""
                      }`}
                      onClick={() => toggleJenisTridharma(jenis)}
                    >
                      {formatCategory(jenis)}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Pilih jenis tridharma, lalu pilih kategori di bawah</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label className="text-sm font-semibold">Kategori Kegiatan</Label>
                <div className="flex flex-wrap gap-2">
                  {filteredKategoris.map((kat) => (
                    <Badge
                      key={kat}
                      variant={rekapForm.kategori.includes(kat) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleKategori(kat)}
                    >
                      {formatCategory(kat)}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk mengambil semua kategori
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handlePreview}
              disabled={isPreviewLoading}
            >
              {isPreviewLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Lihat Preview Data
            </Button>

            {(hasPreviewed || previewData.length > 0) && (
              <div className="rounded-lg border">
                <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Preview Data {isPreviewLoading && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                  </span>
                  <Badge variant="secondary">{previewData.length} kegiatan</Badge>
                </div>
                <div className="overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">No</TableHead>
                        <TableHead className="min-w-[180px]">Nama Kegiatan</TableHead>
                        <TableHead className="min-w-[120px]">Dosen</TableHead>
                        <TableHead className="min-w-[120px]">Kategori</TableHead>
                        <TableHead className="min-w-[100px]">Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isPreviewLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : previewData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Tidak ada kegiatan yang sesuai filter
                          </TableCell>
                        </TableRow>
                      ) : (
                        previewData.map((a, i) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs">{i + 1}</TableCell>
                            <TableCell className="text-sm font-medium">{a.nama_kegiatan}</TableCell>
                            <TableCell className="text-sm">{a.dosen?.nama || '-'}</TableCell>
                            <TableCell>{getJenisBadge(a.kategori_tridharma)}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {a.tanggal_mulai ? format(new Date(a.tanggal_mulai), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t p-6 pt-4 mt-0">
            <Button variant="outline" onClick={() => setShowRekapModal(false)} disabled={isSubmittingRekap}>
              Batal
            </Button>
            <Button onClick={handleBuatRekap} disabled={isSubmittingRekap || previewData.length === 0}>
              {isSubmittingRekap && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat Rekap ({previewData.length} kegiatan)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
