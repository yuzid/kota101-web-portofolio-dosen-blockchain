import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExportActivities } from '../components/activity/ExportActivities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Eye,
  Share2,
  X,
  Loader2,
  MailOpen,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  getKonfirmasiByDosen,
  getKonfirmasiByKegiatan,
  updateKonfirmasi,
  type KonfirmasiKegiatan,
} from '../lib/kegiatanKonfirmasi';

interface Activity {
  id: string;
  name: string;
  jenisTridharma: 'pengajaran' | 'penelitian' | 'pengabdian' | 'tugas_tambahan';
  kategori: string;
  periode: string;
  semester: 'ganjil' | 'genap';
  role: 'pencatat' | 'anggota';
  buktiCount: number;
  updatedAt: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

const jenisTridharmaLabels: Record<string, string> = {
  pengajaran: 'Pendidikan',
  penelitian: 'Penelitian',
  pengabdian: 'Pengabdian',
  tugas_tambahan: 'Tugas Tambahan',
};

const jenisBadgeColors: Record<string, string> = {
  pengajaran: 'bg-blue-500',
  penelitian: 'bg-green-500',
  pengabdian: 'bg-purple-500',
  tugas_tambahan: 'bg-orange-500',
};

export function ActivitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [undangan, setUndangan] = useState<KonfirmasiKegiatan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterTahun, setFilterTahun] = useState('all');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setActivities(result.data);
        if (user?.uuid && Array.isArray(result.data)) {
          const allExisting = JSON.parse(localStorage.getItem('kegiatan_konfirmasi') || '[]');
          let changed = false;
          result.data.forEach((act: Activity) => {
            if (
              act.role === 'anggota' &&
              !allExisting.find((k: any) => k.kegiatanId === act.id && k.dosenId === user.uuid)
            ) {
              allExisting.push({
                kegiatanId: act.id,
                dosenId: user.uuid,
                pencatatId: '',
                pencatatNama: 'Pembuat Kegiatan',
                namaKegiatan: act.name,
                status: 'menunggu',
                createdAt: new Date().toISOString(),
              });
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem('kegiatan_konfirmasi', JSON.stringify(allExisting));
          }
        }
      } else {
        toast.error(result.error || 'Gagal mengambil data kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi ke server');
    } finally {
      loadUndangan();
      setIsLoading(false);
    }
  };

  const loadUndangan = () => {
    if (user?.uuid) {
      const all = getKonfirmasiByDosen(user.uuid);
      setUndangan(all.filter((k) => k.status === 'menunggu'));
    }
  };

  // Filter undangan dari activities utama — kegiatan yang menunggu tidak muncul di list
  const undanganKegiatanIds = new Set(undangan.map((u) => u.kegiatanId));

  const filteredActivities = activities.filter(activity => {
    const matchesTab = activeTab === 'semua' || activity.jenisTridharma === activeTab;
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || activity.semester === filterSemester;
    const matchesTahun = filterTahun === 'all' || activity.periode === filterTahun;
    const matchesKategori = filterKategori === 'all' || activity.kategori === filterKategori;
    const notUndangan = !undanganKegiatanIds.has(activity.id);

    return matchesTab && matchesSearch && matchesSemester && matchesTahun && matchesKategori && notUndangan;
  });

  const counts = {
    semua: activities.length,
    pengajaran: activities.filter(a => a.jenisTridharma === 'pengajaran').length,
    penelitian: activities.filter(a => a.jenisTridharma === 'penelitian').length,
    pengabdian: activities.filter(a => a.jenisTridharma === 'pengabdian').length,
    tugas_tambahan: activities.filter(a => a.jenisTridharma === 'tugas_tambahan').length,
  };

  const hasActiveFilters = searchTerm !== '' || filterKategori !== 'all' || filterSemester !== 'all' || filterTahun !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterKategori('all');
    setFilterSemester('all');
    setFilterTahun('all');
  };

  const handleTerima = (item: KonfirmasiKegiatan) => {
    if (!user?.uuid) return;
    updateKonfirmasi(item.kegiatanId, user.uuid, 'diterima');
    toast.success(`Anda menerima undangan kegiatan "${item.namaKegiatan}".`);
    addNotification({
      type: 'approval',
      title: 'Undangan Kegiatan Diterima',
      description: `Anda menerima undangan kegiatan "${item.namaKegiatan}".`,
      actor: user.name,
      priority: 'medium',
      category: 'Kegiatan',
    });
    loadUndangan();
    fetchActivities();
  };

  const handleTolak = (item: KonfirmasiKegiatan) => {
    if (!user?.uuid) return;
    updateKonfirmasi(item.kegiatanId, user.uuid, 'ditolak');
    toast.info(`Anda menolak undangan kegiatan "${item.namaKegiatan}".`);
    addNotification({
      type: 'approval',
      title: 'Undangan Kegiatan Ditolak',
      description: `Anda menolak undangan kegiatan "${item.namaKegiatan}".`,
      actor: user.name,
      priority: 'low',
      category: 'Kegiatan',
    });
    loadUndangan();
  };

  const uniqueYears = Array.from(new Set(activities.map(a => a.periode))).sort().reverse();
  const uniqueKategoris = Array.from(new Set(activities.map(a => a.kategori))).sort();

  return (
    <MainLayout
      title="Kegiatan Tridharma"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Kegiatan Tridharma' },
      ]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Kegiatan Tridharma Saya</h2>
            <p className="text-sm text-muted-foreground">
              Kelola seluruh kegiatan Tridharma dan portofolio Anda
            </p>
          </div>
          <div className="flex gap-2">
            <ExportActivities
              activityIds={filteredActivities.map((a) => a.id)}
              activityNames={filteredActivities.map((a) => a.name)}
            />
            <Button onClick={() => navigate('/activities/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kegiatan Baru
            </Button>
          </div>
        </div>

        {/* Permintaan Konfirmasi Kegiatan Section */}
        {undangan.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MailOpen className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">Permintaan Konfirmasi Kegiatan</CardTitle>
                <Badge variant="secondary" className="ml-2">{undangan.length}</Badge>
              </div>
              <CardDescription>
                Anda diundang sebagai anggota pada kegiatan berikut. Silakan konfirmasi keterlibatan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {undangan.map((item) => {
                const relatedActivity = activities.find((a) => a.id === item.kegiatanId);
                return (
                  <div
                    key={item.kegiatanId}
                    className="flex items-start justify-between p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.namaKegiatan}</p>
                        {relatedActivity && (
                          <Badge className={jenisBadgeColors[relatedActivity.jenisTridharma]}>
                            {jenisTridharmaLabels[relatedActivity.jenisTridharma]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Oleh: {item.pencatatNama}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleTerima(item)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Terima
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                        onClick={() => handleTolak(item)}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Tolak
                      </Button>
                      {relatedActivity && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/activities/${item.kegiatanId}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Ditolak notification */}
        {getKonfirmasiByDosen(user?.uuid || '').filter((k) => k.status === 'ditolak').length > 0 && (
          <div className="text-sm text-muted-foreground">
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground h-auto p-0"
              onClick={() => {
                const ditolak = getKonfirmasiByDosen(user?.uuid || '').filter((k) => k.status === 'ditolak');
                toast.info(
                  `Kegiatan yang ditolak: ${ditolak.map((d) => d.namaKegiatan).join(', ')}`,
                  { duration: 5000 }
                );
              }}
            >
              {getKonfirmasiByDosen(user?.uuid || '').filter((k) => k.status === 'ditolak').length} kegiatan ditolak
            </Button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendidikan</CardDescription>
              <CardTitle className="text-3xl">{counts.pengajaran}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">kegiatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Penelitian</CardDescription>
              <CardTitle className="text-3xl">{counts.penelitian}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">kegiatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pengabdian</CardDescription>
              <CardTitle className="text-3xl">{counts.pengabdian}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">kegiatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tugas Tambahan</CardDescription>
              <CardTitle className="text-3xl">{counts.tugas_tambahan}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">kegiatan</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="semua">
              Semua <Badge variant="secondary" className="ml-2">{counts.semua}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pengajaran">
              Pendidikan <Badge variant="secondary" className="ml-2">{counts.pengajaran}</Badge>
            </TabsTrigger>
            <TabsTrigger value="penelitian">
              Penelitian <Badge variant="secondary" className="ml-2">{counts.penelitian}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pengabdian">
              Pengabdian <Badge variant="secondary" className="ml-2">{counts.pengabdian}</Badge>
            </TabsTrigger>
            <TabsTrigger value="tugas_tambahan">
              Tugas Tambahan <Badge variant="secondary" className="ml-2">{counts.tugas_tambahan}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama kegiatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tahun Akademik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kegiatan</TableHead>
                    <TableHead>Jenis Tridharma</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableHead>Tahun Akademik</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead className="text-center">Jumlah Anggota</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Memuat kegiatan...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <p>Tidak ada kegiatan yang ditemukan</p>
                          {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                              Reset Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.map((activity) => {
                      const konfStatus = getKonfirmasiByDosen(user?.uuid || '').find(
                        (k) => k.kegiatanId === activity.id
                      );
                      const anggotaKonf = getKonfirmasiByKegiatan(activity.id);
                      const menungguCount = anggotaKonf.filter((k) => k.status === 'menunggu').length;
                      const diterimaCount = anggotaKonf.filter((k) => k.status === 'diterima').length;
                      const ditolakCount = anggotaKonf.filter((k) => k.status === 'ditolak').length;
                      const totalAnggota = anggotaKonf.length > 0
                        ? anggotaKonf.filter((k) => k.status !== 'ditolak').length + (activity.role === 'pencatat' ? 1 : 0)
                        : '-';
                      return (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/activities/${activity.id}`)}
                              className="font-medium hover:underline text-left"
                            >
                              {activity.name}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge className={jenisBadgeColors[activity.jenisTridharma]}>
                              {jenisTridharmaLabels[activity.jenisTridharma]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{activity.kategori}</TableCell>
                          <TableCell className="text-sm">
                            {activity.tanggalMulai
                              ? new Date(activity.tanggalMulai).toLocaleDateString('id-ID')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {activity.tanggalSelesai
                              ? new Date(activity.tanggalSelesai).toLocaleDateString('id-ID')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{activity.periode}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={activity.role === 'pencatat' ? 'default' : 'secondary'}>
                                {activity.role === 'pencatat' ? 'Pembuat' : 'Anggota'}
                              </Badge>
                              {activity.role === 'pencatat' && anggotaKonf.length > 0 && (
                                <div className="flex gap-1">
                                  {menungguCount > 0 && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs px-1.5 py-0 h-5">
                                      {menungguCount} menunggu
                                    </Badge>
                                  )}
                                  {diterimaCount > 0 && (
                                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 text-xs px-1.5 py-0 h-5">
                                      {diterimaCount} diterima
                                    </Badge>
                                  )}
                                  {ditolakCount > 0 && (
                                    <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20 text-xs px-1.5 py-0 h-5">
                                      {ditolakCount} ditolak
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {konfStatus && konfStatus.status === 'diterima' && activity.role === 'anggota' && (
                                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Dikonfirmasi
                                </Badge>
                              )}
                              {konfStatus && konfStatus.status === 'ditolak' && (
                                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                                  <UserX className="w-3 h-3 mr-1" />
                                  Ditolak
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {totalAnggota}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/activities/${activity.id}`)}
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const link = `${window.location.origin}/activities/${activity.id}`;
                                  navigator.clipboard.writeText(link).then(() => toast.success('Link disalin'));
                                }}
                                title="Salin Link"
                              >
                                <Share2 className="w-4 h-4" />
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

            {!isLoading && (
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredActivities.length} dari {counts[activeTab as keyof typeof counts]} kegiatan
                {undangan.length > 0 && (
                  <span className="ml-2 text-amber-600">
                    (+{undangan.length} undangan menunggu)
                  </span>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
