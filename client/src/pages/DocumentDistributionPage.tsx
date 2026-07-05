import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  Upload,
  Search,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  Send,
  FilterX,
  Tag,
  FileWarning,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  UserPlus,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { getAllJenisDokumen } from "@/lib/utils";

interface DistribusiItem {
  id: string;
  dosen_id: string;
  status: string;
  tanggal_distribusi: string;
  tanggal_keputusan: string | null;
  dosen: { nama: string; nip: string; nidn: string };
  kepemilikan: { id: string } | null;
}

interface Document {
  id: string;
  nama: string;
  jenis_dokumen: string;
  tanggal_upload: string;
  file_path: string;
  sumber_dokumen: string;
  status?: string;
  distribusi: DistribusiItem[];
}

interface Dosen {
  id: string;
  nama: string;
  nip: string;
  program_studi?: { id: string; nama_prodi: string };
}

const jenisColorMap: Record<string, string> = {
  SURAT_KEPUTUSAN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SURAT_TUGAS: "bg-blue-100 text-blue-800 border-blue-200",
  KONTRAK_PENELITIAN: "bg-teal-100 text-teal-800 border-teal-200",
  LAPORAN: "bg-amber-100 text-amber-800 border-amber-200",
  LEMBAR_PENGESAHAN: "bg-purple-100 text-purple-800 border-purple-200",
  SERTIFIKAT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FOTO: "bg-pink-100 text-pink-800 border-pink-200",
  BUKTI_PENDUKUNG_LAIN: "bg-gray-100 text-gray-800 border-gray-200",
};

