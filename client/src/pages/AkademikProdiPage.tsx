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

interface Prodi {
  id: string;
  kode_prodi: string;
  nama_prodi: string;
  jurusan_id: string;
  jurusan?: { id: string; kode_jurusan: string; nama_jurusan: string };
}

interface Jurusan {
  id: string;
  kode_jurusan: string;
  nama_jurusan: string;
}

export function AkademikProdiPage() {
  const [items, setItems] = useState<Prodi[]>([]);
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('all');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Prodi | null>(null);

  const [formData, setFormData] = useState({ kode_prodi: '', nama_prodi: '', jurusan_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`;
  const jurusanUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => {
    Promise.all([fetchProdi(), fetchJurusans()]);
  }, []);

  const fetchProdi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === 'success') setItems(result.data);
      else toast.error(result.error || 'Gagal memuat data program studi');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
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
    const matchesSearch =
      item.nama_prodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_prodi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJurusan = filterJurusan === 'all' || item.jurusan_id === filterJurusan;
    return matchesSearch && matchesJurusan;
  });

  const hasActiveFilters = searchTerm !== '' || filterJurusan !== 'all';
  const resetFilters = () => { setSearchTerm(''); setFilterJurusan('all'); };

  const openAddDialog = () => {
    setFormData({ kode_prodi: '', nama_prodi: '', jurusan_id: '' });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Prodi) => {
    setSelectedItem(item);
    setFormData({ kode_prodi: item.kode_prodi, nama_prodi: item.nama_prodi, jurusan_id: item.jurusan_id });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.kode_prodi || !formData.nama_prodi || !formData.jurusan_id) {
      toast.error('Semua field wajib diisi');
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
        toast.success(`Program studi ${formData.nama_prodi} berhasil dibuat`);
        setShowAddDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || 'Gagal membuat program studi');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedItem || !formData.kode_prodi || !formData.nama_prodi || !formData.jurusan_id) {
      toast.error('Semua field wajib diisi');
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
        toast.success(`Program studi ${formData.nama_prodi} berhasil diperbarui`);
        setShowEditDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || 'Gagal memperbarui program studi');
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
        toast.success(`Program studi ${selectedItem.nama_prodi} berhasil dihapus`);
        setShowDeleteDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || 'Gagal menghapus program studi');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJurusanName = (id: string) => jurusans.find(j => j.id === id)?.nama_jurusan || '-';

  return (
    <MainLayout
      title="Data Program Studi"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Akademik', path: '/admin/akademik/prodi' },
        { label: 'Program Studi' },
      ]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Data Program Studi</h2>
            <p className="text-sm text-muted-foreground">
              Kelola data program studi di lingkungan POLBAN
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Prodi
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode prodi..."
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
                <TableHead>Kode</TableHead>
                <TableHead>Nama Program Studi</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Memuat data program studi...</p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm || filterJurusan !== 'all' ? 'Tidak ada data yang sesuai filter' : 'Belum ada data program studi'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.kode_prodi}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.nama_prodi}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getJurusanName(item.jurusan_id)}</Badge>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && (
          <div className="text-sm text-muted-foreground">
            Menampilkan {filteredItems.length} dari {items.length} program studi
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Program Studi Baru</DialogTitle>
            <DialogDescription>Isi form di bawah untuk menambah prodi baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-kode">Kode Program Studi *</Label>
              <Input
                id="add-kode"
                value={formData.kode_prodi}
                onChange={(e) => setFormData({ ...formData, kode_prodi: e.target.value })}
                placeholder="Contoh: D3-TI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Program Studi *</Label>
              <Input
                id="add-nama"
                value={formData.nama_prodi}
                onChange={(e) => setFormData({ ...formData, nama_prodi: e.target.value })}
                placeholder="Contoh: D3 Teknik Informatika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-jurusan">Jurusan *</Label>
              <Select value={formData.jurusan_id} onValueChange={(v) => setFormData({ ...formData, jurusan_id: v })}>
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
            <DialogTitle>Edit Program Studi — {selectedItem?.kode_prodi}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-kode">Kode Program Studi *</Label>
              <Input
                id="edit-kode"
                value={formData.kode_prodi}
                onChange={(e) => setFormData({ ...formData, kode_prodi: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Program Studi *</Label>
              <Input
                id="edit-nama"
                value={formData.nama_prodi}
                onChange={(e) => setFormData({ ...formData, nama_prodi: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jurusan">Jurusan *</Label>
              <Select value={formData.jurusan_id} onValueChange={(v) => setFormData({ ...formData, jurusan_id: v })}>
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
            <AlertDialogTitle>Hapus Program Studi?</AlertDialogTitle>
            <AlertDialogDescription>
              Program studi <strong>{selectedItem?.nama_prodi}</strong> ({selectedItem?.kode_prodi}) akan dihapus permanen.
              Program studi yang masih memiliki dosen tidak dapat dihapus.
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
