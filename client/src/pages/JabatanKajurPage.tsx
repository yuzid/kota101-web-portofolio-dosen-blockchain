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
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Landmark,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Kajur | null>(null);

  const [formData, setFormData] = useState({
    dosen_id: "",
    jurusan_id: "",
    periode_mulai: "",
    periode_selesai: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/jabatan/kajur`;
  const usersUrl = `${import.meta.env.VITE_API_URL}/api/admin/users`;
  const jurusanUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => {
    Promise.all([fetchKajur(), fetchDosens(), fetchJurusans()]);
  }, []);

  const fetchKajur = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setItems(result.data);
      else toast.error(result.error || "Gagal memuat data Kajur");
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDosens = async () => {
    try {
      const [dosenRes, kaprodiRes] = await Promise.all([
        fetch(`${usersUrl}?role=DOSEN`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl.replace("/kajur", "/kaprodi"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const dosenResult = await dosenRes.json();
      const kaprodiResult = await kaprodiRes.json();
      const kaprodiDosenIds = new Set(
        (kaprodiResult.data || []).map((k: any) => k.dosen_id)
      );
      if (dosenResult.status === "success") {
        setDosens(
          dosenResult.data
            .filter((u: any) => !kaprodiDosenIds.has(u.id))
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

  const fetchJurusans = async () => {
    try {
      const res = await fetch(jurusanUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setJurusans(result.data);
    } catch {
      console.error("Gagal memuat data jurusan");
    }
  };

  const filteredItems = items.filter((item) => {
    const dosenName = item.dosen?.nama || "";
    const matchesSearch = dosenName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesJurusan =
      filterJurusan === "all" || item.jurusan_id === filterJurusan;
    return matchesSearch && matchesJurusan;
  });

  const hasActiveFilters = searchTerm !== "" || filterJurusan !== "all";
  const resetFilters = () => {
    setSearchTerm("");
    setFilterJurusan("all");
  };

  const openAddDialog = () => {
    setFormData({
      dosen_id: "",
      jurusan_id: "",
      periode_mulai: "",
      periode_selesai: "",
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Kajur) => {
    setSelectedItem(item);
    setFormData({
      dosen_id: item.dosen_id,
      jurusan_id: item.jurusan_id,
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
      !formData.jurusan_id ||
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
        toast.success("Jabatan Kajur berhasil dibuat");
        setShowAddDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || "Gagal membuat jabatan Kajur");
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
      !formData.jurusan_id ||
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
        toast.success("Jabatan Kajur berhasil diperbarui");
        setShowEditDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || "Gagal memperbarui jabatan Kajur");
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
        toast.success("Jabatan Kajur berhasil dihapus");
        setShowDeleteDialog(false);
        fetchKajur();
      } else {
        toast.error(result.error || "Gagal menghapus jabatan Kajur");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDosenName = (id: string) =>
    dosens.find((d) => d.id === id)?.nama || "-";
  const getJurusanName = (id: string) =>
    jurusans.find((j) => j.id === id)?.nama_jurusan || "-";
  const getDosenDetail = (id: string) => {
    const d = dosens.find((d) => d.id === id);
    return d ? `${d.nip || d.nidn || ""}` : "-";
  };

  return (
    <MainLayout
      title="Jabatan Ketua Jurusan (Kajur)"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Jabatan", path: "/admin/jabatan/kajur" },
        { label: "Ketua Jurusan" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Jabatan Ketua Jurusan"
          description="Kelola jabatan Ketua Jurusan — setiap jurusan hanya dapat memiliki satu Kajur aktif"
        >
          <RippleButton onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kajur
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
                    value={filterJurusan}
                    onValueChange={setFilterJurusan}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jurusan</SelectItem>
                      {jurusans.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.nama_jurusan}
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
              icon={<Landmark className="w-10 h-10" />}
              title="Tidak ada data"
              description={
                hasActiveFilters
                  ? "Tidak ada data yang sesuai filter"
                  : "Belum ada data Kajur"
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
                  const jurusanName = item.jurusan?.nama_jurusan || getJurusanName(item.jurusan_id);
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
                                <p className="text-xs text-muted-foreground truncate">{jurusanName}</p>
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
                  <TableHead className="w-[16%]">Jurusan</TableHead>
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
                              {item.jurusan?.nama_jurusan ||
                                getJurusanName(item.jurusan_id)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.jurusan?.nama_jurusan ||
                              getJurusanName(item.jurusan_id)}
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
            Menampilkan {filteredItems.length} dari {items.length} jabatan Kajur
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
              <DialogTitle>Tambah Jabatan Kajur Baru</DialogTitle>
              <DialogDescription>
                Pilih dosen dan tentukan periode jabatan. Satu jurusan hanya
                boleh memiliki satu Kajur aktif.
              </DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-jurusan">Jurusan *</Label>
              <Select
                value={formData.jurusan_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    jurusan_id: v,
                    dosen_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jurusan" />
                </SelectTrigger>
                <SelectContent>
                  {jurusans.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama_jurusan}
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
                  {dosens
                    .filter(
                      (d) =>
                        !formData.jurusan_id ||
                        d.jurusan_id === formData.jurusan_id
                    )
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nama} ({d.nip || d.nidn})
                      </SelectItem>
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
              <DialogTitle>Edit Jabatan Kajur</DialogTitle>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-jurusan">Jurusan *</Label>
              <Select
                value={formData.jurusan_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    jurusan_id: v,
                    dosen_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jurusans.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama_jurusan}
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
                  {dosens
                    .filter(
                      (d) =>
                        !formData.jurusan_id ||
                        d.jurusan_id === formData.jurusan_id
                    )
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nama} ({d.nip || d.nidn})
                      </SelectItem>
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
        title="Hapus Jabatan Kajur?"
        description={
          <>
            Jabatan Kajur untuk{" "}
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
