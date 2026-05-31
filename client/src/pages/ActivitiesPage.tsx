import { useState } from 'react';
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
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Plus, Search, Eye, Edit, Trash2, Share2, X, MoreVertical, Copy, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface Activity {
  id: string;
  name: string;
  jenisTridharma: 'pengajaran' | 'penelitian' | 'pengabdian' | 'tugas_tambahan';
  kategori: string;
  periode: string;
  semester: 'ganjil' | 'genap';
  tahunAkademik: string;
  role: 'pencatat' | 'anggota';
  buktiCount: number;
  updatedAt: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Mata Kuliah Pemrograman Web',
    jenisTridharma: 'pengajaran',
    kategori: 'Mengajar',
    periode: 'Ganjil 2025/2026',
    semester: 'ganjil',
    tahunAkademik: '2025/2026',
    role: 'pencatat',
    buktiCount: 3,
    updatedAt: '2026-05-16 10:30',
  },
  {
    id: '2',
    name: 'Penelitian Blockchain dalam Pendidikan',
    jenisTridharma: 'penelitian',
    kategori: 'Penelitian Mandiri',
    periode: 'Ganjil 2025/2026',
    semester: 'ganjil',
    tahunAkademik: '2025/2026',
    role: 'pencatat',
    buktiCount: 5,
    updatedAt: '2026-05-15 14:20',
  },
  {
    id: '3',
    name: 'Pengabdian Masyarakat Desa Cikoneng',
    jenisTridharma: 'pengabdian',
    kategori: 'Pengabdian Kepada Masyarakat',
    periode: 'Genap 2024/2025',
    semester: 'genap',
    tahunAkademik: '2024/2025',
    role: 'anggota',
    buktiCount: 2,
    updatedAt: '2026-05-10 09:15',
  },
  {
    id: '4',
    name: 'Koordinator Lab Komputer',
    jenisTridharma: 'tugas_tambahan',
    kategori: 'Koordinator Laboratorium',
    periode: 'Ganjil 2025/2026',
    semester: 'ganjil',
    tahunAkademik: '2025/2026',
    role: 'pencatat',
    buktiCount: 1,
    updatedAt: '2026-05-12 16:45',
  },
  {
    id: '5',
    name: 'Mata Kuliah Basis Data',
    jenisTridharma: 'pengajaran',
    kategori: 'Mengajar',
    periode: 'Ganjil 2025/2026',
    semester: 'ganjil',
    tahunAkademik: '2025/2026',
    role: 'pencatat',
    buktiCount: 4,
    updatedAt: '2026-05-08 11:20',
  },
];

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
  const [activities] = useState<Activity[]>(mockActivities);
  const [activeTab, setActiveTab] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterTahun, setFilterTahun] = useState('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesTab = activeTab === 'semua' || activity.jenisTridharma === activeTab;
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || activity.semester === filterSemester;
    const matchesTahun = filterTahun === 'all' || activity.tahunAkademik === filterTahun;
    // Kategori filter would be dynamic based on jenis tridharma in production
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
    // Generate share link (mock)
    const link = `${window.location.origin}/share/${activity.id}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link berhasil disalin!');
    } catch (err) {
      // Fallback for when clipboard API is blocked
      toast.info(`Link: ${shareLink}`);
    }
  };

  const handleDelete = (activity: Activity) => {
    // In production, show confirmation dialog
    toast.success(`Kegiatan "${activity.name}" berhasil dihapus.`);
  };

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
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kegiatan</TableHead>
                    <TableHead>Jenis Tridharma</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead className="text-center">Bukti</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <p>Tidak ada kegiatan yang sesuai dengan filter</p>
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
                        <TableCell className="text-sm">{activity.periode}</TableCell>
                        <TableCell>
                          <Badge variant={activity.role === 'pencatat' ? 'default' : 'secondary'}>
                            {activity.role === 'pencatat' ? 'Pencatat' : 'Anggota'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{activity.buktiCount}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {activity.updatedAt}
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
                              <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(activity)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Bagikan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(activity)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
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

            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredActivities.length} dari {counts[activeTab as keyof typeof counts]} kegiatan
            </div>
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
