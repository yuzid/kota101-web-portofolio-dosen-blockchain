import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Plus,
  Edit,
  Power,
  Eye,
  EyeOff,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Users,
  Filter,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { AnimatedTable, AnimatedTableRow } from "@/components/ui/animated-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Account {
  id: string;
  name: string;
  username: string;
  nidn?: string;
  nip?: string;
  roles: string[];
  mainRole: string;
  programStudi: string;
  programStudiId?: string;
  jurusanId?: string;
  status: "active" | "inactive";
  lastLogin?: string;
}

const roleLabels: Record<string, string> = {
  dosen: "Dosen",
  staf_tu: "Staf Tata Usaha",
  kaprodi: "Kaprodi",
  kajur: "Kajur",
  admin: "Admin",
};

const mapRolesFromBackend = (u: any): string[] => {
  const roles: string[] = [];
  const dbRole = u.role?.toUpperCase();
  if (dbRole === "ADMIN") roles.push("admin");
  if (dbRole === "TATA_USAHA") roles.push("staf_tu");
  if (dbRole === "DOSEN") roles.push("dosen");
  if (u.dosen?.jabatan_kajur && u.dosen.jabatan_kajur.length > 0)
    roles.push("kajur");
  if (u.dosen?.jabatan_kaprodi && u.dosen.jabatan_kaprodi.length > 0)
    roles.push("kaprodi");
  return roles;
};

const mapRoleToBackend = (frontendRole: string): string => {
  if (frontendRole === "staf_tu") return "TATA_USAHA";
  if (frontendRole === "admin") return "ADMIN";
  return frontendRole.toUpperCase();
};

