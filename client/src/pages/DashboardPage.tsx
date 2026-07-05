import { useState, useEffect } from 'react';
import { motion } from "motion/react";
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { StatCard } from '../components/ui/stat-card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { RippleButton } from '../components/ui/ripple-button';
import {
  FileText, Activity, FolderOpen, Users, Send,
  BookOpen, AlertCircle, Plus, Eye, Clock,
  BarChart3, Building2, Briefcase, Target, TrendingUp,
  UserCheck, GraduationCap, FileCheck, Landmark,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { getGreeting } from '../constants/text';
import { staggerContainerVariants, staggerItemVariants } from '../hooks/useStaggerFade';
import {
  DonutChartCard,
  LineChartCard,
  HorizontalBarCard,
  VerticalBarCard,
} from '../components/dashboard/DashboardCharts';

type DashboardRole = 'dosen' | 'kaprodi' | 'kajur' | 'staf_tu' | 'admin';

const dateNow = () => new Date().toLocaleDateString('id-ID', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRoles: DashboardRole[] = (user?.roles || []).filter(
    (r): r is DashboardRole => ['dosen', 'kaprodi', 'kajur', 'staf_tu', 'admin'].includes(r)
  );
  const hasMultipleRoles = userRoles.filter(r => ['dosen', 'kaprodi', 'kajur'].includes(r)).length > 1;
  const storedRole = localStorage.getItem('dashboard_role') as DashboardRole | null;
  const defaultRole = storedRole && userRoles.includes(storedRole) ? storedRole : userRoles[0] || 'dosen';
  const [activeRole, setActiveRole] = useState<DashboardRole>(defaultRole);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('dashboard_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const endpoint = activeRole === 'staf_tu' ? '/api/dashboard/staf-tu'
      : activeRole === 'dosen' ? '/api/dashboard/dosen'
      : activeRole === 'kaprodi' ? '/api/dashboard/kaprodi'
      : activeRole === 'kajur' ? '/api/dashboard/kajur'
      : activeRole === 'admin' ? '/api/dashboard/admin'
      : null;

    if (!endpoint) {
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(result => {
        if (!cancelled) {
          if (result.status === 'success') setData(result.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeRole]);

  const isDosen = activeRole === 'dosen';
  const isKaprodi = activeRole === 'kaprodi';
  const isKajur = activeRole === 'kajur';
  const isStafTu = activeRole === 'staf_tu';
  const isAdmin = activeRole === 'admin';

  function renderGreeting() {
    return (
      <motion.div variants={staggerItemVariants} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{getGreeting()}, {user?.name}</h2>
          {user?.programStudi && (
            <p className="text-sm text-muted-foreground">{user.programStudi}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{dateNow()}</p>
        </div>
        {renderRoleSwitcher()}
      </motion.div>
    );
  }

  function renderRoleSwitcher() {
    const roleLabels: Record<string, string> = {
      dosen: 'Pribadi',
      kaprodi: 'Prodi',
      kajur: 'Jurusan',
      staf_tu: 'Tata Usaha',
      admin: 'Admin',
    };

    if (!hasMultipleRoles && userRoles.length <= 1) return null;

    return (
      <Select value={activeRole} onValueChange={(v: DashboardRole) => setActiveRole(v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {userRoles.map(role => (
            <SelectItem key={role} value={role}>{roleLabels[role] || role}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (loading) {
    return (
      <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={staggerItemVariants} className="space-y-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        </motion.div>
      </MainLayout>
    );
  }

  function renderStafTuDashboard() {
    const m = { distributed: 0, pending: 0, draft: 0, dosenPenerima: 0, monthlyTrend: [], recentDocs: [], ...(data || {}) };
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Send className="w-5 h-5" />} value={m.distributed} label="Terdistribusi" color="primary" />
          <StatCard icon={<Clock className="w-5 h-5" />} value={m.pending} label="Menunggu" color="amber" />
          <StatCard icon={<FileText className="w-5 h-5" />} value={m.draft} label="Draft Tersimpan" color="purple" />
          <StatCard icon={<Users className="w-5 h-5" />} value={m.dosenPenerima} label="Dosen Penerima" color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {m.monthlyTrend.length > 0 && (
            <LineChartCard
              title="Tren Distribusi"
              description="Jumlah dokumen terdistribusi per bulan (6 bulan)"
              data={m.monthlyTrend}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Terbaru</CardTitle>
              <CardDescription>Dokumen yang baru didistribusikan</CardDescription>
            </CardHeader>
            <CardContent>
              {(m.recentDocs?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada distribusi</p>
              ) : (
                <div className="space-y-3">
                  {m.recentDocs.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[280px]">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.recipients}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.status === 'Terdistribusi' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{doc.status}</span>
                        <span className="text-xs text-muted-foreground">{doc.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <RippleButton variant="outline" className="w-full mt-4" onClick={() => navigate('/document-distribution')}>
                Lihat Semua Distribusi
              </RippleButton>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RippleButton onClick={() => navigate('/document-distribution')} className="h-auto py-4 flex flex-col gap-2">
                <Send className="w-5 h-5" />
                <span>Distribusikan Dokumen</span>
              </RippleButton>
              <RippleButton variant="outline" onClick={() => navigate('/document-distribution')} className="h-auto py-4 flex flex-col gap-2">
                <FileText className="w-5 h-5" />
                <span>Lihat Draft</span>
              </RippleButton>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function renderDosenDashboard() {
    const m = { totalKegiatan: 0, pengajaran: 0, penelitian: 0, pengabdian: 0, tugasTambahan: 0, tanpaBukti: 0, totalDokumen: 0, perluKonfirmasi: 0, incomplete: [], ...(data || {}) };

    const kategoriData = [
      { name: 'Pendidikan', value: m.pengajaran },
      { name: 'Penelitian', value: m.penelitian },
      { name: 'Pengabdian', value: m.pengabdian },
      { name: 'Tugas Tambahan', value: m.tugasTambahan },
    ].filter(d => d.value > 0);

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Activity className="w-5 h-5" />} value={m.totalKegiatan} label="Kegiatan Tridharma" color="primary" />
          <StatCard icon={<AlertCircle className="w-5 h-5" />} value={m.tanpaBukti} label="Belum Ada Bukti" color="rose" />
          <StatCard icon={<FolderOpen className="w-5 h-5" />} value={m.totalDokumen} label="Dokumen Saya" color="blue" />
          <StatCard icon={<Clock className="w-5 h-5" />} value={m.perluKonfirmasi} label="Perlu Konfirmasi" color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {kategoriData.length > 0 && (
            <DonutChartCard
              title="Komposisi Kegiatan"
              description="Berdasarkan kategori tridharma"
              data={kategoriData}
            />
          )}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perlu Tindakan</CardTitle>
                  <CardDescription>Kegiatan yang membutuhkan perhatian</CardDescription>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
            {(m.incomplete?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Semua kegiatan sudah lengkap</p>
            ) : (
              <div className="space-y-3">
                {m.incomplete.map((act: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-950/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[280px]">{act.name}</p>
                        <p className="text-xs text-muted-foreground">{act.type} &bull; {act.date}</p>
                      </div>
                    </div>
                    <RippleButton variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => navigate('/activities')}>
                      Lengkapi
                    </RippleButton>
                  </div>
                ))}
              </div>
            )}
            <RippleButton variant="outline" className="w-full mt-4" onClick={() => navigate('/activities')}>
              Lihat Semua Kegiatan
            </RippleButton>
          </CardContent>
        </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RippleButton onClick={() => navigate('/activities/new')} className="h-auto py-4 flex flex-col gap-2">
                <Plus className="w-5 h-5" />
                <span>Tambah Kegiatan</span>
              </RippleButton>
              <RippleButton variant="outline" onClick={() => navigate('/activities')} className="h-auto py-4 flex flex-col gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Lengkapi Bukti</span>
              </RippleButton>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function renderKaprodiDashboard() {
    const m = { totalDosen: 0, totalKegiatan: 0, belumLengkap: 0, rekapDibuat: 0, incompleteDosen: [], topDosen: [], ...(data || {}) };
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} value={m.totalDosen} label="Dosen di Prodi" color="primary" />
          <StatCard icon={<Activity className="w-5 h-5" />} value={m.totalKegiatan} label="Kegiatan Prodi" color="blue" />
          <StatCard icon={<AlertCircle className="w-5 h-5" />} value={m.belumLengkap} label="Belum Lengkap" color="rose" />
          <StatCard icon={<FileText className="w-5 h-5" />} value={m.rekapDibuat} label="Rekap Dibuat" color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {m.topDosen.length > 0 && (
            <HorizontalBarCard
              title="Top 5 Dosen"
              description="Berdasarkan jumlah kegiatan tridharma"
              data={m.topDosen}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Perlu Tindak Lanjut</CardTitle>
              <CardDescription>Dosen dengan kegiatan belum lengkap</CardDescription>
            </CardHeader>
            <CardContent>
              {(m.incompleteDosen?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Semua dosen sudah lengkap</p>
              ) : (
                <div className="space-y-3">
                  {m.incompleteDosen.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-950/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-medium text-red-600 dark:text-red-400 shrink-0">
                          {d.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[200px]">{d.name}</p>
                          <p className="text-xs text-muted-foreground">NIDN: {d.nidn}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 shrink-0 ml-2">
                        {d.incomplete}/{d.total} kurang
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RippleButton onClick={() => navigate('/monitoring/prodi')} className="h-auto py-4 flex flex-col gap-2">
                <FileText className="w-5 h-5" />
                <span>Buat Rekap Laporan</span>
              </RippleButton>
              <RippleButton variant="outline" onClick={() => navigate('/monitoring/prodi')} className="h-auto py-4 flex flex-col gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Monitoring Kegiatan</span>
              </RippleButton>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function renderKajurDashboard() {
    const m = { totalProdi: 0, totalDosen: 0, totalKegiatan: 0, rekapJurusan: 0, ringkasanProdi: [], ...(data || {}) };
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="w-5 h-5" />} value={m.totalProdi} label="Program Studi" color="primary" />
          <StatCard icon={<Users className="w-5 h-5" />} value={m.totalDosen} label="Total Dosen" color="blue" />
          <StatCard icon={<Activity className="w-5 h-5" />} value={m.totalKegiatan} label="Kegiatan Jurusan" color="amber" />
          <StatCard icon={<FileText className="w-5 h-5" />} value={m.rekapJurusan} label="Rekap Jurusan" color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {m.ringkasanProdi.length > 0 && (
            <VerticalBarCard
              title="Perbandingan Program Studi"
              description="Jumlah dosen dan kegiatan per prodi"
              data={m.ringkasanProdi}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Per Prodi</CardTitle>
              <CardDescription>Status kegiatan di setiap program studi</CardDescription>
            </CardHeader>
            <CardContent>
              {(m.ringkasanProdi?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada data prodi</p>
              ) : (
                <div className="space-y-4">
                  {m.ringkasanProdi.map((prodi: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[240px]">{prodi.name}</p>
                          <p className="text-sm text-muted-foreground">{prodi.dosen} Dosen &bull; {prodi.kegiatan} Kegiatan</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${prodi.completeness >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                          {prodi.completeness}% Lengkap
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${prodi.completeness}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RippleButton onClick={() => navigate('/monitoring/jurusan')} className="h-auto py-4 flex flex-col gap-2">
                <FileText className="w-5 h-5" />
                <span>Buat Rekap Jurusan</span>
              </RippleButton>
              <RippleButton variant="outline" onClick={() => navigate('/monitoring/jurusan')} className="h-auto py-4 flex flex-col gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Monitoring Jurusan</span>
              </RippleButton>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function renderAdminDashboard() {
    const m = { totalUsers: 0, dosenAktif: 0, stafTuCount: 0, jurusanProdi: '0 / 0', rolesData: [], recentLogs: [], ...(data || {}) };
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} value={m.totalUsers} label="Total Pengguna" color="primary" />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} value={m.dosenAktif} label="Dosen Aktif" color="blue" />
          <StatCard icon={<Send className="w-5 h-5" />} value={m.stafTuCount} label="Staf TU" color="amber" />
          <StatCard icon={<Building2 className="w-5 h-5" />} value={m.jurusanProdi} label="Jurusan / Prodi" color="emerald" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {m.rolesData.length > 0 && (
            <DonutChartCard
              title="Komposisi Role"
              description="Distribusi pengguna berdasarkan role"
              data={m.rolesData}
            />
          )}
          <Card className="md:row-span-1">
            <CardHeader>
              <CardTitle>Akun</CardTitle>
              <CardDescription>Akun yang baru dibuat</CardDescription>
            </CardHeader>
            <CardContent>
              {m.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada pengguna</p>
              ) : (
                <div className="space-y-2">
                  {m.recentLogs.map((user: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role} &bull; {user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <RippleButton variant="outline" className="w-full mt-4" onClick={() => navigate('/manage-accounts')}>
                Kelola Akun
              </RippleButton>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Data Akademik
                </div>
              </CardTitle>
              <CardDescription>Jurusan dan program studi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <RippleButton onClick={() => navigate('/admin/akademik/jurusan')} variant="outline" className="w-full justify-start">
                <Landmark className="w-4 h-4 mr-2" />
                Kelola Jurusan
              </RippleButton>
              <RippleButton onClick={() => navigate('/admin/akademik/prodi')} variant="outline" className="w-full justify-start">
                <GraduationCap className="w-4 h-4 mr-2" />
                Kelola Program Studi
              </RippleButton>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Jabatan
                </div>
              </CardTitle>
              <CardDescription>Ketua Jurusan dan Ketua Prodi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <RippleButton onClick={() => navigate('/admin/jabatan/kajur')} variant="outline" className="w-full justify-start">
                <UserCheck className="w-4 h-4 mr-2" />
                Kelola Ketua Jurusan
              </RippleButton>
              <RippleButton onClick={() => navigate('/admin/jabatan/kaprodi')} variant="outline" className="w-full justify-start">
                <UserCheck className="w-4 h-4 mr-2" />
                Kelola Ketua Prodi
              </RippleButton>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  function renderDashboardContent() {
    if (isAdmin) return renderAdminDashboard();
    if (isStafTu) return renderStafTuDashboard();
    if (isDosen) return renderDosenDashboard();
    if (isKaprodi) return renderKaprodiDashboard();
    if (isKajur) return renderKajurDashboard();

    const firstRole = userRoles[0];
    if (firstRole === 'dosen') return renderDosenDashboard();
    if (firstRole === 'kaprodi') return renderKaprodiDashboard();
    if (firstRole === 'kajur') return renderKajurDashboard();
    if (firstRole === 'staf_tu') return renderStafTuDashboard();
    if (firstRole === 'admin') return renderAdminDashboard();
    return null;
  }

  return (
    <MainLayout title="Beranda" breadcrumbs={[{ label: 'Beranda' }]}>
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {renderGreeting()}
        {renderDashboardContent()}
      </motion.div>
    </MainLayout>
  );
}
