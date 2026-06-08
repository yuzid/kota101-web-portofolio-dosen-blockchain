import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Plus, Search, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Dosen {
  id: string;
  nama: string;
  nip: string;
  nidn: string;
  program_studi_id?: string;
  jurusan_id?: string;
}

interface Jurusan {
  id: string;
  kode_jurusan: string;
  nama_jurusan: string;
}

interface Kajur {
  id: string;
  dosen_id: string;
  jurusan_id: string;
  periode_mulai: string;
  periode_selesai: string;
  dosen?: { nama: string; nip: string; nidn: string };
  jurusan?: { id: string; kode_jurusan: string; nama_jurusan: string };
}

function isActive(periodeMulai: string, periodeSelesai: string): boolean {
  const now = new Date();
  const start = new Date(periodeMulai);
  const end = new Date(periodeSelesai);
  return now >= start && now <= end;
}

export function JabatanKajurPage() {
  const [items, setItems] = useState<Kajur[]>([]);
  const [dosens, setDosens] = useState<Dosen[]>([]);
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('all');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Kajur | null>(null);

  const [formData, setFormData] = useState({
    dosen_id: '',
    jurusan_id: '',
    periode_mulai: '',
    periode_selesai: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/jabatan/kajur`;
  const usersUrl = `${import.meta.env.VITE_API_URL}/api/admin/users`;
  const jurusanUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => {
    Promise.all([fetchKajur(), fetchDosens(), fetchJurusans()]);
  }, []);

  const fetchKajur = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === 'success') setItems(result.data);
      else toast.error(result.error || 'Gagal memuat data Kajur');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDosens = async () => {
    try {
      const [dosenRes, kaprodiRes] = await Promise.all([
        fetch(`${usersUrl}?role=DOSEN`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(apiUrl.replace('/kajur', '/kaprodi'), { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const dosenResult = await dosenRes.json();
      const kaprodiResult = await kaprodiRes.json();
      const kaprodiDosenIds = new Set(
        (kaprodiResult.data || []).map((k: any) => k.dosen_id)
      );
      if (dosenResult.status === 'success') {
        setDosens(dosenResult.data
          .filter((u: any) => !kaprodiDosenIds.has(u.id))
          .map((u: any) => ({
            id: u.id,
            nama: u.dosen?.nama || u.email,
            nip: u.dosen?.nip || '',
            nidn: u.dosen?.nidn || '',
            program_studi_id: u.dosen?.program_studi?.id || '',
            jurusan_id: u.dosen?.program_studi?.jurusan_id || '',
          }))
        );
      }
    } catch {
      console.error('Gagal memuat data dosen');
    }
  };

  const fetchJurusans = async () => {
    try {
      const res = await fetch(jurusanUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === 'success') setJurusans(result.data);
    } catch {
      console.error('Gagal memuat data jurusan');
    }
  };

  const filteredItems = items.filter(item => {
    const dosenName = item.dosen?.nama || '';
    const matchesSearch = dosenName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJurusan = filterJurusan === 'all' || item.jurusan_id === filterJurusan;
    return matchesSearch && matchesJurusan;
  });

  const hasActiveFilters = searchTerm !== '' || filterJurusan !== 'all';
  const resetFilters = () => { setSearchTerm(''); setFilterJurusan('all'); };

  const openAddDialog = () => {
    setFormData({ dosen_id: '', jurusan_id: '', periode_mulai: '', periode_selesai: '' });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Kajur) => {
    setSelectedItem(item);
    setFormData({
      dosen_id: item.dosen_id,
      jurusan_id: item.jurusan_id,
      periode_mulai: item.periode_mulai ? format(new Date(item.periode_mulai), 'yyyy-MM-dd') : '',
      periode_selesai: item.periode_selesai ? format(new Date(item.periode_selesai), 'yyyy-MM-dd') : '',
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.dosen_id || !formData.jurusan_id || !formData.periode_mulai || !formData.periode_selesai) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (new Date(formData.periode_selesai) <= new Date(formData.periode_mulai)) {
      toast.error('Periode selesai harus setelah periode mulai');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Jabatan Kajur berhasil dibuat');
        setShowAddDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || 'Gagal membuat jabatan Kajur');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedItem || !formData.dosen_id || !formData.jurusan_id || !formData.periode_mulai || !formData.periode_selesai) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (new Date(formData.periode_selesai) <= new Date(formData.periode_mulai)) {
      toast.error('Periode selesai harus setelah periode mulai');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Jabatan Kajur berhasil diperbarui');
        setShowEditDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || 'Gagal memperbarui jabatan Kajur');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Jabatan Kajur berhasil dihapus');
        setShowDeleteDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || 'Gagal menghapus jabatan Kajur');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDosenName = (id: string) => dosens.find(d => d.id === id)?.nama || '-';
  const getJurusanName = (id: string) => jurusans.find(j => j.id === id)?.nama_jurusan || '-';
  const getDosenDetail = (id: string) => {
    const d = dosens.find(d => d.id === id);
    return d ? `${d.nip || d.nidn || ''}` : '-';
  };

  return (
    <MainLayout
      title="Jabatan Ketua Jurusan (Kajur)"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Jabatan', path: '/admin/jabatan/kajur' },
        { label: 'Ketua Jurusan' },
      ]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Jabatan Ketua Jurusan</h2>
            <p className="text-sm text-muted-foreground">
              Kelola jabatan Ketua Jurusan — setiap jurusan hanya dapat memiliki satu Kajur aktif
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kajur
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama dosen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filterJurusan} onValueChange={setFilterJurusan}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {jurusans.map(j => (
                <SelectItem key={j.id} value={j.id}>{j.nama_jurusan}</SelectItem>
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
                <TableHead className="w-12">No</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead>Nama Dosen</TableHead>
                <TableHead>NIP / NIDN</TableHead>
                <TableHead>Periode Mulai</TableHead>
                <TableHead>Periode Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Memuat data Kajur...</p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || filterJurusan !== 'all' ? 'Tidak ada data yang sesuai filter' : 'Belum ada data Kajur'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => {
                  const active = isActive(item.periode_mulai, item.periode_selesai);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.jurusan?.nama_jurusan || getJurusanName(item.jurusan_id)}</TableCell>
                      <TableCell className="font-medium">{item.dosen?.nama || getDosenName(item.dosen_id)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.dosen?.nip || getDosenDetail(item.dosen_id)}</TableCell>
                      <TableCell className="text-sm">{item.periode_mulai ? format(new Date(item.periode_mulai), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="text-sm">{item.periode_selesai ? format(new Date(item.periode_selesai), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={active ? 'default' : 'secondary'}>
                          {active ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
            Menampilkan {filteredItems.length} dari {items.length} jabatan Kajur
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Jabatan Kajur Baru</DialogTitle>
            <DialogDescription>
              Pilih dosen dan tentukan periode jabatan. Satu jurusan hanya boleh memiliki satu Kajur aktif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-jurusan">Jurusan *</Label>
              <Select value={formData.jurusan_id} onValueChange={(v) => setFormData({ ...formData, jurusan_id: v, dosen_id: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jurusan" />
                </SelectTrigger>
                <SelectContent>
                  {jurusans.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.nama_jurusan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-dosen">Dosen *</Label>
              <Select value={formData.dosen_id} onValueChange={(v) => setFormData({ ...formData, dosen_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  {dosens
                    .filter(d => !formData.jurusan_id || d.jurusan_id === formData.jurusan_id)
                    .map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nama} ({d.nip || d.nidn})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-mulai">Periode Mulai *</Label>
              <Input
                id="add-mulai"
                type="date"
                value={formData.periode_mulai}
                onChange={(e) => setFormData({ ...formData, periode_mulai: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-selesai">Periode Selesai *</Label>
              <Input
                id="add-selesai"
                type="date"
                value={formData.periode_selesai}
                onChange={(e) => setFormData({ ...formData, periode_selesai: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Jabatan Kajur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-jurusan">Jurusan *</Label>
              <Select value={formData.jurusan_id} onValueChange={(v) => setFormData({ ...formData, jurusan_id: v, dosen_id: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jurusans.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.nama_jurusan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dosen">Dosen *</Label>
              <Select value={formData.dosen_id} onValueChange={(v) => setFormData({ ...formData, dosen_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dosens
                    .filter(d => !formData.jurusan_id || d.jurusan_id === formData.jurusan_id)
                    .map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nama} ({d.nip || d.nidn})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mulai">Periode Mulai *</Label>
              <Input
                id="edit-mulai"
                type="date"
                value={formData.periode_mulai}
                onChange={(e) => setFormData({ ...formData, periode_mulai: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-selesai">Periode Selesai *</Label>
              <Input
                id="edit-selesai"
                type="date"
                value={formData.periode_selesai}
                onChange={(e) => setFormData({ ...formData, periode_selesai: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jabatan Kajur?</AlertDialogTitle>
            <AlertDialogDescription>
              Jabatan Kajur untuk <strong>{selectedItem?.dosen?.nama || 'dosen terpilih'}</strong> akan dihapus.
              Pastikan tidak ada jabatan aktif lain yang bergantung pada data ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
