import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { RippleButton } from '../components/ui/ripple-button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExportActivities } from '../components/activity/ExportActivities';
import {
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
import { Plus, Search, Eye, Share2, X, Copy, Check, Loader2, CheckCircle, XCircle, Clock, Activity, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { AnimatedTable, AnimatedTableRow } from '@/components/ui/animated-table';

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

const jenisBadgeStyles: Record<string, string> = {
  pendidikan: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  penelitian: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  pengabdian: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  tugas_tambahan: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
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
  const [shareMode, setShareMode] = useState<"detail" | "dokumen">("detail");
  const [copied, setCopied] = useState(false);

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
    setShareLink(`${window.location.origin}/public/kegiatan/${activity.id}`);
    setShareMode("detail");
    setCopied(false);
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.info(`Link: ${shareLink}`);
    }
  };

  const activeShareLink = shareLink;
  const uniqueYears = Array.from(new Set(activities.map(a => a.periode))).sort().reverse();
  const uniqueKategoris = Array.from(new Set(activities.map(a => a.kategori))).sort();

  const statsCards = [
    { label: 'Pendidikan', count: counts.pendidikan },
    { label: 'Penelitian', count: counts.penelitian },
    { label: 'Pengabdian', count: counts.pengabdian },
    { label: 'Tugas Tambahan', count: counts.tugas_tambahan },
  ];

  return (
    <MainLayout
      title="Kegiatan Tridharma"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Kegiatan Tridharma' },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Kegiatan Tridharma Saya"
          description="Kelola seluruh kegiatan Tridharma dan portofolio Anda"
        >
          <ExportActivities
            activityIds={filteredActivities.map((a) => a.id)}
            activityNames={filteredActivities.map((a) => a.name)}
          />
          <RippleButton onClick={() => navigate('/activities/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kegiatan
          </RippleButton>
        </PageHeader>

        <AnimatePresence>
          {pendingConfirmations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-warning/50 bg-warning/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-warning" />
                    Permintaan Konfirmasi Kegiatan
                  </CardTitle>
                  <CardDescription>
                    Anda memiliki {pendingConfirmations.length} undangan kegiatan yang menunggu konfirmasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingConfirmations.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                      <div>
                        <p className="font-medium">{item.namaKegiatan}</p>
                        <p className="text-sm text-muted-foreground">
                          Diundang oleh {item.pengundang}
                        </p>
                        <Badge variant="outline" className="mt-1 text-warning border-warning/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Menunggu Konfirmasi
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/activities/${item.kegiatanId}`, { state: { fromPendingConfirmation: true, partisipasiId: item.id } })}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Detail
                        </Button>
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
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.count}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">kegiatan</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

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
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama kegiatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="w-[160px] h-9">
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
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                  <X className="w-4 h-4 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>

            <motion.div layout className="border rounded-xl bg-card overflow-x-auto">
              {isLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} cols={9} />
                </div>
              ) : filteredActivities.length === 0 ? (
                <EmptyState
                  icon={<Activity className="w-10 h-10" />}
                  title="Tidak ada kegiatan"
                  description={
                    hasActiveFilters
                      ? "Tidak ada kegiatan yang sesuai filter"
                      : "Belum ada kegiatan Tridharma"
                  }
                  action={
                    hasActiveFilters ? (
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Reset Filter
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2 p-4">
                    {filteredActivities.map((activity) => (
                      <Card key={activity.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {activity.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{activity.name}</p>
                                  <Badge variant="outline" className={cn("text-xs mt-0.5", jenisBadgeStyles[activity.jenisTridharma])}>
                                    {jenisTridharmaLabels[activity.jenisTridharma]}
                                  </Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="min-w-[130px]">
                                    <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}`)}>
                                      <Eye className="w-3.5 h-3.5 mr-2" /> Lihat Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare(activity)}>
                                      <Share2 className="w-3.5 h-3.5 mr-2" /> Bagikan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(new Date(activity.tanggalMulai), "dd MMM yyyy", { locale: localeId })} {"→"} {format(new Date(activity.tanggalSelesai), "dd MMM yyyy", { locale: localeId })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant={activity.role === 'pencatat' ? 'default' : 'secondary'} className="text-xs">
                                  {activity.role === 'pencatat' ? 'Pencatat' : 'Anggota'}
                                </Badge>
                                <span className="text-muted-foreground">{activity.periode}</span>
                                <span className="text-muted-foreground">· {activity.anggotaCount || 0} anggota</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <AnimatedTable className="table-fixed">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[14%]" />
                    <col className="w-[130px]" />
                    <col className="w-[130px]" />
                    <col className="w-[110px]" />
                    <col className="w-[14%]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kegiatan</TableHead>
                      <TableHead>Jenis Tridharma</TableHead>
                      <TableHead>Tanggal Mulai</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Tahun Akademik</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead className="text-center">Anggota</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <AnimatedTableRow key={activity.id}>
                        <TableCell>
                          <button
                            onClick={() => navigate(`/activities/${activity.id}`)}
                            className="font-medium hover:underline text-left truncate max-w-[250px] block"
                          >
                            {activity.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={jenisBadgeStyles[activity.jenisTridharma]}>
                            {jenisTridharmaLabels[activity.jenisTridharma]}
                          </Badge>
                        </TableCell>
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
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {activity.anggotaCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/activities/${activity.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleShare(activity)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </AnimatedTableRow>
                    ))}
                  </TableBody>
                </AnimatedTable>
                </div>
              </>
              )}
            </motion.div>

            {!isLoading && filteredActivities.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground"
              >
                Menampilkan {filteredActivities.length} dari {counts[activeTab as keyof typeof counts]} kegiatan
              </motion.p>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={showShareDialog} onOpenChange={(open) => { if (!open) setShowShareDialog(false); }}>
        <DialogContent className="sm:max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Bagikan Kegiatan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex-1 p-3 border rounded-lg cursor-pointer transition-colors",
                    shareMode === "detail"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => { setShareMode("detail"); setCopied(false); setShareLink(`${window.location.origin}/public/kegiatan/${selectedActivity?.id}`); }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                      shareMode === "detail" ? "border-primary" : "border-muted-foreground"
                    )}>
                      {shareMode === "detail" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Detail Kegiatan</p>
                      <p className="text-xs text-muted-foreground">
                        Bagikan halaman detail kegiatan lengkap
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex-1 p-3 border rounded-lg cursor-pointer transition-colors",
                    shareMode === "dokumen"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => { setShareMode("dokumen"); setCopied(false); setShareLink(`${window.location.origin}/public/kegiatan/${selectedActivity?.id}/dokumen`); }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                      shareMode === "dokumen" ? "border-primary" : "border-muted-foreground"
                    )}>
                      {shareMode === "dokumen" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dokumen Saja</p>
                      <p className="text-xs text-muted-foreground">
                        Bagikan dokumen tanpa detail kegiatan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {shareMode === "detail" ? "Link detail kegiatan" : "Link dokumen"}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={activeShareLink}
                    readOnly
                    className="font-mono text-sm flex-1 min-w-0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-success" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" /> Salin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
