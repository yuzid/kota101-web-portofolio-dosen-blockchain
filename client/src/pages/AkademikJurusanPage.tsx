import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
import { Input } from "../components/ui/input";
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
import { Plus, Search, Edit, Trash2, X, Loader2, Landmark, Building2, MoreVertical } from "lucide-react";
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

interface Jurusan {
  id: string;
  kode_jurusan: string;
  nama_jurusan: string;
  program_studi?: { id: string; kode_prodi: string; nama_prodi: string }[];
}

export function AkademikJurusanPage() {
  const [items, setItems] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Jurusan | null>(null);
  const [formData, setFormData] = useState({
    kode_jurusan: "",
    nama_jurusan: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/admin/akademik/jurusan`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setItems(result.data);
      else toast.error(result.error || "Gagal memuat data jurusan");
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nama_jurusan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_jurusan.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasActiveFilters = searchTerm !== "";
  const resetFilters = () => setSearchTerm("");

  const openAddDialog = () => {
    setFormData({ kode_jurusan: "", nama_jurusan: "" });
    setShowAddDialog(true);
  };

  const openEditDialog = (item: Jurusan) => {
    setSelectedItem(item);
    setFormData({
      kode_jurusan: item.kode_jurusan,
      nama_jurusan: item.nama_jurusan,
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.kode_jurusan || !formData.nama_jurusan) {
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
        toast.success(`Jurusan ${formData.nama_jurusan} berhasil dibuat`);
        setShowAddDialog(false);
        fetchData();
      } else {
        toast.error(result.error || "Gagal membuat jurusan");
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
      !formData.kode_jurusan ||
      !formData.nama_jurusan
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
          `Jurusan ${formData.nama_jurusan} berhasil diperbarui`
        );
        setShowEditDialog(false);
        fetchData();
      } else {
        toast.error(result.error || "Gagal memperbarui jurusan");
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
          `Jurusan ${selectedItem.nama_jurusan} berhasil dihapus`
        );
        setShowDeleteDialog(false);
        fetchData();
      } else {
        toast.error(result.error || "Gagal menghapus jurusan");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      title="Data Jurusan"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Akademik", path: "/admin/akademik/jurusan" },
        { label: "Jurusan" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Data Jurusan"
          description="Kelola data jurusan di lingkungan POLBAN"
        >
          <RippleButton onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jurusan
          </RippleButton>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau kode jurusan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
              <X className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>

        <motion.div layout className="border rounded-xl bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={4} />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-10 h-10" />}
              title="Tidak ada data"
              description={
                searchTerm
                  ? "Tidak ada jurusan yang sesuai pencarian"
                  : "Belum ada data jurusan"
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Pencarian
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
                            {item.nama_jurusan?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.nama_jurusan}</p>
                              <Badge variant="outline" className="text-xs mt-0.5">{item.kode_jurusan}</Badge>
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
                          {item.program_studi && item.program_studi.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.program_studi.map((ps) => (
                                <Badge key={ps.id} variant="secondary" className="text-xs">
                                  {ps.nama_prodi}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {(!item.program_studi || item.program_studi.length === 0) && (
                            <p className="text-xs text-muted-foreground">Tidak ada program studi</p>
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
                    <col className="w-24" />
                    <col className="w-2/5" />
                    <col className="w-1/3" />
                    <col className="w-20" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead className="w-[80px]">Kode</TableHead>
                      <TableHead className="w-[26%]">Nama Jurusan</TableHead>
                      <TableHead className="w-[16%]">Program Studi</TableHead>
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
                          <Badge variant="outline">{item.kode_jurusan}</Badge>
                        </TableCell>
                        <TableCell className="w-[26%] font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-default">
                                {item.nama_jurusan}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{item.nama_jurusan}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {item.program_studi &&
                          item.program_studi.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.program_studi.map((ps) => (
                                <Badge
                                  key={ps.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {ps.nama_prodi}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
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
            Menampilkan {filteredItems.length} dari {items.length} jurusan
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
              <DialogTitle>Tambah Jurusan Baru</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk menambah jurusan baru
              </DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-kode">Kode Jurusan *</Label>
              <Input
                id="add-kode"
                value={formData.kode_jurusan}
                onChange={(e) =>
                  setFormData({ ...formData, kode_jurusan: e.target.value })
                }
                placeholder="Contoh: JTK"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Jurusan *</Label>
              <Input
                id="add-nama"
                value={formData.nama_jurusan}
                onChange={(e) =>
                  setFormData({ ...formData, nama_jurusan: e.target.value })
                }
                placeholder="Contoh: Jurusan Teknik Komputer dan Informatika"
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>
                Edit Jurusan — {selectedItem?.kode_jurusan}
              </DialogTitle>
            </DialogHeader>
          </motion.div>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-kode">Kode Jurusan *</Label>
              <Input
                id="edit-kode"
                value={formData.kode_jurusan}
                onChange={(e) =>
                  setFormData({ ...formData, kode_jurusan: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Jurusan *</Label>
              <Input
                id="edit-nama"
                value={formData.nama_jurusan}
                onChange={(e) =>
                  setFormData({ ...formData, nama_jurusan: e.target.value })
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
        title="Hapus Jurusan?"
        description={
          <>
            Jurusan <strong>{selectedItem?.nama_jurusan}</strong> (
            {selectedItem?.kode_jurusan}) akan dihapus permanen.
            {selectedItem?.program_studi &&
              selectedItem.program_studi.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Jurusan ini memiliki {selectedItem.program_studi.length}{" "}
                  program studi. Hapus program studi terlebih dahulu sebelum
                  menghapus jurusan.
                </span>
              )}
          </>
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
        disabled={
          selectedItem?.program_studi
            ? selectedItem.program_studi.length > 0
            : false
        }
        loading={isSubmitting}
      />
    </MainLayout>
  );
}
