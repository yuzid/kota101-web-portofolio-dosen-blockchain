import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
import { Input } from "../components/ui/input";
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  GraduationCap,
  Filter,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

interface Dosen {
  id: string;
  nama: string;
  nip: string;
  nidn: string;
  program_studi_id?: string;
  jurusan_id?: string;
}

interface Prodi {
  id: string;
  kode_prodi: string;
  nama_prodi: string;
  jurusan_id: string;
  jurusan?: { id: string; kode_jurusan: string; nama_jurusan: string };
}

interface Kaprodi {
  id: string;
  dosen_id: string;
  program_studi_id: string;
  periode_mulai: string;
  periode_selesai: string;
  dosen?: { nama: string; nip: string; nidn: string };
  program_studi?: { id: string; kode_prodi: string; nama_prodi: string };
}

function isActive(periodeMulai: string, periodeSelesai: string): boolean {
  const now = new Date();
  const start = new Date(periodeMulai);
  const end = new Date(periodeSelesai);
  return now >= start && now <= end;
}

export function JabatanKaprodiPage() {
  const [items, setItems] = useState<Kaprodi[]>([]);
  const [dosens, setDosens] = useState<Dosen[]>([]);
  const [prodis, setProdis] = useState<Prodi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProdi, setFilterProdi] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Kaprodi | null>(null);

  const [formData, setFormData] = useState({
    dosen_id: "",
    program_studi_id: "",
    periode_mulai: "",
    periode_selesai: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/jabatan/kaprodi`;
  const usersUrl = `${import.meta.env.VITE_API_URL}/api/admin/users`;
  const prodiUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`;

  useEffect(() => {
    Promise.all([fetchKaprodi(), fetchDosens(), fetchProdis()]);
  }, []);

  const fetchKaprodi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setItems(result.data);
      else toast.error(result.error || "Gagal memuat data Kaprodi");
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDosens = async () => {
    try {
      const [dosenRes, kajurRes] = await Promise.all([
        fetch(`${usersUrl}?role=DOSEN`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl.replace("/kaprodi", "/kajur"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const dosenResult = await dosenRes.json();
      const kajurResult = await kajurRes.json();
      const kajurDosenIds = new Set(
        (kajurResult.data || []).map((k: any) => k.dosen_id)
      );
      if (dosenResult.status === "success") {
        setDosens(
          dosenResult.data
            .filter((u: any) => !kajurDosenIds.has(u.id))
            .map((u: any) => ({
              id: u.id,
              nama: u.dosen?.nama || u.email,
              nip: u.dosen?.nip || "",
              nidn: u.dosen?.nidn || "",
              program_studi_id: u.dosen?.program_studi?.id || "",
              jurusan_id: u.dosen?.program_studi?.jurusan_id || "",
            }))
        );
      }
    } catch {
      console.error("Gagal memuat data dosen");
    }
  };

  const fetchProdis = async () => {
    try {
      const res = await fetch(prodiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setProdis(result.data);
    } catch {
      console.error("Gagal memuat data program studi");
    }
  };

  const filteredItems = items.filter((item) => {
    const dosenName = item.dosen?.nama || "";
    const matchesSearch = dosenName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProdi =
      filterProdi === "all" || item.program_studi_id === filterProdi;
    return matchesSearch && matchesProdi;
  });

  const hasActiveFilters = searchTerm !== "" || filterProdi !== "all";
  const resetFilters = () => {
    setSearchTerm("");
    setFilterProdi("all");
  };

  const openAddDialog = () => {
    setFormData({
      dosen_id: "",
      program_studi_id: "",
      periode_mulai: "",
      periode_selesai: "",
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Kaprodi) => {
    setSelectedItem(item);
    setFormData({
      dosen_id: item.dosen_id,
      program_studi_id: item.program_studi_id,
      periode_mulai: item.periode_mulai
        ? format(new Date(item.periode_mulai), "yyyy-MM-dd")
        : "",
      periode_selesai: item.periode_selesai
        ? format(new Date(item.periode_selesai), "yyyy-MM-dd")
        : "",
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (
      !formData.dosen_id ||
      !formData.program_studi_id ||
      !formData.periode_mulai ||
      !formData.periode_selesai
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }
    if (new Date(formData.periode_selesai) <= new Date(formData.periode_mulai)) {
      toast.error("Periode selesai harus setelah periode mulai");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Jabatan Kaprodi berhasil dibuat");
        setShowAddDialog(false);
        fetchKaprodi();
      } else {
        toast.error(result.error || "Gagal membuat jabatan Kaprodi");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (
      !selectedItem ||
      !formData.dosen_id ||
      !formData.program_studi_id ||
      !formData.periode_mulai ||
      !formData.periode_selesai
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }
    if (new Date(formData.periode_selesai) <= new Date(formData.periode_mulai)) {
      toast.error("Periode selesai harus setelah periode mulai");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Jabatan Kaprodi berhasil diperbarui");
        setShowEditDialog(false);
        fetchKaprodi();
      } else {
        toast.error(result.error || "Gagal memperbarui jabatan Kaprodi");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/${selectedItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Jabatan Kaprodi berhasil dihapus");
        setShowDeleteDialog(false);
        fetchKaprodi();
      } else {
        toast.error(result.error || "Gagal menghapus jabatan Kaprodi");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDosenName = (id: string) =>
    dosens.find((d) => d.id === id)?.nama || "-";
  const getProdiName = (id: string) =>
    prodis.find((p) => p.id === id)?.nama_prodi || "-";
  const getDosenDetail = (id: string) => {
    const d = dosens.find((d) => d.id === id);
    return d ? `${d.nip || d.nidn || ""}` : "-";
  };

  return (
    <MainLayout
      title="Jabatan Ketua Program Studi (Kaprodi)"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Jabatan", path: "/admin/jabatan/kaprodi" },
        { label: "Ketua Prodi" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Jabatan Ketua Program Studi"
          description="Kelola jabatan Ketua Program Studi — setiap prodi hanya dapat memiliki satu Kaprodi aktif"
        >
          <RippleButton onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kaprodi
          </RippleButton>
        </PageHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama dosen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filter
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9"
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
                <div className="pt-1 pb-2 flex flex-wrap gap-3">
                  <Select
                    value={filterProdi}
                    onValueChange={setFilterProdi}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Program Studi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Prodi</SelectItem>
                      {prodis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama_prodi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div layout className="border rounded-xl bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-10 h-10" />}
              title="Tidak ada data"
              description={
                hasActiveFilters
                  ? "Tidak ada data yang sesuai filter"
                  : "Belum ada data Kaprodi"
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
                {filteredItems.map((item) => {
                  const active = isActive(item.periode_mulai, item.periode_selesai);
                  const dosenName = item.dosen?.nama || getDosenName(item.dosen_id);
                  const prodiName = item.program_studi?.nama_prodi || getProdiName(item.program_studi_id);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {dosenName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{dosenName}</p>
                                <p className="text-xs text-muted-foreground truncate">{prodiName}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[130px]">
                                  <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                    <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedItem(item); setShowDeleteDialog(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-destructive" /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{item.dosen?.nip || getDosenDetail(item.dosen_id)}</span>
                              <StatusBadge status={active ? "active" : "inactive"} animated />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.periode_mulai ? format(new Date(item.periode_mulai), "dd/MM/yyyy") : "-"}
                              {" → "}
                              {item.periode_selesai ? format(new Date(item.periode_selesai), "dd/MM/yyyy") : "-"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <AnimatedTable className="table-fixed">
              <colgroup>
                <col className="w-12" />
                <col className="w-1/6" />
                <col className="w-1/5" />
                <col className="w-1/6" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-20" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead className="w-[16%]">Program Studi</TableHead>
                  <TableHead className="w-[26%]">Nama Dosen</TableHead>
                  <TableHead className="w-[16%]">NIP / NIDN</TableHead>
                  <TableHead className="w-[130px]">Periode Mulai</TableHead>
                  <TableHead className="w-[130px]">Periode Selesai</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[70px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => {
                  const active = isActive(
                    item.periode_mulai,
                    item.periode_selesai
                  );
                  return (
                    <AnimatedTableRow key={item.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="w-[16%]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate cursor-default">
                              {item.program_studi?.nama_prodi ||
                                getProdiName(item.program_studi_id)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.program_studi?.nama_prodi ||
                              getProdiName(item.program_studi_id)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="w-[26%] font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate cursor-default">
                              {item.dosen?.nama ||
                                getDosenName(item.dosen_id)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.dosen?.nama ||
                              getDosenName(item.dosen_id)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.dosen?.nip ||
                          getDosenDetail(item.dosen_id)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.periode_mulai
                          ? format(
                              new Date(item.periode_mulai),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.periode_selesai
                          ? format(
                              new Date(item.periode_selesai),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={active ? "active" : "inactive"}
                          animated
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeleteDialog(true);
                            }}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })}
              </TableBody>
            </AnimatedTable>
              </div>
            </>
          )}
        </motion.div>

        {!isLoading && filteredItems.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Menampilkan {filteredItems.length} dari {items.length} jabatan
            Kaprodi
          </motion.p>
        )}
      </motion.div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Tambah Jabatan Kaprodi Baru</DialogTitle>
              <DialogDescription>
                Pilih dosen dan tentukan periode jabatan. Satu prodi hanya boleh
                memiliki satu Kaprodi aktif.
              </DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-prodi">Program Studi *</Label>
              <Select
                value={formData.program_studi_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    program_studi_id: v,
                    dosen_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih prodi" />
                </SelectTrigger>
                <SelectContent>
                  {prodis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama_prodi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-dosen">Dosen *</Label>
              <Select
                value={formData.dosen_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, dosen_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  {formData.program_studi_id
                    ? dosens
                        .filter(
                          (d) =>
                            d.program_studi_id ===
                            formData.program_studi_id
                        )
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nama} ({d.nip || d.nidn})
                          </SelectItem>
                        ))
                    : null}
                  {!formData.program_studi_id && (
                    <SelectItem value="__placeholder__" disabled>
                      Pilih prodi terlebih dahulu
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-mulai">Periode Mulai *</Label>
              <Input
                id="add-mulai"
                type="date"
                value={formData.periode_mulai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periode_mulai: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-selesai">Periode Selesai *</Label>
              <Input
                id="add-selesai"
                type="date"
                value={formData.periode_selesai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periode_selesai: e.target.value,
                  })
                }
              />
            </div>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Edit Jabatan Kaprodi</DialogTitle>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-prodi">Program Studi *</Label>
              <Select
                value={formData.program_studi_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    program_studi_id: v,
                    dosen_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prodis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama_prodi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dosen">Dosen *</Label>
              <Select
                value={formData.dosen_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, dosen_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.program_studi_id
                    ? dosens
                        .filter(
                          (d) =>
                            d.program_studi_id ===
                            formData.program_studi_id
                        )
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nama} ({d.nip || d.nidn})
                          </SelectItem>
                        ))
                    : null}
                  {!formData.program_studi_id && (
                    <SelectItem value="__placeholder__" disabled>
                      Pilih prodi terlebih dahulu
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mulai">Periode Mulai *</Label>
              <Input
                id="edit-mulai"
                type="date"
                value={formData.periode_mulai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periode_mulai: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-selesai">Periode Selesai *</Label>
              <Input
                id="edit-selesai"
                type="date"
                value={formData.periode_selesai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periode_selesai: e.target.value,
                  })
                }
              />
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Jabatan Kaprodi?"
        description={
          <>
            Jabatan Kaprodi untuk{" "}
            <strong>
              {selectedItem?.dosen?.nama || "dosen terpilih"}
            </strong>{" "}
            akan dihapus. Pastikan tidak ada jabatan aktif lain yang bergantung
            pada data ini.
          </>
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isSubmitting}
      />
    </MainLayout>
  );
}
