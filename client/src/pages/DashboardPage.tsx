import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  FileText, Activity, FolderOpen, Bell, Users, Send,
  TrendingUp, BookOpen, AlertCircle, Plus, Eye, CheckCircle2,
  Clock, FileCheck, BarChart3, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [incompleteActivities, setIncompleteActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (user?.roles?.includes('dosen')) {
      fetchDosenDashboardData();
    }
  }, [user]);

  const fetchDosenDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, incompleteRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/stats/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/filter/tanpa-bukti`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const incompleteData = await incompleteRes.json();

      if (statsData.status === 'success') setStats(statsData.data);
      if (incompleteData.status === 'success') setIncompleteActivities(incompleteData.data);
    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  // Dashboard for Admin TU
  if (user?.roles?.includes('admin_tu')) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Dokumen Terdistribusi</CardDescription>
                <CardTitle className="text-3xl">127</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total distribusi bulan ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Menunggu Distribusi</CardDescription>
                <CardTitle className="text-3xl text-orange-500">8</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/document-distribution')}
                >
                  Lihat detail
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Draft</CardDescription>
                <CardTitle className="text-3xl">5</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Belum siap distribusi</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Notifikasi</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  Lihat semua
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribusi Terbaru</CardTitle>
              <CardDescription>Dokumen yang baru didistribusikan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Surat Edaran Semester Genap 2025/2026', recipients: 98, date: '2 jam lalu', status: 'distributed' },
                  { name: 'Panduan BKD Tahun 2026', recipients: 98, date: '5 jam lalu', status: 'distributed' },
                  { name: 'Template Laporan Penelitian', recipients: 45, date: '1 hari lalu', status: 'distributed' },
                  { name: 'Formulir Pengajuan Cuti', recipients: 98, date: '2 hari lalu', status: 'pending' },
                  { name: 'Kalender Akademik 2026', recipients: 98, date: '3 hari lalu', status: 'distributed' },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.recipients} penerima</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={doc.status === 'distributed' ? 'default' : 'secondary'}>
                        {doc.status === 'distributed' ? 'Terdistribusi' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{doc.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/document-distribution')}>
                Lihat Semua Distribusi
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button onClick={() => navigate('/document-distribution')} className="h-auto py-4 flex flex-col gap-2">
                  <Send className="w-5 h-5" />
                  <span>Distribusi Dokumen</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/document-distribution')} className="h-auto py-4 flex flex-col gap-2">
                  <FileText className="w-5 h-5" />
                  <span>Lihat Draft</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/notifications')} className="h-auto py-4 flex flex-col gap-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifikasi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Dashboard for Dosen (includes dosen+kaprodi, dosen+kajur)
  if (user?.roles?.includes('dosen')) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}</h2>
            <p className="text-muted-foreground">{user.programStudi}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Kegiatan Tridharma</CardDescription>
                <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Pengajaran</span>
                    <span className="font-medium">{stats?.pengajaran || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penelitian</span>
                    <span className="font-medium">{stats?.penelitian || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengabdian</span>
                    <span className="font-medium">{stats?.pengabdian || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Kegiatan Tanpa Bukti</CardDescription>
                <CardTitle className="text-3xl text-orange-500">{stats?.tanpa_bukti || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/activities')}
                >
                  Lihat detail
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Dokumen Bukti</CardDescription>
                <CardTitle className="text-3xl">{stats?.total_dokumen || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Terverifikasi integritas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Notifikasi Belum Dibaca</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  Lihat semua
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kegiatan Tanpa Bukti</CardTitle>
                  <CardDescription>Kegiatan yang belum dilampirkan dokumen bukti</CardDescription>
                </div>
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : incompleteActivities.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">Semua kegiatan sudah memiliki bukti. Luar biasa!</div>
                ) : (
                  incompleteActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">{activity.type} • {format(new Date(activity.date), "dd MMM yyyy", { locale: localeId })}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                        Tambah Bukti
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/activities')}>
                Lihat Semua Kegiatan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button onClick={() => navigate('/activities/new')} className="h-auto py-4 flex flex-col gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Tambah Kegiatan</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/documents')} className="h-auto py-4 flex flex-col gap-2">
                  <FileText className="w-5 h-5" />
                  <span>Unggah Dokumen</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/activities')} className="h-auto py-4 flex flex-col gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Lihat Portofolio</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/notifications')} className="h-auto py-4 flex flex-col gap-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifikasi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Dashboard for Kaprodi (who is not also dosen)
  if (user?.roles?.includes('kaprodi') && !user?.roles?.includes('dosen')) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}</h2>
            <p className="text-muted-foreground">{user.programStudi}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Dosen di Prodi</CardDescription>
                <CardTitle className="text-3xl">18</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{user.programStudi}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Kegiatan</CardDescription>
                <CardTitle className="text-3xl">156</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Semester aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Kelengkapan Portofolio</CardDescription>
                <CardTitle className="text-3xl text-green-500">91%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Rata-rata prodi</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Notifikasi</CardDescription>
                <CardTitle className="text-3xl">7</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  Lihat semua
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kegiatan Belum Lengkap</CardTitle>
              <CardDescription>Dosen dengan kegiatan tanpa bukti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Dr. Ahmad Fauzi', nidn: '0420059102', incomplete: 5, total: 24 },
                  { name: 'Dr. Siti Nurhaliza', nidn: '0415068901', incomplete: 3, total: 19 },
                  { name: 'Ir. Budi Santoso, M.T.', nidn: '0428077802', incomplete: 2, total: 16 },
                  { name: 'Dr. Eng. Rina Kartika', nidn: '0412069103', incomplete: 4, total: 21 },
                ].map((dosen, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{dosen.name}</p>
                        <p className="text-xs text-muted-foreground">NIDN: {dosen.nidn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{dosen.incomplete}/{dosen.total} belum lengkap</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/ami-recap')}>
                Lihat Rekap AMI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button onClick={() => navigate('/ami-recap')} className="h-auto py-4 flex flex-col gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Rekap AMI</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/notifications')} className="h-auto py-4 flex flex-col gap-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifikasi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Dashboard for Kajur (who is not also dosen)
  if (user?.roles?.includes('kajur') && !user?.roles?.includes('dosen')) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}</h2>
            <p className="text-muted-foreground">{user.programStudi}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Program Studi</CardDescription>
                <CardTitle className="text-3xl">3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Di bawah jurusan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Dosen</CardDescription>
                <CardTitle className="text-3xl">45</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Aktif semester ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Kegiatan</CardDescription>
                <CardTitle className="text-3xl">387</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Semester aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Notifikasi</CardDescription>
                <CardTitle className="text-3xl">15</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  Lihat semua
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Per Program Studi</CardTitle>
              <CardDescription>Status kegiatan di setiap prodi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'D4 Teknik Informatika', dosen: 18, kegiatan: 156, completeness: 91 },
                  { name: 'D4 Teknik Komputer', dosen: 15, kegiatan: 128, completeness: 87 },
                  { name: 'D3 Teknologi Informasi', dosen: 12, kegiatan: 103, completeness: 94 },
                ].map((prodi, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prodi.name}</p>
                        <p className="text-sm text-muted-foreground">{prodi.dosen} Dosen • {prodi.kegiatan} Kegiatan</p>
                      </div>
                      <Badge variant={prodi.completeness >= 90 ? 'default' : 'secondary'}>
                        {prodi.completeness}% Lengkap
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${prodi.completeness}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/ami-recap')}>
                Lihat Rekap AMI Detail
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button onClick={() => navigate('/ami-recap')} className="h-auto py-4 flex flex-col gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Rekap AMI</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/notifications')} className="h-auto py-4 flex flex-col gap-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifikasi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Dashboard for Administrator
  if (user?.roles?.includes('administrator')) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Akun Terdaftar</CardDescription>
                <CardTitle className="text-3xl">127</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Akun Aktif</CardDescription>
                <CardTitle className="text-3xl">115</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Akun Nonaktif</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Dosen</CardDescription>
                <CardTitle className="text-3xl">98</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/manage-accounts')} className="flex gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Akun Baru
                </Button>
                <Button variant="outline" onClick={() => navigate('/manage-accounts')}>
                  <Users className="w-4 h-4 mr-2" />
                  Lihat Semua Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Default dashboard
  return (
    <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{getGreeting()}, {user?.name}</h2>
          <p className="text-muted-foreground">{user?.programStudi}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Sistem Manajemen Portofolio Kinerja Dosen berbasis Blockchain
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </MainLayout>
  );
}
