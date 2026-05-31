import { useState } from 'react';
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
import { Badge } from '../components/ui/badge';
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
import { Label } from '../components/ui/label';
import { Plus, Search, Edit, Power, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  username: string;
  nidn?: string;
  role: string;
  programStudi: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const mockAccounts: Account[] = [
  { id: '1', name: 'Dr. John Doe', username: 'john.doe', nidn: '0412108901', role: 'dosen', programStudi: 'D4 Teknik Informatika', status: 'active', lastLogin: '2026-05-15 14:30' },
  { id: '2', name: 'Dr. Jane Smith', username: 'jane.smith', nidn: '0415078801', role: 'kaprodi', programStudi: 'D4 Teknik Informatika', status: 'active', lastLogin: '2026-05-16 08:15' },
  { id: '3', name: 'Admin TU 1', username: 'admin.tu', role: 'admin_tu', programStudi: 'Jurusan TKI', status: 'active', lastLogin: '2026-05-16 09:00' },
  { id: '4', name: 'Dr. Ahmad Fauzi', username: 'ahmad.f', nidn: '0420059102', role: 'dosen', programStudi: 'D3 Teknik Informatika', status: 'active', lastLogin: 'Belum pernah' },
  { id: '5', name: 'Prof. Siti Nurhaliza', username: 'siti.n', nidn: '0405067801', role: 'kajur', programStudi: 'Jurusan TKI', status: 'active', lastLogin: '2026-05-14 16:45' },
  { id: '6', name: 'Dr. Budi Santoso', username: 'budi.s', nidn: '0418088902', role: 'dosen', programStudi: 'D4 Teknik Informatika', status: 'inactive', lastLogin: '2026-04-20 10:30' },
];

const roleLabels: Record<string, string> = {
  dosen: 'Dosen',
  admin_tu: 'Admin TU',
  kaprodi: 'Kaprodi',
  kajur: 'Kajur',
};

const roleBadgeColors: Record<string, string> = {
  dosen: 'bg-green-500',
  admin_tu: 'bg-blue-500',
  kaprodi: 'bg-purple-500',
  kajur: 'bg-orange-500',
};

export function ManageAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProdi, setFilterProdi] = useState('all');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    nidn: '',
    password: '',
    role: '',
    programStudi: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Filter logic
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || account.role === filterRole;
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
    const matchesProdi = filterProdi === 'all' || account.programStudi === filterProdi;

    return matchesSearch && matchesRole && matchesStatus && matchesProdi;
  });

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all' || filterProdi !== 'all' || searchTerm !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterProdi('all');
  };

  const openAddDialog = () => {
    setFormData({ name: '', username: '', nidn: '', password: '', role: '', programStudi: '' });
    setUsernameError('');
    setShowPassword(false);
    setShowAddDialog(true);
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      username: account.username,
      nidn: account.nidn || '',
      password: '',
      role: account.role,
      programStudi: account.programStudi,
    });
    setUsernameError('');
    setShowPassword(false);
    setShowEditDialog(true);
  };

  const checkUsernameAvailability = (username: string, excludeId?: string) => {
    const exists = accounts.some(acc => acc.username === username && acc.id !== excludeId);
    if (exists) {
      setUsernameError('Username ini sudah digunakan');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.username || !formData.password || !formData.role || !formData.programStudi) {
      toast.error('Semua field wajib diisi');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }

    if (!checkUsernameAvailability(formData.username)) {
      return;
    }

    const newAccount: Account = {
      id: String(Date.now()),
      name: formData.name,
      username: formData.username,
      nidn: formData.nidn || undefined,
      role: formData.role,
      programStudi: formData.programStudi,
      status: 'active',
      lastLogin: 'Belum pernah',
    };

    setAccounts([...accounts, newAccount]);
    setShowAddDialog(false);
    toast.success(`Akun ${formData.name} berhasil dibuat.`);
  };

  const handleSubmitEdit = () => {
    if (!selectedAccount || !formData.name || !formData.role || !formData.programStudi) {
      toast.error('Field yang wajib tidak boleh kosong');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }

    const updatedAccounts = accounts.map(acc =>
      acc.id === selectedAccount.id
        ? { ...acc, name: formData.name, nidn: formData.nidn || undefined, role: formData.role, programStudi: formData.programStudi }
        : acc
    );

    setAccounts(updatedAccounts);
    setShowEditDialog(false);
    toast.success(`Akun ${formData.name} berhasil diperbarui.`);
  };

  const handleToggleStatus = () => {
    if (!selectedAccount) return;

    const updatedAccounts = accounts.map(acc =>
      acc.id === selectedAccount.id
        ? { ...acc, status: acc.status === 'active' ? 'inactive' as const : 'active' as const }
        : acc
    );

    setAccounts(updatedAccounts);
    setShowDeactivateDialog(false);

    const newStatus = selectedAccount.status === 'active' ? 'nonaktif' : 'aktif';
    toast.success(`Akun ${selectedAccount.name} berhasil ${newStatus === 'nonaktif' ? 'dinonaktifkan' : 'diaktifkan'}.`);
  };

  return (
    <MainLayout
      title="Manajemen Akun Pengguna"
      breadcrumbs={[{ label: 'Beranda', path: '/dashboard' }, { label: 'Manajemen Akun' }]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manajemen Akun Pengguna</h2>
            <p className="text-sm text-muted-foreground">
              Kelola akun pengguna sistem portofolio
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Akun Baru
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="dosen">Dosen</SelectItem>
              <SelectItem value="admin_tu">Admin TU</SelectItem>
              <SelectItem value="kaprodi">Kaprodi</SelectItem>
              <SelectItem value="kajur">Kajur</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProdi} onValueChange={setFilterProdi}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Program Studi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Program Studi</SelectItem>
              <SelectItem value="D3 Teknik Informatika">D3 Teknik Informatika</SelectItem>
              <SelectItem value="D4 Teknik Informatika">D4 Teknik Informatika</SelectItem>
              <SelectItem value="Jurusan TKI">Jurusan TKI</SelectItem>
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
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Program Studi / Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Login</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data yang sesuai dengan filter
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{account.username}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[account.role]}>
                        {roleLabels[account.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.programStudi}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                        {account.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.lastLogin}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(account)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowDeactivateDialog(true);
                          }}
                        >
                          <Power className={account.status === 'active' ? 'w-4 h-4 text-destructive' : 'w-4 h-4 text-green-500'} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredAccounts.length} dari {accounts.length} akun
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Akun Pengguna Baru</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk membuat akun baru
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nama Lengkap *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-username">Username *</Label>
              <Input
                id="add-username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setUsernameError('');
                }}
                onBlur={() => formData.username && checkUsernameAvailability(formData.username)}
                placeholder="Masukkan username"
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-nidn">NIDN</Label>
              <Input
                id="add-nidn"
                value={formData.nidn}
                onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                placeholder="Masukkan NIDN (opsional untuk dosen)"
              />
              <p className="text-xs text-muted-foreground">
                (opsional, khusus untuk dosen)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Password Awal *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password ini akan digunakan pengguna untuk login pertama kali.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="admin_tu">Admin TU</SelectItem>
                  <SelectItem value="kaprodi">Kaprodi</SelectItem>
                  <SelectItem value="kajur">Kajur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-prodi">Program Studi / Unit *</Label>
              <Select value={formData.programStudi} onValueChange={(value) => setFormData({ ...formData, programStudi: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D3 Teknik Informatika">D3 Teknik Informatika</SelectItem>
                  <SelectItem value="D4 Teknik Informatika">D4 Teknik Informatika</SelectItem>
                  <SelectItem value="Jurusan TKI">Jurusan TKI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Akun — {selectedAccount?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nidn">NIDN</Label>
              <Input
                id="edit-nidn"
                value={formData.nidn}
                onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                placeholder="Masukkan NIDN (opsional)"
              />
              <p className="text-xs text-muted-foreground">
                (opsional, khusus untuk dosen)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Reset Password (opsional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Kosongkan jika tidak ingin mengubah password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="admin_tu">Admin TU</SelectItem>
                  <SelectItem value="kaprodi">Kaprodi</SelectItem>
                  <SelectItem value="kajur">Kajur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prodi">Program Studi / Unit *</Label>
              <Select value={formData.programStudi} onValueChange={(value) => setFormData({ ...formData, programStudi: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D3 Teknik Informatika">D3 Teknik Informatika</SelectItem>
                  <SelectItem value="D4 Teknik Informatika">D4 Teknik Informatika</SelectItem>
                  <SelectItem value="Jurusan TKI">Jurusan TKI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Confirmation */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAccount?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} Akun?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAccount?.status === 'active' ? (
                <>
                  Akun <strong>{selectedAccount?.name}</strong> (username: <code>{selectedAccount?.username}</code>) akan dinonaktifkan.
                  Pengguna ini tidak akan bisa login dan seluruh sesi aktifnya akan langsung diakhiri.
                  Akun dapat diaktifkan kembali kapan saja.
                </>
              ) : (
                <>
                  Akun <strong>{selectedAccount?.name}</strong> (username: <code>{selectedAccount?.username}</code>) akan diaktifkan kembali
                  dan pengguna dapat login ke sistem.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={selectedAccount?.status === 'active' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {selectedAccount?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