export function DocumentDistributionPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDosen, setAllDosen] = useState<Dosen[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const [selectedProdiId, setSelectedProdiId] = useState<string>("all");
  const [showNewJenisInput, setShowNewJenisInput] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    file: null as File | null,
    recipients: [] as string[],
  });

  const token = localStorage.getItem("token");

  // ── Filter state ──
  const [searchTerm, setSearchTerm] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resDosen = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataDosen = await resDosen.json();
      if (dataDosen.status === "success") {
        const listDosen = dataDosen.data
          .filter((u: any) => u.dosen !== null)
          .map((u: any) => ({
            id: u.id,
            nama: u.dosen.nama,
            nip: u.dosen.nip,
            program_studi: u.dosen.program_studi,
          }));
        setAllDosen(listDosen);
      }
      const resDocs = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataDocs = await resDocs.json();
      setDocuments(dataDocs.status === "success" ? dataDocs.data : []);
    } catch {
      toast.error("Gagal memuat data dari server.");
    }
  };

  // ── Computed ──
  const stats = useMemo(() => ({
    total: documents.length,
    terdistribusi: documents.filter(d => d.distribusi && d.distribusi.length > 0).length,
    belumDistribusi: documents.filter(d => !d.distribusi || d.distribusi.length === 0).length,
    jenisUnik: new Set(documents.map(d => d.jenis_dokumen)).size,
  }), [documents]);

  const uniqueJenis = useMemo(
    () => [...new Set(documents.map(d => d.jenis_dokumen))],
    [documents]
  );

  const hasActiveFilter = searchTerm || jenisFilter || statusFilter || sortBy !== "terbaru";

  const filteredDocuments = useMemo(() => {
    let result = [...documents];
    if (searchTerm) result = result.filter(d => d.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    if (jenisFilter) result = result.filter(d => d.jenis_dokumen === jenisFilter);
    if (statusFilter === "terdistribusi") result = result.filter(d => d.distribusi && d.distribusi.length > 0);
    if (statusFilter === "belum") result = result.filter(d => !d.distribusi || d.distribusi.length === 0);
    switch (sortBy) {
      case "terlama": result.sort((a, b) => new Date(a.tanggal_upload).getTime() - new Date(b.tanggal_upload).getTime()); break;
      case "a-z": result.sort((a, b) => a.nama.localeCompare(b.nama)); break;
      case "z-a": result.sort((a, b) => b.nama.localeCompare(a.nama)); break;
      default: result.sort((a, b) => new Date(b.tanggal_upload).getTime() - new Date(a.tanggal_upload).getTime());
    }
    return result;
  }, [documents, searchTerm, jenisFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredDocuments.length / pageSize);
  const paginatedDocs = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearchTerm("");
    setJenisFilter("");
    setStatusFilter("");
    setSortBy("terbaru");
    setCurrentPage(1);
  };

  // ── Upload / Recipient logic ──
  const uniqueProdis = useMemo(
    () => Array.from(new Map(allDosen.filter(d => d.program_studi).map(d => [d.program_studi!.id, d.program_studi])).values()),
    [allDosen]
  );

  const filteredDosenByProdi = allDosen.filter(d => selectedProdiId === "all" || d.program_studi?.id === selectedProdiId);
  const searchedDosen = filteredDosenByProdi.filter(d => d.nama.toLowerCase().includes(recipientSearch.toLowerCase()));

  const sortedDosen = useMemo(() => {
    const selected = new Set(uploadForm.recipients);
    const withSelected = searchedDosen.filter(d => selected.has(d.id));
    const withoutSelected = searchedDosen.filter(d => !selected.has(d.id));
    return [...withSelected, ...withoutSelected];
  }, [searchedDosen, uploadForm.recipients]);

  const toggleRecipient = (dosenId: string) => {
    setUploadForm(prev => ({
      ...prev,
      recipients: prev.recipients.includes(dosenId)
        ? prev.recipients.filter(id => id !== dosenId)
        : [...prev.recipients, dosenId],
    }));
  };

  const handleDistribute = () => {
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.file) {
      toast.error("Nama, Jenis, dan File dokumen wajib diisi!"); return;
    }
    if (uploadForm.file.size > 20 * 1024 * 1024) { toast.error("Ukuran file terlalu besar. Maksimal 20MB!"); return; }
    if (uploadForm.recipients.length === 0) { toast.error("Pilih minimal satu dosen penerima!"); return; }
    setShowConfirm(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const confirmSubmit = async () => {
    if (!uploadForm.file) return;
    setShowConfirm(false);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama", uploadForm.name);
    formData.append("jenis_dokumen", uploadForm.jenis);
    formData.append("tanggal_upload", new Date().toISOString().split("T")[0]);
    formData.append("file", uploadForm.file);
    formData.append("dosen_penerima_ids", JSON.stringify(uploadForm.recipients));
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribute`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      toast.success("Dokumen berhasil didistribusikan!");
      setShowUploadDialog(false);
      setUploadForm({ name: "", jenis: "", file: null, recipients: [] });
      setSelectedProdiId("all");
      setRecipientSearch("");
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = (doc: Document) => { setDeleteTarget(doc); setShowDeleteDialog(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setShowDeleteDialog(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${deleteTarget.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);
      toast.success("Dokumen berhasil dihapus.");
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menghapus."); }
  };

  // ── Status Summary helpers ──
  const recipientBadge = (distribusi: DistribusiItem[]) => {
    if (!distribusi || distribusi.length === 0) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs rounded-full font-normal">0</Badge>;
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs rounded-full font-normal">
        {distribusi.length}
      </Badge>
    );
  };

  const statusBadges = (distribusi: DistribusiItem[]) => {
    if (!distribusi || distribusi.length === 0) {
      return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">Belum didistribusi</Badge>;
    }
    const disetujui = distribusi.filter(d => d.status === "DISETUJUI").length;
    const ditolak = distribusi.filter(d => d.status === "DITOLAK").length;
    const menunggu = distribusi.filter(d => d.status === "MENUNGGU_KONFIRMASI").length;
    if (disetujui === distribusi.length) {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium">Semua disetujui</Badge>;
    }
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {disetujui > 0 && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium whitespace-nowrap">
            <Check className="w-3 h-3 mr-0.5 inline" /> {disetujui} Disetujui
          </Badge>
        )}
        {ditolak > 0 && (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-medium whitespace-nowrap">
            <X className="w-3 h-3 mr-0.5 inline" /> {ditolak} Ditolak
          </Badge>
        )}
        {menunggu > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-medium whitespace-nowrap">
            <Clock className="w-3 h-3 mr-0.5 inline" /> {menunggu} Menunggu
          </Badge>
        )}
      </div>
    );
  };

  return (
    <MainLayout
      title="Distribusi Dokumen"
      breadcrumbs={[{ label: "Beranda", path: "/dashboard" }, { label: "Distribusi Dokumen" }]}
    >
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Distribusi Dokumen</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola dan distribusikan dokumen ke dosen</p>
          </div>
          <Button onClick={() => { setCurrentPage(1); setShowUploadDialog(true); }} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
            <Upload className="w-4 h-4 mr-2" /> Upload Dokumen Baru
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<FileText className="w-5 h-5 text-indigo-600" />} value={stats.total} label="Total Dokumen" bg="bg-indigo-50 border-indigo-200" />
          <StatCard icon={<Check className="w-5 h-5 text-emerald-600" />} value={stats.terdistribusi} label="Sudah Terdistribusi" bg="bg-emerald-50 border-emerald-200" />
          <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} value={stats.belumDistribusi} label="Belum Terdistribusi" bg="bg-amber-50 border-amber-200" />
          <StatCard icon={<Tag className="w-5 h-5 text-purple-600" />} value={stats.jenisUnik} label="Jenis Dokumen" bg="bg-purple-50 border-purple-200" />
        </div>

        {/* ── Filter Bar ── */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama dokumen..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={jenisFilter} onValueChange={(v) => { setJenisFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Jenis Dokumen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Semua Jenis</SelectItem>
                    {uniqueJenis.map(j => <SelectItem key={j} value={j}>{j.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Status Distribusi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Semua Status</SelectItem>
                    <SelectItem value="terdistribusi">Sudah Terdistribusi</SelectItem>
                    <SelectItem value="belum">Belum Terdistribusi</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Urutkan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru">Terbaru</SelectItem>
                    <SelectItem value="terlama">Terlama</SelectItem>
                    <SelectItem value="a-z">A-Z</SelectItem>
                    <SelectItem value="z-a">Z-A</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilter && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs text-muted-foreground">
                    <FilterX className="w-4 h-4 mr-1" /> Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card>
          <CardContent className="p-0">
            {paginatedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-4 rounded-full bg-gray-100 border border-gray-200 mb-4">
                  <FileWarning className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium mb-1">
                  {hasActiveFilter ? "Hasil tidak ditemukan" : "Belum ada dokumen"}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
                  {hasActiveFilter
                    ? "Tidak ada dokumen yang cocok dengan filter yang dipilih."
                    : "Upload dokumen pertama untuk memulai distribusi ke dosen."}
                </p>
                {!hasActiveFilter && (
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Upload className="w-4 h-4 mr-2" /> Upload Dokumen Pertama
                  </Button>
                )}
                {hasActiveFilter && (
                  <Button variant="outline" onClick={resetFilters}>
                    <FilterX className="w-4 h-4 mr-2" /> Reset Filter
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b">
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4">Nama Dokumen</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4">Jenis</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4">Tanggal Upload</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4 w-[100px]">Penerima</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4 w-[140px]">Status</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 py-3 px-4 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDocs.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-indigo-50 border border-indigo-100 shrink-0">
                                <FileText className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[260px]">{doc.nama}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(doc.tanggal_upload), "dd MMM yyyy")}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className={`text-xs font-medium ${jenisColorMap[doc.jenis_dokumen] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                              {doc.jenis_dokumen.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm whitespace-nowrap">{format(new Date(doc.tanggal_upload), "dd MMM yyyy")}</TableCell>
                          <TableCell className="py-3 px-4">{recipientBadge(doc.distribusi)}</TableCell>
                          <TableCell className="py-3 px-4">{statusBadges(doc.distribusi)}</TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[130px]">
                                <DropdownMenuItem onClick={() => navigate(`/document-distribution/${doc.id}`)}>
                                  <Eye className="w-3.5 h-3.5 mr-2" /> Lihat
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/document-distribution/${doc.id}/edit`)}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(doc)} className="text-red-600 focus:text-red-600">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredDocuments.length)} dari {filteredDocuments.length} dokumen
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i + 1)} className="h-8 w-8 p-0 text-xs">
                          {i + 1}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Upload Dialog ── */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 pb-0">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-lg">Upload dokumen baru</DialogTitle>
              <p className="text-sm text-muted-foreground font-normal mt-0.5">Isi informasi dokumen dan pilih penerima distribusi</p>
            </DialogHeader>
            <Separator className="mt-4" />
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Dokumen */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Nama Dokumen <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="Contoh: SK Mengajar Semester Genap"
                  maxLength={100}
                  className="border-gray-300 focus-visible:ring-indigo-500 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">{uploadForm.name.length}/100</span>
              </div>
            </div>

            {/* Jenis Dokumen */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Jenis Dokumen <span className="text-red-500">*</span>
              </Label>
              <Select value={uploadForm.jenis} onValueChange={(val) => {
                if (val === '__TAMBAH__') {
                  setShowNewJenisInput(true);
                  setNewJenisName("");
                  return;
                }
                setShowNewJenisInput(false);
                setUploadForm({ ...uploadForm, jenis: val });
              }}>
                <SelectTrigger className="border-gray-300 focus-visible:ring-indigo-500">
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  {getAllJenisDokumen().map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                  <SelectItem value="__TAMBAH__">+ Tambah Jenis Baru...</SelectItem>
                </SelectContent>
              </Select>
              {showNewJenisInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Nama jenis dokumen baru..."
                    value={newJenisName}
                    onChange={(e) => setNewJenisName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={async () => {
                    if (newJenisName.trim()) {
                      const formatted = newJenisName.trim().toUpperCase().replace(/\s+/g, '_');
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/jenis-dokumen`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ nama: formatted })
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                          const { fetchAndCacheJenisDokumen } = await import("@/lib/utils");
                          await fetchAndCacheJenisDokumen();
                          setUploadForm({ ...uploadForm, jenis: formatted });
                          setShowNewJenisInput(false);
                          setNewJenisName("");
                          toast.success(`Jenis "${newJenisName.trim()}" berhasil ditambahkan.`);
                        } else {
                          toast.error(result.error || 'Gagal menambahkan jenis dokumen');
                        }
                      } catch {
                        toast.error('Gagal menghubungi server');
                      }
                    }
                  }}>Tambah</Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Pilih kategori yang sesuai dengan dokumen.</p>
            </div>

            {/* File Dokumen */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                File Dokumen <span className="text-red-500">*</span>
              </Label>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />

              {uploadForm.file ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-red-50/50 border-red-200">
                  <div className="p-2 rounded-md bg-red-100 border border-red-200 shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadForm.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setUploadForm({ ...uploadForm, file: null }); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="shrink-0 h-8 w-8 p-0 text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-gray-100 border border-gray-200 mx-auto mb-3 w-fit group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop file di sini, atau <span className="text-indigo-600 underline underline-offset-2">klik untuk memilih</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">Format: PDF · Maks. 20MB</p>
                </div>
              )}
            </div>

            {/* Separator */}
            <Separator />

            {/* Pilih Penerima */}
            <div className="border rounded-xl overflow-hidden">
              {/* ── Header ── */}
              <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Pilih penerima</h3>
                  <p className="text-[11px] text-muted-foreground">Pilih dosen yang akan menerima dokumen ini</p>
                </div>
              </div>

              {/* ── Filter Controls ── */}
              <div className="px-4 pt-3 pb-2 border-b">
                <div className="grid grid-cols-[55fr_45fr] gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Cari dosen..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Select value={selectedProdiId} onValueChange={setSelectedProdiId}>
                      <SelectTrigger className="bg-background h-9 text-sm w-full min-w-0">
                        <SelectValue placeholder="Filter Prodi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Program Studi</SelectItem>
                        {uniqueProdis.map((prodi) => (<SelectItem key={prodi.id} value={prodi.id}>{prodi.nama_prodi}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Selected Chips ── */}
              {uploadForm.recipients.length > 0 && (
                <div className="px-4 py-2 border-b bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-blue-700">{uploadForm.recipients.length} dosen dipilih</span>
                    <button onClick={() => setUploadForm({ ...uploadForm, recipients: [] })} className="text-[11px] text-blue-600 hover:underline">Hapus semua</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {uploadForm.recipients.map((id) => {
                      const d = allDosen.find(d => d.id === id);
                      return d ? (
                        <Badge key={id} variant="secondary" className="cursor-pointer gap-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" onClick={() => toggleRecipient(id)}>
                          {d.nama}<X className="w-3 h-3" />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* ── Pilih Semua ── */}
              {searchedDosen.length > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer border-b bg-muted/10 hover:bg-muted/20 transition-colors"
                  onClick={() => {
                    const allSelected = searchedDosen.every(d => uploadForm.recipients.includes(d.id));
                    if (allSelected) {
                      setUploadForm(prev => ({
                        ...prev,
                        recipients: prev.recipients.filter(id => !searchedDosen.some(d => d.id === id)),
                      }));
                    } else {
                      const newIds = searchedDosen.filter(d => !uploadForm.recipients.includes(d.id)).map(d => d.id);
                      setUploadForm(prev => ({ ...prev, recipients: [...prev.recipients, ...newIds] }));
                    }
                  }}
                >
                  <Checkbox checked={searchedDosen.every(d => uploadForm.recipients.includes(d.id))} />
                  <span className="text-sm font-medium text-muted-foreground">Pilih Semua</span>
                  <span className="text-xs text-muted-foreground ml-auto">{searchedDosen.filter(d => uploadForm.recipients.includes(d.id)).length}/{searchedDosen.length} dipilih</span>
                </div>
              )}

              {/* ── Daftar Dosen ── */}
              <div className="max-h-[220px] overflow-y-auto bg-background">
                {sortedDosen.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">{recipientSearch ? "Tidak ada dosen yang cocok." : "Tidak ada dosen di prodi ini."}</p>
                ) : sortedDosen.map((dosen) => {
                  const isSelected = uploadForm.recipients.includes(dosen.id);
                  return (
                    <div
                      key={dosen.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${isSelected ? "bg-indigo-50/50 border-l-2 border-l-indigo-500" : "hover:bg-gray-50/50"}`}
                      onClick={() => toggleRecipient(dosen.id)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dosen.nama}</p>
                        <p className="text-[11px] text-muted-foreground">
                          NIP: {dosen.nip}
                          {selectedProdiId === "all" && dosen.program_studi ? ` · ${dosen.program_studi.nama_prodi}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleDistribute} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              <Upload className="w-4 h-4 mr-2" />{isSubmitting ? "Mengupload..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus dokumen <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Submit Confirmation ── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Distribusi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mendistribusikan dokumen "{uploadForm.name}" ke {uploadForm.recipients.length} dosen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Ya, Distribusikan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, value, label, bg }: { icon: React.ReactNode; value: number; label: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
