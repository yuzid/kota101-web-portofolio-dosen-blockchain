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
import { Plus, Search, Edit, Trash2, X, Loader2, Landmark } from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: string;
  kode_jurusan: string;
  nama_jurusan: string;
  program_studi?: { id: string; kode_prodi: string; nama_prodi: string }[];
}

export function AkademikJurusanPage() {
  const [items, setItems] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Jurusan | null>(null);

  const [formData, setFormData] = useState({ kode_jurusan: '', nama_jurusan: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.status === 'success') setItems(result.data);
      else toast.error(result.error || 'Gagal memuat data jurusan');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.nama_jurusan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode_jurusan.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasActiveFilters = searchTerm !== '';
  const resetFilters = () => setSearchTerm('');

  const openAddDialog = () => {
    setFormData({ kode_jurusan: '', nama_jurusan: '' });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Jurusan) => {
    setSelectedItem(item);
    setFormData({ kode_jurusan: item.kode_jurusan, nama_jurusan: item.nama_jurusan });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.kode_jurusan || !formData.nama_jurusan) {
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
        toast.success(`Jurusan ${formData.nama_jurusan} berhasil dibuat`);
        setShowAddDialog(false);
        fetchData();
      } else {
        toast.error(result.error || 'Gagal membuat jurusan');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedItem || !formData.kode_jurusan || !formData.nama_jurusan) {
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
        toast.success(`Jurusan ${formData.nama_jurusan} berhasil diperbarui`);
        setShowEditDialog(false);
        fetchData();
      } else {
        toast.error(result.error || 'Gagal memperbarui jurusan');
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
        toast.success(`Jurusan ${selectedItem.nama_jurusan} berhasil dihapus`);
        setShowDeleteDialog(false);
        fetchData();
      } else {
        toast.error(result.error || 'Gagal menghapus jurusan');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      title="Data Jurusan"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Akademik', path: '/admin/akademik/jurusan' },
        { label: 'Jurusan' },
      ]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Data Jurusan</h2>
            <p className="text-sm text-muted-foreground">
              Kelola data jurusan di lingkungan POLBAN
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jurusan
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode jurusan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
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
                <TableHead>Nama Jurusan</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Memuat data jurusan...</p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Tidak ada jurusan yang sesuai pencarian' : 'Belum ada data jurusan'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.kode_jurusan}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.nama_jurusan}</TableCell>
                    <TableCell>
                      {item.program_studi && item.program_studi.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.program_studi.map((ps) => (
                            <Badge key={ps.id} variant="secondary" className="text-xs">
                              {ps.nama_prodi}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
            Menampilkan {filteredItems.length} dari {items.length} jurusan
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Jurusan Baru</DialogTitle>
            <DialogDescription>Isi form di bawah untuk menambah jurusan baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-kode">Kode Jurusan *</Label>
              <Input
                id="add-kode"
                value={formData.kode_jurusan}
                onChange={(e) => setFormData({ ...formData, kode_jurusan: e.target.value })}
                placeholder="Contoh: JTK"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Jurusan *</Label>
              <Input
                id="add-nama"
                value={formData.nama_jurusan}
                onChange={(e) => setFormData({ ...formData, nama_jurusan: e.target.value })}
                placeholder="Contoh: Jurusan Teknik Komputer dan Informatika"
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
            <DialogTitle>Edit Jurusan — {selectedItem?.kode_jurusan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-kode">Kode Jurusan *</Label>
              <Input
                id="edit-kode"
                value={formData.kode_jurusan}
                onChange={(e) => setFormData({ ...formData, kode_jurusan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Jurusan *</Label>
              <Input
                id="edit-nama"
                value={formData.nama_jurusan}
                onChange={(e) => setFormData({ ...formData, nama_jurusan: e.target.value })}
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
            <AlertDialogTitle>Hapus Jurusan?</AlertDialogTitle>
            <AlertDialogDescription>
              Jurusan <strong>{selectedItem?.nama_jurusan}</strong> ({selectedItem?.kode_jurusan}) akan dihapus permanen.
              {selectedItem?.program_studi && selectedItem.program_studi.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Jurusan ini memiliki {selectedItem.program_studi.length} program studi. Hapus program studi terlebih dahulu sebelum menghapus jurusan.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting || (selectedItem?.program_studi ? selectedItem.program_studi.length > 0 : false)}
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
