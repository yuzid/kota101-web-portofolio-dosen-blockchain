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
import { Plus, Search, Edit, Power, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  username: string; // Will map from email
  nidn?: string;
  nip?: string;
  roles: string[]; // List of roles for display
  mainRole: string; // Primary role for filtering/editing
  programStudi: string;
  programStudiId?: string;
  jurusanId?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const roleLabels: Record<string, string> = {
  dosen: 'Dosen',
  staf_tu: 'Staf Tata Usaha',
  kaprodi: 'Kaprodi',
  kajur: 'Kajur',
  admin: 'Admin'
};

const roleBadgeColors: Record<string, string> = {
  dosen: 'bg-green-500',
  staf_tu: 'bg-blue-500',
  kaprodi: 'bg-purple-500',
  kajur: 'bg-orange-500',
  admin: 'bg-red-500'
};

// Internal mapping helper
const mapRolesFromBackend = (u: any): string[] => {
  const roles: string[] = [];
  const dbRole = u.role?.toUpperCase();
  
  if (dbRole === 'ADMIN') roles.push('admin');
  if (dbRole === 'TATA_USAHA') roles.push('staf_tu');
  if (dbRole === 'DOSEN') roles.push('dosen');

  if (u.dosen?.jabatan_kajur && u.dosen.jabatan_kajur.length > 0) roles.push('kajur');
  if (u.dosen?.jabatan_kaprodi && u.dosen.jabatan_kaprodi.length > 0) roles.push('kaprodi');

  return roles;
};

const mapRoleToBackend = (frontendRole: string): string => {
  if (frontendRole === 'staf_tu') return 'TATA_USAHA';
  if (frontendRole === 'admin') return 'ADMIN';
  return frontendRole.toUpperCase();
};

export function ManageAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJurusan, setFilterJurusan] = useState('all');
  const [filterProdi, setFilterProdi] = useState('all');

  const [prodis, setProdis] = useState<any[]>([]);
  const [jurusans, setJurusans] = useState<any[]>([]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitMode, setSubmitMode] = useState<'add' | 'edit' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    nidn: '',
    nip: '',
    password: '',
    role: '',
    programStudi: '',
    programStudiId: '',
    jurusanId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [nipError, setNipError] = useState('');
  const [nidnError, setNidnError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const mapped = result.data.map((u: any) => {
          const userRoles = mapRolesFromBackend(u);
          return {
            id: u.id,
            name: u.dosen?.nama || u.tata_usaha?.nama || u.admin?.nama || u.email,
            username: u.email,
            nip: u.dosen?.nip || u.tata_usaha?.nip,
            nidn: u.dosen?.nidn,
            roles: userRoles,
            mainRole: u.role.toLowerCase(), // Store original role for filtering/editing
            programStudi: u.dosen?.program_studi?.nama_prodi || (u.tata_usaha?.jurusan_id ? 'JTK' : 'Sistem'),
            programStudiId: u.dosen?.program_studi?.id,
            jurusanId: u.dosen?.program_studi?.jurusan_id || u.tata_usaha?.jurusan_id,
            status: 'active' as const,
            lastLogin: 'Belum pernah',
          };
        });
        setAccounts(mapped);
      }
    } catch (error) {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [prodiRes, jurusanRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const pData = await prodiRes.json();
      const jData = await jurusanRes.json();
      if (pData.status === 'success') setProdis(pData.data);
      if (jData.status === 'success') setJurusans(jData.data);
    } catch (error) {
      console.error('Gagal memuat metadata');
    }
  };

  // Filter logic
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter can match any of the roles
    const matchesRole = filterRole === 'all' || account.roles.includes(filterRole);
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
    const matchesJurusan = filterJurusan === 'all' || account.jurusanId === filterJurusan;
    const matchesProdi = filterProdi === 'all' || account.programStudiId === filterProdi;

    return matchesSearch && matchesRole && matchesStatus && matchesJurusan && matchesProdi;
  });

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all' || filterJurusan !== 'all' || filterProdi !== 'all' || searchTerm !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterJurusan('all');
    setFilterProdi('all');
  };

  const openAddDialog = () => {
    setFormData({ name: '', username: '', nidn: '', nip: '', password: '', role: '', programStudi: '', programStudiId: '', jurusanId: '' });
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
      nip: account.nip || '',
      password: '',
      role: account.mainRole === 'tata_usaha' ? 'staf_tu' : account.mainRole === 'admin' ? 'admin' : account.mainRole,
      programStudi: account.programStudi,
      programStudiId: account.programStudiId || '',
      jurusanId: account.jurusanId || '',
    });
    setUsernameError('');
    setShowPassword(false);
    setShowEditDialog(true);
  };

  const checkUsernameAvailability = (username: string, excludeId?: string) => {
    const exists = accounts.some(acc => acc.username === username && acc.id !== excludeId);
    if (exists) {
      setUsernameError('Email ini sudah digunakan');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (formData.password.length < 8) {
      setPasswordError('Password minimal 8 karakter');
      return;
    }
    setSubmitMode('add');
    setShowSubmitConfirm(true);
  };

  const confirmSubmitAdd = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const payload = {
        email: formData.username,
        password: formData.password,
        role: mapRoleToBackend(formData.role),
        nama: formData.name,
        nip: formData.nip || undefined,
        nidn: formData.nidn || undefined,
        program_studi_id: formData.programStudiId || undefined,
        jurusan_id: formData.jurusanId || undefined,
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Akun ${formData.name} berhasil dibuat.`);
        setShowAddDialog(false);
        fetchUsers();
      } else {
        toast.error(result.error || 'Gagal membuat akun');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = () => {
    let hasError = false;

    if (!selectedAccount || !formData.name || !formData.role) {
      toast.error('Field yang wajib tidak boleh kosong');
      return;
    }

    if (formData.role === 'dosen' || formData.role === 'staf_tu') {
      if (!formData.nip.trim()) {
        setNipError('NIP wajib diisi');
        hasError = true;
      }
    }

    if (formData.role === 'dosen' && !formData.nidn.trim()) {
      setNidnError('NIDN wajib diisi');
      hasError = true;
    }

    if (formData.password && formData.password.length < 8) {
      setPasswordError('Password minimal 8 karakter');
      hasError = true;
    }

    if (hasError) return;

    setSubmitMode('edit');
    setShowSubmitConfirm(true);
  };

  const confirmSubmitEdit = async () => {
    if (!selectedAccount) return;
    setShowSubmitConfirm(false);
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    try {
      const payload: any = {
        nama: formData.name,
        nip: formData.nip,
        nidn: formData.nidn,
        program_studi_id: formData.programStudiId || undefined,
        jurusan_id: formData.jurusanId || undefined,
      };
      if (formData.password) payload.password = formData.password;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Akun ${formData.name} berhasil diperbarui.`);
        setShowEditDialog(false);
        fetchUsers();
      } else {
        toast.error(result.error || 'Gagal memperbarui akun');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setShowDeactivateDialog(false);
    toast.info('Fitur kelola status akun akan segera hadir.');
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
                placeholder="Cari nama atau email..."
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
              <SelectItem value="staf_tu">Staf Tata Usaha</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
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

          <Select value={filterJurusan} onValueChange={(val) => { setFilterJurusan(val); setFilterProdi('all'); }}>
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

          <Select value={filterProdi} onValueChange={setFilterProdi}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Program Studi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Program Studi</SelectItem>
              {prodis
                .filter(p => filterJurusan === 'all' || p.jurusan_id === filterJurusan)
                .map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nama_prodi}</SelectItem>
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
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Program Studi / Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Login</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Memuat data pengguna...</p>
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
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
                      <div className="flex flex-wrap gap-1">
                        {account.roles.map(r => (
                          <Badge key={r} className={roleBadgeColors[r]}>
                            {roleLabels[r] || r}
                          </Badge>
                        ))}
                      </div>
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

        {!isLoading && (
          <div className="text-sm text-muted-foreground">
            Menampilkan {filteredAccounts.length} dari {accounts.length} akun
          </div>
        )}
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

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
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
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setUsernameError('');
                }}
                onBlur={() => formData.username && checkUsernameAvailability(formData.username)}
                placeholder="Masukkan email"
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, programStudiId: '', jurusanId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="staf_tu">Staf Tata Usaha</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.role === 'dosen' || formData.role === 'staf_tu') && (
              <div className="space-y-2">
                <Label htmlFor="add-nip">NIP *</Label>
                <Input
                  id="add-nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Masukkan NIP"
                />
              </div>
            )}

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="add-nidn">NIDN *</Label>
                <Input
                  id="add-nidn"
                  value={formData.nidn}
                  onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                  placeholder="Masukkan NIDN"
                />
              </div>
            )}

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="add-jurusan">Jurusan *</Label>
                <Select
                  value={formData.jurusanId}
                  onValueChange={(value) => setFormData({ ...formData, jurusanId: value, programStudiId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>{j.nama_jurusan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="add-prodi">Program Studi *</Label>
                <Select value={formData.programStudiId} onValueChange={(value) => setFormData({ ...formData, programStudiId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih program studi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodis
                      .filter((p: any) => !formData.jurusanId || p.jurusan_id === formData.jurusanId)
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nama_prodi}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-password">Password Awal *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError('');
                  }}
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
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>

            {formData.role === 'staf_tu' && (
              <div className="space-y-2">
                <Label htmlFor="add-jurusan">Jurusan *</Label>
                <Select value={formData.jurusanId} onValueChange={(value) => setFormData({ ...formData, jurusanId: value })}>
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
            )}
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

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Akun — {selectedAccount?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={formData.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>

            {(formData.role === 'dosen' || formData.role === 'staf_tu') && (
              <div className="space-y-2">
                <Label htmlFor="edit-nip">NIP *</Label>
                <Input
                  id="edit-nip"
                  value={formData.nip}
                  onChange={(e) => {
                    setFormData({ ...formData, nip: e.target.value });
                    setNipError('');
                  }}
                />
                {nipError && <p className="text-sm text-destructive">{nipError}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                value={roleLabels[formData.role] || formData.role}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Role tidak dapat diubah</p>
            </div>

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="edit-nidn">NIDN *</Label>
                <Input
                  id="edit-nidn"
                  value={formData.nidn}
                  onChange={(e) => {
                    setFormData({ ...formData, nidn: e.target.value });
                    setNidnError('');
                  }}
                  placeholder="Masukkan NIDN"
                />
                {nidnError && <p className="text-sm text-destructive">{nidnError}</p>}
              </div>
            )}

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="edit-jurusan">Jurusan *</Label>
                <Select
                  value={formData.jurusanId}
                  onValueChange={(value) => setFormData({ ...formData, jurusanId: value, programStudiId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>{j.nama_jurusan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === 'dosen' && (
              <div className="space-y-2">
                <Label htmlFor="edit-prodi">Program Studi *</Label>
                <Select value={formData.programStudiId} onValueChange={(value) => setFormData({ ...formData, programStudiId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prodis
                      .filter((p: any) => !formData.jurusanId || p.jurusan_id === formData.jurusanId)
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nama_prodi}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-password">Reset Password (opsional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError('');
                  }}
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
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
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

      {/* Submit Confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Simpan</AlertDialogTitle>
            <AlertDialogDescription>
              {submitMode === 'add'
                ? `Apakah Anda yakin ingin membuat akun ${formData.name} (${formData.username})?`
                : `Apakah Anda yakin ingin menyimpan perubahan untuk akun ${formData.name}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={submitMode === 'add' ? confirmSubmitAdd : confirmSubmitEdit}>
              {submitMode === 'add' ? 'Buat Akun' : 'Simpan Perubahan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  Akun <strong>{selectedAccount?.name}</strong> (email: <code>{selectedAccount?.username}</code>) akan dinonaktifkan.
                  Pengguna ini tidak akan bisa login dan seluruh sesi aktifnya akan langsung diakhiri.
                  Akun dapat diaktifkan kembali kapan saja.
                </>
              ) : (
                <>
                  Akun <strong>{selectedAccount?.name}</strong> (email: <code>{selectedAccount?.username}</code>) akan diaktifkan kembali
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
