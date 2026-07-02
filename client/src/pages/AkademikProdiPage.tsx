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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
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
import { PageHeader } from "@/components/ui/page-header";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Prodi | null>(null);

  const [formData, setFormData] = useState({
    kode_prodi: "",
    nama_prodi: "",
    jurusan_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/prodi`;
  const jurusanUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => {
    Promise.all([fetchProdi(), fetchJurusans()]);
  }, []);

  const fetchProdi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setItems(result.data);
      else toast.error(result.error || "Gagal memuat data program studi");
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
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
    const matchesSearch =
      item.nama_prodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_prodi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJurusan =
      filterJurusan === "all" || item.jurusan_id === filterJurusan;
    return matchesSearch && matchesJurusan;
  });

  const hasActiveFilters =
    searchTerm !== "" || filterJurusan !== "all";
  const resetFilters = () => {
    setSearchTerm("");
    setFilterJurusan("all");
  };

  const openAddDialog = () => {
    setFormData({ kode_prodi: "", nama_prodi: "", jurusan_id: "" });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Prodi) => {
    setSelectedItem(item);
    setFormData({
      kode_prodi: item.kode_prodi,
      nama_prodi: item.nama_prodi,
      jurusan_id: item.jurusan_id,
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.kode_prodi || !formData.nama_prodi || !formData.jurusan_id) {
      toast.error("Semua field wajib diisi");
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
        toast.success(
          `Program studi ${formData.nama_prodi} berhasil dibuat`
        );
        setShowAddDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || "Gagal membuat program studi");
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
      !formData.kode_prodi ||
      !formData.nama_prodi ||
      !formData.jurusan_id
    ) {
      toast.error("Semua field wajib diisi");
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
        toast.success(
          `Program studi ${formData.nama_prodi} berhasil diperbarui`
        );
        setShowEditDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || "Gagal memperbarui program studi");
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
        toast.success(
          `Program studi ${selectedItem.nama_prodi} berhasil dihapus`
        );
        setShowDeleteDialog(false);
        fetchProdi();
      } else {
        toast.error(result.error || "Gagal menghapus program studi");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJurusanName = (id: string) =>
    jurusans.find((j) => j.id === id)?.nama_jurusan || "-";

  return (
    <MainLayout
      title="Data Program Studi"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Akademik", path: "/admin/akademik/prodi" },
        { label: "Program Studi" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Data Program Studi"
          description="Kelola data program studi di lingkungan POLBAN"
        >
          <RippleButton onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Prodi
          </RippleButton>
        </PageHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode prodi..."
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
              <TableSkeleton rows={5} cols={4} />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-10 h-10" />}
              title="Tidak ada data"
              description={
                hasActiveFilters
                  ? "Tidak ada data yang sesuai filter"
                  : "Belum ada data program studi"
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
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {item.nama_prodi?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.nama_prodi}</p>
                              <Badge variant="outline" className="text-xs mt-0.5">{item.kode_prodi}</Badge>
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
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2 text-destructive" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Jurusan: {getJurusanName(item.jurusan_id)}
                          </p>
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
                    <col className="w-24" />
                    <col className="w-2/5" />
                    <col className="w-1/3" />
                    <col className="w-20" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead className="w-[80px]">Kode</TableHead>
                      <TableHead className="w-[26%]">Nama Program Studi</TableHead>
                      <TableHead className="w-[16%]">Jurusan</TableHead>
                      <TableHead className="w-[70px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <AnimatedTableRow key={item.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.kode_prodi}</Badge>
                        </TableCell>
                        <TableCell className="w-[26%] font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-default">
                                {item.nama_prodi}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{item.nama_prodi}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getJurusanName(item.jurusan_id)}
                          </Badge>
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
                    ))}
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
            Menampilkan {filteredItems.length} dari {items.length} program studi
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
              <DialogTitle>Tambah Program Studi Baru</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk menambah prodi baru
              </DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-kode">Kode Program Studi *</Label>
              <Input
                id="add-kode"
                value={formData.kode_prodi}
                onChange={(e) =>
                  setFormData({ ...formData, kode_prodi: e.target.value })
                }
                placeholder="Contoh: D3-TI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Program Studi *</Label>
              <Input
                id="add-nama"
                value={formData.nama_prodi}
                onChange={(e) =>
                  setFormData({ ...formData, nama_prodi: e.target.value })
                }
                placeholder="Contoh: D3 Teknik Informatika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-jurusan">Jurusan *</Label>
              <Select
                value={formData.jurusan_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, jurusan_id: v })
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
              <DialogTitle>
                Edit Program Studi — {selectedItem?.kode_prodi}
              </DialogTitle>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-kode">Kode Program Studi *</Label>
              <Input
                id="edit-kode"
                value={formData.kode_prodi}
                onChange={(e) =>
                  setFormData({ ...formData, kode_prodi: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Program Studi *</Label>
              <Input
                id="edit-nama"
                value={formData.nama_prodi}
                onChange={(e) =>
                  setFormData({ ...formData, nama_prodi: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jurusan">Jurusan *</Label>
              <Select
                value={formData.jurusan_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, jurusan_id: v })
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
        title="Hapus Program Studi?"
        description={
          <>
            Program studi <strong>{selectedItem?.nama_prodi}</strong> (
            {selectedItem?.kode_prodi}) akan dihapus permanen. Program studi
            yang masih memiliki dosen tidak dapat dihapus.
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
