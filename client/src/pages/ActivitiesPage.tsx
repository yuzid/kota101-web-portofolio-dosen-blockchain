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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Plus, Search, Eye, Edit, Trash2, Share2, X, MoreVertical, Copy, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

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
}

const jenisTridharmaLabels: Record<string, string> = {
  pengajaran: 'Pengajaran',
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
  const [activities, setActivities] = useState<Activity[]>([]);
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

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesTab = activeTab === 'semua' || activity.jenisTridharma === activeTab;
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || activity.semester === filterSemester;
    const matchesTahun = filterTahun === 'all' || activity.periode === filterTahun;
    const matchesKategori = filterKategori === 'all' || activity.kategori === filterKategori;

    return matchesTab && matchesSearch && matchesSemester && matchesTahun && matchesKategori;
  });

  // Count by jenis
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

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${activity.name}"?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${activity.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Kegiatan "${activity.name}" berhasil dihapus.`);
        fetchActivities();
      } else {
        toast.error(result.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus kegiatan');
    }
  };

  // Unique years and categories for filters
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pengajaran</CardDescription>
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
              Pengajaran <Badge variant="secondary" className="ml-2">{counts.pengajaran}</Badge>
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
                    <TableHead>Periode</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead className="text-center">Bukti</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Memuat kegiatan...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
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
                          {activity.semester === 'ganjil' ? 'Ganjil' : 'Genap'} {activity.periode}
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.role === 'pencatat' ? 'default' : 'secondary'}>
                            {activity.role === 'pencatat' ? 'Pencatat' : 'Anggota'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{activity.buktiCount}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              {activity.role === 'pencatat' && (
                                <>
                                  <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(activity)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleShare(activity)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Bagikan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Share Dialog */}
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

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/portfolio/share-links')}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Kelola Semua Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