export function ManageAccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJurusan, setFilterJurusan] = useState("all");
  const [filterProdi, setFilterProdi] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [prodis, setProdis] = useState<any[]>([]);
  const [jurusans, setJurusans] = useState<any[]>([]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitMode, setSubmitMode] = useState<"add" | "edit" | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    nidn: "",
    nip: "",
    password: "",
    role: "",
    programStudi: "",
    programStudiId: "",
    jurusanId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [nipError, setNipError] = useState("");
  const [nidnError, setNidnError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const MOCK_MODE =
      localStorage.getItem("VITE_MOCK_API") === "true";
    if (MOCK_MODE) {
      const stored = localStorage.getItem("MOCK_ACCOUNTS");
      if (stored) {
        try {
          setAccounts(JSON.parse(stored));
          setIsLoading(false);
          return;
        } catch (_) {}
      }
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        const mapped = result.data.map((u: any) => {
          const userRoles = mapRolesFromBackend(u);
          return {
            id: u.id,
            name:
              u.dosen?.nama ||
              u.tata_usaha?.nama ||
              u.admin?.nama ||
              u.email,
            username: u.email,
            nip: u.dosen?.nip || u.tata_usaha?.nip,
            nidn: u.dosen?.nidn,
            roles: userRoles,
            mainRole: u.role.toLowerCase(),
            programStudi:
              u.dosen?.program_studi?.nama_prodi ||
              (u.tata_usaha?.jurusan_id ? "JTK" : "Sistem"),
            programStudiId: u.dosen?.program_studi?.id,
            jurusanId:
              u.dosen?.program_studi?.jurusan_id ||
              u.tata_usaha?.jurusan_id,
            status: "active" as const,
            lastLogin: "Belum pernah",
          };
        });
        if (MOCK_MODE) {
          localStorage.setItem("MOCK_ACCOUNTS", JSON.stringify(mapped));
        }
        setAccounts(mapped);
      }
    } catch (error) {
      if (MOCK_MODE) {
        const seed: Account[] = [
          {
            id: "seed-1",
            name: "Dr. Andi Pratama",
            username: "andi@example.com",
            nip: "198001012005011001",
            nidn: "0010018001",
            roles: ["dosen"],
            mainRole: "dosen",
            programStudi: "Informatika",
            programStudiId: "prodi-1",
            jurusanId: "jur-1",
            status: "active",
            lastLogin: "Belum pernah",
          },
          {
            id: "seed-2",
            name: "Dewi Sartika",
            username: "dewi@example.com",
            nip: "198502102010012002",
            nidn: "0010028502",
            roles: ["dosen"],
            mainRole: "dosen",
            programStudi: "Sistem Informasi",
            programStudiId: "prodi-2",
            jurusanId: "jur-1",
            status: "active",
            lastLogin: "Belum pernah",
          },
          {
            id: "seed-3",
            name: "Budi Santoso",
            username: "budi@example.com",
            nip: "199003152015031003",
            roles: ["staf_tu"],
            mainRole: "staf_tu",
            programStudi: "JTK",
            programStudiId: "",
            jurusanId: "jur-1",
            status: "active",
            lastLogin: "Belum pernah",
          },
          {
            id: "seed-4",
            name: "Admin Sistem",
            username: "admin@example.com",
            roles: ["admin"],
            mainRole: "admin",
            programStudi: "Sistem",
            programStudiId: "",
            jurusanId: "",
            status: "active",
            lastLogin: "Belum pernah",
          },
          {
            id: "seed-5",
            name: "Prof. Sri Wahyuni",
            username: "sri@example.com",
            nip: "197512102003122003",
            nidn: "0010127505",
            roles: ["dosen", "kaprodi"],
            mainRole: "dosen",
            programStudi: "Informatika",
            programStudiId: "prodi-1",
            jurusanId: "jur-1",
            status: "active",
            lastLogin: "Belum pernah",
          },
        ];
        localStorage.setItem("MOCK_ACCOUNTS", JSON.stringify(seed));
        setAccounts(seed);
      } else {
        toast.error("Gagal memuat data pengguna");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [prodiRes, jurusanRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
      const pData = await prodiRes.json();
      const jData = await jurusanRes.json();
      if (pData.status === "success") setProdis(pData.data);
      if (jData.status === "success") setJurusans(jData.data);
    } catch (error) {
      console.error("Gagal memuat metadata");
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" || account.roles.includes(filterRole);
    const matchesStatus =
      filterStatus === "all" || account.status === filterStatus;
    const matchesJurusan =
      filterJurusan === "all" || account.jurusanId === filterJurusan;
    const matchesProdi =
      filterProdi === "all" || account.programStudiId === filterProdi;
    return (
      matchesSearch && matchesRole && matchesStatus && matchesJurusan && matchesProdi
    );
  });

  const hasActiveFilters =
    filterRole !== "all" ||
    filterStatus !== "all" ||
    filterJurusan !== "all" ||
    filterProdi !== "all" ||
    searchTerm !== "";

  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterStatus("all");
    setFilterJurusan("all");
    setFilterProdi("all");
  };

  const openAddDialog = () => {
    setFormData({
      name: "",
      username: "",
      nidn: "",
      nip: "",
      password: "",
      role: "",
      programStudi: "",
      programStudiId: "",
      jurusanId: "",
    });
    setUsernameError("");
    setNipError("");
    setNidnError("");
    setGeneralError("");
    setShowPassword(false);
    setShowAddDialog(true);
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      username: account.username,
      nidn: account.nidn || "",
      nip: account.nip || "",
      password: "",
      role:
        account.mainRole === "tata_usaha"
          ? "staf_tu"
          : account.mainRole === "admin"
          ? "admin"
          : account.mainRole,
      programStudi: account.programStudi,
      programStudiId: account.programStudiId || "",
      jurusanId: account.jurusanId || "",
    });
    setUsernameError("");
    setNipError("");
    setNidnError("");
    setPasswordError("");
    setGeneralError("");
    setShowPassword(false);
    setShowEditDialog(true);
  };

  const checkUsernameAvailability = (username: string, excludeId?: string) => {
    const exists = accounts.some(
      (acc) => acc.username === username && acc.id !== excludeId
    );
    if (exists) {
      setUsernameError("Email ini sudah digunakan");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      toast.error("Semua field wajib diisi");
      return;
    }
    if (formData.password.length < 8) {
      setPasswordError("Password minimal 8 karakter");
      return;
    }
    setSubmitMode("add");
    setShowSubmitConfirm(true);
  };

  const confirmSubmitAdd = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    setUsernameError("");
    setNipError("");
    setNidnError("");
    setGeneralError("");
    const token = localStorage.getItem("token");
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(`Akun ${formData.name} berhasil dibuat.`);
        setShowAddDialog(false);
        fetchUsers();
        navigate('/manage-accounts');
      } else {
        if (response.status === 409) {
          const msg = result.error || "";
          const lower = msg.toLowerCase();
          const hasFieldError =
            lower.includes("email") || lower.includes("nip") || lower.includes("nidn");
          if (lower.includes("email")) setUsernameError(msg);
          if (lower.includes("nip")) setNipError(msg);
          if (lower.includes("nidn")) setNidnError(msg);
          if (!hasFieldError) {
            setGeneralError(msg);
            toast.error(msg);
          }
        } else {
          toast.error(result.error || "Gagal membuat akun");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = () => {
    let hasError = false;
    if (!selectedAccount || !formData.name || !formData.role) {
      toast.error("Field yang wajib tidak boleh kosong");
      return;
    }
    if (formData.role === "dosen" || formData.role === "staf_tu") {
      if (!formData.nip.trim()) {
        setNipError("NIP wajib diisi");
        hasError = true;
      }
    }
    if (formData.role === "dosen" && !formData.nidn.trim()) {
      setNidnError("NIDN wajib diisi");
      hasError = true;
    }
    if (formData.password && formData.password.length < 8) {
      setPasswordError("Password minimal 8 karakter");
      hasError = true;
    }
    if (hasError) return;
    setSubmitMode("edit");
    setShowSubmitConfirm(true);
  };

  const confirmSubmitEdit = async () => {
    if (!selectedAccount) return;
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    setNipError("");
    setNidnError("");
    setPasswordError("");
    setGeneralError("");

    const MOCK_MODE = localStorage.getItem("VITE_MOCK_API") === "true";
    if (MOCK_MODE) {
      const updatedAccount: Account = {
        ...selectedAccount,
        name: formData.name,
        nip: formData.nip || selectedAccount.nip,
        nidn: formData.nidn || selectedAccount.nidn,
      };
      const mockData = JSON.parse(
        localStorage.getItem("MOCK_ACCOUNTS") || "[]"
      );
      const idx = mockData.findIndex(
        (a: any) => a.id === selectedAccount.id
      );
      if (idx >= 0) mockData[idx] = updatedAccount;
      else mockData.push(updatedAccount);
      localStorage.setItem("MOCK_ACCOUNTS", JSON.stringify(mockData));
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === selectedAccount.id ? updatedAccount : a
        )
      );
      toast.success(`Akun ${formData.name} berhasil diperbarui. (Mock Mode)`);
      setShowEditDialog(false);
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const payload: any = {
        nama: formData.name,
        nip: formData.nip,
        nidn: formData.nidn,
        program_studi_id: formData.programStudiId || undefined,
        jurusan_id: formData.jurusanId || undefined,
      };
      if (formData.password) payload.password = formData.password;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedAccount.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(`Akun ${formData.name} berhasil diperbarui.`);
        setNipError("");
        setNidnError("");
        setPasswordError("");
        setGeneralError("");
        setShowEditDialog(false);
        fetchUsers();
      } else {
        if (response.status === 409) {
          const msg = result.error || "";
          const lower = msg.toLowerCase();
          const hasFieldError =
            lower.includes("nip") || lower.includes("nidn");
          if (lower.includes("nip")) setNipError(msg);
          if (lower.includes("nidn")) setNidnError(msg);
          if (!hasFieldError) {
            setGeneralError(msg);
            toast.error(msg);
          }
        } else {
          toast.error(result.error || "Gagal memperbarui akun");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setShowDeactivateDialog(false);
    toast.info("Fitur kelola status akun akan segera hadir.");
  };

const filterSelects = (
        <>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[160px]">
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
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterJurusan}
            onValueChange={(val) => {
              setFilterJurusan(val);
              setFilterProdi("all");
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {jurusans.map((j: any) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.nama_jurusan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterProdi} onValueChange={setFilterProdi}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Program Studi" />
            </SelectTrigger>
            <SelectContent>
              {prodis
                .filter(
                  (p: any) =>
                    !formData.jurusanId ||
                    p.jurusan_id === filterJurusan
                )
                .map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama_prodi}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </>
      );

  return (
    <MainLayout
      title="Manajemen Akun Pengguna"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Manajemen Akun" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Manajemen Akun Pengguna"
          description="Kelola akun pengguna sistem portofolio"
        >
          <RippleButton onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Akun
          </RippleButton>
        </PageHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 sm:w-auto w-full"
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filter
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 sm:w-auto w-full"
              >
                <X className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>

<AnimatePresence>
       {showFilters && (
         <motion.div
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: "auto" }}
           exit={{ opacity: 0, height: 0 }}
           transition={{ duration: 0.2 }}
           className="overflow-hidden"
         >
           <div className="pt-1 pb-2 flex flex-col sm:flex-row sm:justify-end sm:space-x-2 flex-wrap gap-3">
             {filterSelects}
           </div>
         </motion.div>
       )}
     </AnimatePresence>
        </div>

        {/* Table */}
        <motion.div
          layout
          className="border rounded-xl bg-card overflow-x-auto"
        >
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <EmptyState
              icon={<Users className="w-10 h-10" />}
              title="Tidak ada data"
              description={
                hasActiveFilters
                  ? "Tidak ada akun yang sesuai dengan filter"
                  : "Belum ada akun pengguna"
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
                {filteredAccounts.map((account) => (
                  <Card key={account.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {account.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {account.name}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[130px]">
                                <DropdownMenuItem onClick={() => openEditDialog(account)}>
                                  <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowDeactivateDialog(true);
                                  }}
                                >
                                  <Power className="w-3.5 h-3.5 mr-2" />{" "}
                                  {account.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {account.roles.map((r) => (
                              <RoleBadge key={r} role={r} />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {account.username}
                            </code>
                            <StatusBadge status={account.status} animated />
                          </div>
                          {account.programStudi && (
                            <p className="text-xs text-muted-foreground truncate">
                              {account.programStudi}
                            </p>
                          )}
                          {account.lastLogin && (
                            <p className="text-xs text-muted-foreground">
                              Login: {account.lastLogin}
                            </p>
                          )}
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
                    <col className="w-12" />
                    <col className="w-1/5" />
                    <col className="w-1/5" />
                    <col className="w-24" />
                    <col className="w-1/6" />
                    <col className="w-24" />
                    <col className="w-1/6" />
                    <col className="w-20" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead className="w-[26%]">Nama Lengkap</TableHead>
                      <TableHead className="w-[16%]">Email</TableHead>
                      <TableHead className="w-[14%]">Role</TableHead>
                      <TableHead className="w-[16%]">Program Studi</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[130px]">Terakhir Login</TableHead>
                      <TableHead className="w-[70px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account, index) => (
                      <AnimatedTableRow key={account.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="truncate cursor-default">
                                {account.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>{account.name}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {account.username}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {account.roles.map((r) => (
                              <RoleBadge key={r} role={r} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {account.programStudi}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={account.status} animated />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {account.lastLogin}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(account)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowDeactivateDialog(true);
                              }}
                              className="h-8 w-8"
                            >
                              <Power
                                className={cn(
                                  "w-4 h-4",
                                  account.status === "active"
                                    ? "text-destructive"
                                    : "text-success"
                                )}
                              />
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

        {!isLoading && filteredAccounts.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Menampilkan {filteredAccounts.length} dari {accounts.length} akun
          </motion.p>
        )}
      </motion.div>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4 sm:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Tambah Akun Pengguna</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk membuat akun baru
              </DialogDescription>
            </DialogHeader>
          </motion.div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {generalError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-sm text-destructive">
                {generalError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-name">Nama Lengkap *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                  setUsernameError("");
                }}
                onBlur={() =>
                  formData.username &&
                  checkUsernameAvailability(formData.username)
                }
                placeholder="Masukkan email"
                className={cn(usernameError && "border-destructive")}
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role: value,
                    programStudiId: "",
                    jurusanId: "",
                  })
                }
              >
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

            {(formData.role === "dosen" || formData.role === "staf_tu") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="add-nip">NIP *</Label>
                <Input
                  id="add-nip"
                  value={formData.nip}
                  onChange={(e) => {
                    setFormData({ ...formData, nip: e.target.value });
                    setNipError("");
                  }}
                  placeholder="Masukkan NIP"
                  className={cn(nipError && "border-destructive")}
                />
                {nipError && (
                  <p className="text-sm text-destructive">{nipError}</p>
                )}
              </motion.div>
            )}

            {formData.role === "dosen" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="add-nidn">NIDN *</Label>
                <Input
                  id="add-nidn"
                  value={formData.nidn}
                  onChange={(e) => {
                    setFormData({ ...formData, nidn: e.target.value });
                    setNidnError("");
                  }}
                  placeholder="Masukkan NIDN"
                  className={cn(nidnError && "border-destructive")}
                />
                {nidnError && (
                  <p className="text-sm text-destructive">{nidnError}</p>
                )}
              </motion.div>
            )}

            {formData.role === "dosen" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="add-jurusan">Jurusan *</Label>
                <Select
                  value={formData.jurusanId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      jurusanId: value,
                      programStudiId: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nama_jurusan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {formData.role === "dosen" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="add-prodi">Program Studi *</Label>
                <Select
                  value={formData.programStudiId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programStudiId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prodi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodis
                      .filter(
                        (p: any) =>
                          !formData.jurusanId ||
                          p.jurusan_id === formData.jurusanId
                      )
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama_prodi}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-password">Password Awal *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError("");
                  }}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            {formData.role === "staf_tu" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="add-jurusan-tu">Jurusan *</Label>
                <Select
                  value={formData.jurusanId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jurusanId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nama_jurusan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <RippleButton onClick={handleSubmitAdd} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Simpan
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4 sm:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Edit Akun — {selectedAccount?.name}</DialogTitle>
            </DialogHeader>
          </motion.div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {generalError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-sm text-destructive">
                {generalError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            {(formData.role === "dosen" || formData.role === "staf_tu") && (
              <div className="space-y-2">
                <Label htmlFor="edit-nip">NIP *</Label>
                <Input
                  id="edit-nip"
                  value={formData.nip}
                  onChange={(e) => {
                    setFormData({ ...formData, nip: e.target.value });
                    setNipError("");
                  }}
                  className={cn(nipError && "border-destructive")}
                />
                {nipError && (
                  <p className="text-sm text-destructive">{nipError}</p>
                )}
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
              <p className="text-xs text-muted-foreground">
                Role tidak dapat diubah
              </p>
            </div>

            {formData.role === "dosen" && (
              <div className="space-y-2">
                <Label htmlFor="edit-nidn">NIDN *</Label>
                <Input
                  id="edit-nidn"
                  value={formData.nidn}
                  onChange={(e) => {
                    setFormData({ ...formData, nidn: e.target.value });
                    setNidnError("");
                  }}
                  placeholder="Masukkan NIDN"
                  className={cn(nidnError && "border-destructive")}
                />
                {nidnError && (
                  <p className="text-sm text-destructive">{nidnError}</p>
                )}
              </div>
            )}

            {formData.role === "dosen" && (
              <div className="space-y-2">
                <Label htmlFor="edit-jurusan">Jurusan *</Label>
                <Select
                  value={formData.jurusanId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      jurusanId: value,
                      programStudiId: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nama_jurusan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === "dosen" && (
              <div className="space-y-2">
                <Label htmlFor="edit-prodi">Program Studi *</Label>
                <Select
                  value={formData.programStudiId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programStudiId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prodi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodis
                      .filter(
                        (p: any) =>
                          !formData.jurusanId ||
                          p.jurusan_id === formData.jurusanId
                      )
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama_prodi}
                        </SelectItem>
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
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError("");
                  }}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <RippleButton onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Simpan
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Submit */}
      <ConfirmDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Konfirmasi Simpan"
        description={
          submitMode === "add"
            ? `Apakah Anda yakin ingin membuat akun ${formData.name} (${formData.username})?`
            : `Apakah Anda yakin ingin menyimpan perubahan untuk akun ${formData.name}?`
        }
        confirmLabel={submitMode === "add" ? "Buat Akun" : "Simpan Perubahan"}
        variant="default"
        onConfirm={submitMode === "add" ? confirmSubmitAdd : confirmSubmitEdit}
        loading={isSubmitting}
      />

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        title={
          selectedAccount?.status === "active"
            ? "Nonaktifkan Akun?"
            : "Aktifkan Akun?"
        }
        description={
          selectedAccount?.status === "active"
            ? `Akun ${selectedAccount?.name} akan dinonaktifkan. Pengguna ini tidak akan bisa login.`
            : `Akun ${selectedAccount?.name} akan diaktifkan kembali.`
        }
        confirmLabel={
          selectedAccount?.status === "active" ? "Nonaktifkan" : "Aktifkan"
        }
        variant={selectedAccount?.status === "active" ? "destructive" : "default"}
        onConfirm={handleToggleStatus}
      />
    </MainLayout>
  );
}
