import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
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
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Search,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  Activity,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface DosenTerlibat {
  id: string;
  name: string;
  nidn: string;
  isPencatat: boolean;
  isKetua: boolean;
  jumlahDokumen: number;
}

interface ActivityRecap {
  id: string;
  namaKegiatan: string;
  jenisTridharma: "pengajaran" | "penelitian" | "pengabdian" | "tugas_tambahan";
  kategori: string;
  pencatat: string;
  nidn: string;
  programStudi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tahunAkademik: string;
  semester: string;
  sumberDana: string;
  biaya: number;
  dosenTerlibat: DosenTerlibat[];
  statusKelengkapan: "lengkap" | "tidak_lengkap";
}

const mockActivities: ActivityRecap[] = [
  {
    id: "1",
    namaKegiatan: "Mata Kuliah Pemrograman Web",
    jenisTridharma: "pengajaran",
    kategori: "Mengajar",
    pencatat: "Dr. John Doe",
    nidn: "0412108901",
    programStudi: "D4 Teknik Informatika",
    tanggalMulai: "2026-01-15",
    tanggalSelesai: "2026-05-30",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "DIPA POLBAN",
    biaya: 5000000,
    dosenTerlibat: [
      {
        id: "1",
        name: "Dr. John Doe",
        nidn: "0412108901",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 2,
      },
    ],
    statusKelengkapan: "lengkap",
  },
  {
    id: "2",
    namaKegiatan: "Penelitian Blockchain untuk E-Government",
    jenisTridharma: "penelitian",
    kategori: "Penelitian Kelompok",
    pencatat: "Dr. Ahmad Fauzi",
    nidn: "0420059102",
    programStudi: "D4 Teknik Informatika",
    tanggalMulai: "2026-02-01",
    tanggalSelesai: "2026-07-31",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "Hibah Eksternal",
    biaya: 50000000,
    dosenTerlibat: [
      {
        id: "2",
        name: "Dr. Ahmad Fauzi",
        nidn: "0420059102",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 1,
      },
      {
        id: "1",
        name: "Dr. John Doe",
        nidn: "0412108901",
        isPencatat: false,
        isKetua: false,
        jumlahDokumen: 1,
      },
      {
        id: "3",
        name: "Dr. Siti Nurhaliza",
        nidn: "0405067801",
        isPencatat: false,
        isKetua: false,
        jumlahDokumen: 0,
      },
    ],
    statusKelengkapan: "tidak_lengkap",
  },
  {
    id: "3",
    namaKegiatan: "Pelatihan Web Development untuk UMKM",
    jenisTridharma: "pengabdian",
    kategori: "Pelatihan Masyarakat",
    pencatat: "Dr. Siti Nurhaliza",
    nidn: "0405067801",
    programStudi: "D3 Teknik Informatika",
    tanggalMulai: "2026-03-10",
    tanggalSelesai: "2026-03-12",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "Mandiri",
    biaya: 3000000,
    dosenTerlibat: [
      {
        id: "3",
        name: "Dr. Siti Nurhaliza",
        nidn: "0405067801",
        isPencatat: true,
        isKetua: false,
        jumlahDokumen: 2,
      },
      {
        id: "4",
        name: "Prof. Budi Santoso",
        nidn: "0418088902",
        isPencatat: false,
        isKetua: true,
        jumlahDokumen: 1,
      },
    ],
    statusKelengkapan: "lengkap",
  },
  {
    id: "4",
    namaKegiatan: "Koordinator Laboratorium Pemrograman",
    jenisTridharma: "tugas_tambahan",
    kategori: "Koordinator Laboratorium",
    pencatat: "Prof. Budi Santoso",
    nidn: "0418088902",
    programStudi: "D3 Teknik Informatika",
    tanggalMulai: "2025-08-01",
    tanggalSelesai: "2026-07-31",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "DIPA POLBAN",
    biaya: 0,
    dosenTerlibat: [
      {
        id: "4",
        name: "Prof. Budi Santoso",
        nidn: "0418088902",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 1,
      },
    ],
    statusKelengkapan: "lengkap",
  },
  {
    id: "5",
    namaKegiatan: "Publikasi Jurnal Internasional IoT",
    jenisTridharma: "penelitian",
    kategori: "Publikasi Jurnal",
    pencatat: "Dr. John Doe",
    nidn: "0412108901",
    programStudi: "D4 Teknik Informatika",
    tanggalMulai: "2026-01-05",
    tanggalSelesai: "2026-04-20",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "Hibah Eksternal",
    biaya: 15000000,
    dosenTerlibat: [
      {
        id: "1",
        name: "Dr. John Doe",
        nidn: "0412108901",
        isPencatat: true,
        isKetua: false,
        jumlahDokumen: 1,
      },
      {
        id: "2",
        name: "Dr. Ahmad Fauzi",
        nidn: "0420059102",
        isPencatat: false,
        isKetua: true,
        jumlahDokumen: 1,
      },
    ],
    statusKelengkapan: "lengkap",
  },
  {
    id: "6",
    namaKegiatan: "Mata Kuliah Basis Data",
    jenisTridharma: "pengajaran",
    kategori: "Mengajar",
    pencatat: "Dr. Ahmad Fauzi",
    nidn: "0420059102",
    programStudi: "D4 Teknik Informatika",
    tanggalMulai: "2026-01-15",
    tanggalSelesai: "2026-05-30",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "DIPA POLBAN",
    biaya: 4000000,
    dosenTerlibat: [
      {
        id: "2",
        name: "Dr. Ahmad Fauzi",
        nidn: "0420059102",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 0,
      },
    ],
    statusKelengkapan: "tidak_lengkap",
  },
  {
    id: "7",
    namaKegiatan: "Pembimbingan Tugas Akhir",
    jenisTridharma: "pengajaran",
    kategori: "Pembimbing TA",
    pencatat: "Dr. Siti Nurhaliza",
    nidn: "0405067801",
    programStudi: "D3 Teknik Informatika",
    tanggalMulai: "2026-02-01",
    tanggalSelesai: "2026-06-30",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "",
    biaya: 0,
    dosenTerlibat: [
      {
        id: "3",
        name: "Dr. Siti Nurhaliza",
        nidn: "0405067801",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 1,
      },
    ],
    statusKelengkapan: "lengkap",
  },
  {
    id: "8",
    namaKegiatan: "Konsultasi IT untuk Desa Cibiru",
    jenisTridharma: "pengabdian",
    kategori: "Konsultasi Masyarakat",
    pencatat: "Prof. Budi Santoso",
    nidn: "0418088902",
    programStudi: "D3 Teknik Informatika",
    tanggalMulai: "2026-04-01",
    tanggalSelesai: "2026-04-03",
    tahunAkademik: "2025/2026",
    semester: "ganjil",
    sumberDana: "Mandiri",
    biaya: 2000000,
    dosenTerlibat: [
      {
        id: "4",
        name: "Prof. Budi Santoso",
        nidn: "0418088902",
        isPencatat: true,
        isKetua: true,
        jumlahDokumen: 1,
      },
      {
        id: "3",
        name: "Dr. Siti Nurhaliza",
        nidn: "0405067801",
        isPencatat: false,
        isKetua: false,
        jumlahDokumen: 1,
      },
    ],
    statusKelengkapan: "lengkap",
  },
];

