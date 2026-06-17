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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Plus, Search, Eye, Share2, X, Copy, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Activity {
  id: string;
  name: string;
  jenisTridharma: 'pendidikan' | 'penelitian' | 'pengabdian' | 'tugas_tambahan';
  kategori: string;
  periode: string;
  semester: 'ganjil' | 'genap';
  role: 'pencatat' | 'anggota';
  anggotaCount: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  updatedAt: string;
}

interface PendingConfirmation {
  id: string;
  kegiatanId: string;
  namaKegiatan: string;
  pengundang: string;
  status: string;
}

const jenisTridharmaLabels: Record<string, string> = {
  pendidikan: 'Pendidikan',
  penelitian: 'Penelitian',
  pengabdian: 'Pengabdian',
  tugas_tambahan: 'Tugas Tambahan',
};

const jenisBadgeColors: Record<string, string> = {
  pendidikan: 'bg-blue-500',
  penelitian: 'bg-green-500',
  pengabdian: 'bg-purple-500',
  tugas_tambahan: 'bg-orange-500',
};

export function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterTahun, setFilterTahun] = useState('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchActivities();
    fetchPendingConfirmations();
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
      } else {
        toast.error(result.error || 'Gagal mengambil data kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingConfirmations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/permintaan-konfirmasi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setPendingConfirmations(result.data);
        }
      }
    } catch (error) {
      // Backend belum menyediakan endpoint ini - catat sebagai Backend Requirement
      console.log('Endpoint permintaan-konfirmasi belum tersedia');
    }
  };

  const handleTerima = async (partisipasiId: string, kegiatanId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${kegiatanId}/partisipasi/${partisipasiId}/terima`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Undangan kegiatan diterima');
        setPendingConfirmations(prev => prev.filter(p => p.id !== partisipasiId));
        fetchActivities();
      } else {
        toast.error(result.error || 'Gagal menerima undangan');
      }
    } catch (error) {
      toast.error('Endpoint belum tersedia - lihat Backend Requirement');
    }
  };

  const handleTolak = async (partisipasiId: string, kegiatanId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${kegiatanId}/partisipasi/${partisipasiId}/tolak`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Undangan kegiatan ditolak');
        setPendingConfirmations(prev => prev.filter(p => p.id !== partisipasiId));
        setActivities(prev => prev.filter(a => a.id !== kegiatanId));
      } else {
        toast.error(result.error || 'Gagal menolak undangan');
      }
    } catch (error) {
      toast.error('Endpoint belum tersedia - lihat Backend Requirement');
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesTab = activeTab === 'semua' || activity.jenisTridharma === activeTab;
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || activity.semester === filterSemester;
    const matchesTahun = filterTahun === 'all' || activity.periode === filterTahun;
    const matchesKategori = filterKategori === 'all' || activity.kategori === filterKategori;

    return matchesTab && matchesSearch && matchesSemester && matchesTahun && matchesKategori;
  });

  const counts = {
    semua: activities.length,
    pendidikan: activities.filter(a => a.jenisTridharma === 'pendidikan').length,
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

  const handleShare = (activity: Activity) => {
    setSelectedActivity(activity);
    const link = `${window.location.origin}/activities/${activity.id}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link berhasil disalin!');
    } catch (err) {
      toast.info(`Link: ${shareLink}`);
    }
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

        {pendingConfirmations.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Permintaan Konfirmasi Kegiatan
              </CardTitle>
              <CardDescription>
                Anda memiliki {pendingConfirmations.length} undangan kegiatan yang menunggu konfirmasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingConfirmations.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div>
                    <p className="font-medium">{item.namaKegiatan}</p>
                    <p className="text-sm text-muted-foreground">
                      Diundang oleh {item.pengundang}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Menunggu Konfirmasi
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleTerima(item.id, item.kegiatanId)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Terima
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleTolak(item.id, item.kegiatanId)}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendidikan</CardDescription>
              <CardTitle className="text-3xl">{counts.pendidikan}</CardTitle>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="semua">
              Semua <Badge variant="secondary" className="ml-2">{counts.semua}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pendidikan">
              Pendidikan <Badge variant="secondary" className="ml-2">{counts.pendidikan}</Badge>
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
                    <TableHead className="text-center">Anggota</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
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
                    filteredActivities.map((activity) => (
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
                          {format(new Date(activity.tanggalMulai), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(activity.tanggalSelesai), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-sm">{activity.periode}</TableCell>
                        <TableCell>
                          <Badge variant={activity.role === 'pencatat' ? 'default' : 'secondary'}>
                            {activity.role === 'pencatat' ? 'Pencatat' : 'Anggota'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {activity.anggotaCount || 0} Anggota
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/activities/${activity.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(activity)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && (
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredActivities.length} dari {counts[activeTab as keyof typeof counts]} kegiatan
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bagikan Kegiatan Ini</DialogTitle>
            <DialogDescription>
              Link ini akan menampilkan detail kegiatan <strong>{selectedActivity?.name}</strong> beserta dokumen buktinya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="font-mono text-sm" />
              <Button onClick={copyShareLink} size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