export function AMIRecapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProdi, setFilterProdi] = useState("all");
  const [filterDosen, setFilterDosen] = useState("all");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterKelengkapan, setFilterKelengkapan] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(
    undefined
  );
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  // Determine scope based on role
  const isKaprodi = user?.roles?.includes("kaprodi");
  const isKajur = user?.roles?.includes("kajur");

  // Filter activities based on role and filters
  const filteredActivities = mockActivities.filter((activity) => {
    // Role-based filter
    if (
      isKaprodi &&
      user?.programStudi &&
      activity.programStudi !== user.programStudi
    ) {
      return false;
    }

    // Search filter
    const matchesSearch =
      activity.namaKegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.pencatat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.nidn.includes(searchTerm);

    // Prodi filter
    const matchesProdi =
      filterProdi === "all" || activity.programStudi === filterProdi;

    // Dosen filter
    const matchesDosen =
      filterDosen === "all" || activity.pencatat === filterDosen;

    // Jenis tridharma filter
    const matchesJenis =
      filterJenis === "all" || activity.jenisTridharma === filterJenis;

    // Kategori filter
    const matchesKategori =
      filterKategori === "all" || activity.kategori === filterKategori;

    // Kelengkapan filter
    const matchesKelengkapan =
      filterKelengkapan === "all" ||
      activity.statusKelengkapan === filterKelengkapan;

    // Date range filter
    let matchesDateRange = true;
    if (filterDateFrom || filterDateTo) {
      const activityStart = new Date(activity.tanggalMulai);
      const activityEnd = new Date(activity.tanggalSelesai);

      if (filterDateFrom && filterDateTo) {
        // Both dates set: activity must overlap with the range
        matchesDateRange =
          activityStart <= filterDateTo && activityEnd >= filterDateFrom;
      } else if (filterDateFrom) {
        // Only start date: activity must end after or on this date
        matchesDateRange = activityEnd >= filterDateFrom;
      } else if (filterDateTo) {
        // Only end date: activity must start before or on this date
        matchesDateRange = activityStart <= filterDateTo;
      }
    }

    // Tab filter
    const matchesTab =
      activeTab === "semua" || activity.jenisTridharma === activeTab;

    return (
      matchesSearch &&
      matchesProdi &&
      matchesDosen &&
      matchesJenis &&
      matchesKategori &&
      matchesKelengkapan &&
      matchesDateRange &&
      matchesTab
    );
  });

  const programStudiList = Array.from(
    new Set(mockActivities.map((a) => a.programStudi))
  );
  const dosenList = Array.from(new Set(mockActivities.map((a) => a.pencatat)));
  const kategoriList = Array.from(
    new Set(mockActivities.map((a) => a.kategori))
  );

  // Calculate stats
  const totalStats = {
    total: filteredActivities.length,
    lengkap: filteredActivities.filter((a) => a.statusKelengkapan === "lengkap")
      .length,
    tidakLengkap: filteredActivities.filter(
      (a) => a.statusKelengkapan === "tidak_lengkap"
    ).length,
    pengajaran: filteredActivities.filter(
      (a) => a.jenisTridharma === "pengajaran"
    ).length,
    penelitian: filteredActivities.filter(
      (a) => a.jenisTridharma === "penelitian"
    ).length,
    pengabdian: filteredActivities.filter(
      (a) => a.jenisTridharma === "pengabdian"
    ).length,
    tugasTambahan: filteredActivities.filter(
      (a) => a.jenisTridharma === "tugas_tambahan"
    ).length,
  };

  const counts = {
    semua: mockActivities.filter((a) => {
      if (
        isKaprodi &&
        user?.programStudi &&
        a.programStudi !== user.programStudi
      )
        return false;
      return true;
    }).length,
    pengajaran: mockActivities.filter((a) => {
      if (
        isKaprodi &&
        user?.programStudi &&
        a.programStudi !== user.programStudi
      )
        return false;
      return a.jenisTridharma === "pengajaran";
    }).length,
    penelitian: mockActivities.filter((a) => {
      if (
        isKaprodi &&
        user?.programStudi &&
        a.programStudi !== user.programStudi
      )
        return false;
      return a.jenisTridharma === "penelitian";
    }).length,
    pengabdian: mockActivities.filter((a) => {
      if (
        isKaprodi &&
        user?.programStudi &&
        a.programStudi !== user.programStudi
      )
        return false;
      return a.jenisTridharma === "pengabdian";
    }).length,
    tugas_tambahan: mockActivities.filter((a) => {
      if (
        isKaprodi &&
        user?.programStudi &&
        a.programStudi !== user.programStudi
      )
        return false;
      return a.jenisTridharma === "tugas_tambahan";
    }).length,
  };

  const handleExportRecap = () => {
    toast.success("Export rekap AMI sedang diproses...");
  };

  const handleViewDetail = (activityId: string) => {
    navigate(`/ami-recap/activity/${activityId}`);
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case "pengajaran":
         return <Badge className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Pendidikan</Badge>;
       case "penelitian":
         return <Badge className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">Penelitian</Badge>;
       case "pengabdian":
         return <Badge className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">Pengabdian</Badge>;
       case "tugas_tambahan":
         return <Badge className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">Tugas Tambahan</Badge>;
      default:
        return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  const getKelengkapanBadge = (status: string) => {
    if (status === "lengkap") {
      return (
        <Badge variant="outline" className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Lengkap
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Tidak Lengkap
      </Badge>
    );
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterProdi !== "all" ||
    filterDosen !== "all" ||
    filterJenis !== "all" ||
    filterKategori !== "all" ||
    filterKelengkapan !== "all" ||
    filterDateFrom ||
    filterDateTo;

  const resetFilters = () => {
    setSearchTerm("");
    setFilterProdi("all");
    setFilterDosen("all");
    setFilterJenis("all");
    setFilterKategori("all");
    setFilterKelengkapan("all");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  return (
    <MainLayout
      title="Rekap AMI (Audit Mutu Internal)"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Rekap AMI" },
      ]}
    >
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
        <div className="space-y-4">
         {/* Header */}
         <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Rekap AMI</h2>
            <p className="text-sm text-muted-foreground">
              {isKaprodi && `Program Studi: ${user?.programStudi}`}
              {isKajur && "Seluruh Jurusan"}
            </p>
          </div>
          <RippleButton onClick={handleExportRecap}>
            <Download className="w-4 h-4 mr-2" />
            Export Rekap
          </RippleButton>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
           <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
             ℹ️ Tentang Status Kelengkapan:
           </p>
           <p className="text-blue-800 dark:text-blue-400">
             Status <strong>"Lengkap"</strong> berarti semua dosen yang terlibat
             dalam kegiatan sudah mengupload minimal 1 dokumen bukti. Status{" "}
             <strong>"Tidak Lengkap"</strong> berarti ada dosen yang belum
             mengupload dokumen bukti.
           </p>
         </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Kegiatan
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.total}</div>
              <p className="text-xs text-muted-foreground">Kegiatan tercatat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Dokumen Lengkap
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalStats.lengkap}
              </div>
              <p className="text-xs text-muted-foreground">
                Semua dosen sudah upload
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Perlu Dilengkapi
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalStats.tidakLengkap}
              </div>
              <p className="text-xs text-muted-foreground">
                Ada dosen belum upload
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="semua">
              Semua{" "}
              <Badge variant="secondary" className="ml-2">
                {counts.semua}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pengajaran">
              Pendidikan{" "}
              <Badge variant="secondary" className="ml-2">
                {counts.pengajaran}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="penelitian">
              Penelitian{" "}
              <Badge variant="secondary" className="ml-2">
                {counts.penelitian}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pengabdian">
              Pengabdian{" "}
              <Badge variant="secondary" className="ml-2">
                {counts.pengabdian}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tugas_tambahan">
              Tugas Tambahan{" "}
              <Badge variant="secondary" className="ml-2">
                {counts.tugas_tambahan}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Filters */}
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
                    {dosenList.map((dosen) => (
                      <SelectItem key={dosen} value={dosen}>
                        {dosen}
                      </SelectItem>
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
                      {programStudiList.map((prodi) => (
                        <SelectItem key={prodi} value={prodi}>
                          {prodi}
                        </SelectItem>
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
                    {kategoriList.map((kategori) => (
                      <SelectItem key={kategori} value={kategori}>
                        {kategori}
                      </SelectItem>
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

            {/* Table */}
            <div className="border rounded-lg overflow-x-auto">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-2/5" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-20" />
                </colgroup>
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
                  {filteredActivities.length === 0 ? (
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
                    filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[220px]">
                              {activity.namaKegiatan}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(activity.tanggalMulai),
                                "dd MMM yyyy"
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(activity.tanggalSelesai),
                                "dd MMM yyyy"
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.pencatat}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              NIDN: {activity.nidn}
                            </p>
                          </div>
                        </TableCell>
                        {isKajur && (
                          <TableCell className="text-sm">
                            {activity.programStudi}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="space-y-1">
                            {getJenisBadge(activity.jenisTridharma)}
                            <p className="text-xs text-muted-foreground">
                              {activity.kategori}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.tahunAkademik}
                          <br />
                          <span className="text-xs text-muted-foreground capitalize">
                            Sem. {activity.semester}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.dosenTerlibat.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            {activity.dosenTerlibat.reduce(
                              (sum, d) => sum + d.jumlahDokumen,
                              0
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getKelengkapanBadge(activity.statusKelengkapan)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(activity.id)}
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Activity className="w-8 h-8" />
                  <p className="text-sm">Tidak ada kegiatan yang sesuai dengan filter</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {activity.pencatat?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{activity.namaKegiatan}</p>
                              {getJenisBadge(activity.jenisTridharma)}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 -mr-1 -mt-1"
                              onClick={() => handleViewDetail(activity.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{activity.pencatat}</span>
                            <span>·</span>
                            <span className="font-mono">NIDN: {activity.nidn}</span>
                          </div>
                          {isKajur && (
                            <p className="text-xs text-muted-foreground">
                              {activity.programStudi}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{activity.tahunAkademik}</span>
                            <span>·</span>
                            <span className="capitalize">Sem. {activity.semester}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {activity.dosenTerlibat.length}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {activity.dosenTerlibat.reduce((s, d) => s + d.jumlahDokumen, 0)}
                            </Badge>
                            {getKelengkapanBadge(activity.statusKelengkapan)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredActivities.length} kegiatan
            </div>
          </TabsContent>
        </Tabs>
       </div>
       </motion.div>
     </MainLayout>
  );
}
