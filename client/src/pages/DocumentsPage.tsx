import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { FileUploader } from "../components/file/FileUploader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
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
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
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
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Highlighter,
  FileText,
  CalendarIcon,
  X,
  Grid3X3,
  List,
  MoreVertical,
  Share2,
  Check,
  Clock,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  jenis: string;
  tanggal: string;
  asal: "tu" | "dosen";
  size: string;
  hasHighlight: boolean;
}

interface PendingRequest {
  id: string;
  dokumenId: string;
  namaDokumen: string;
  jenisDokumen: string;
  tanggalDistribusi: string;
  status: string;
  pengirim: string;
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeTab, setActiveTab] = useState("semua");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    tanggal: undefined as Date | undefined,
    addHighlight: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDosenDocuments();
    fetchPendingRequests();
  }, [activeTab, searchTerm, filterJenis]);

  const fetchDosenDocuments = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/dosen/dokumen?tab=${activeTab}&search=${searchTerm}&jenis=${filterJenis}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setDocuments(result.data);
      }
    } catch (err) {
      toast.error("Gagal melakukan sinkronisasi data dokumen dengan server.");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/permintaan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setPendingRequests(result.data);
      }
    } catch {
      // silent fail
    }
  };

  const handleAccept = async (dokumenId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${dokumenId}/terima`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen berhasil diterima.");
        setPendingRequests(prev => prev.filter(p => p.dokumenId !== dokumenId));
        fetchDosenDocuments();
      } else {
        toast.error(result.error || "Gagal menerima dokumen.");
      }
    } catch {
      toast.error("Gagal menerima dokumen.");
    }
  };

  const handleReject = async (dokumenId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${dokumenId}/tolak`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen ditolak.");
        setPendingRequests(prev => prev.filter(p => p.dokumenId !== dokumenId));
      } else {
        toast.error(result.error || "Gagal menolak dokumen.");
      }
    } catch {
      toast.error("Gagal menolak dokumen.");
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesTab =
      activeTab === "semua" ||
      (activeTab === "tu" && doc.asal === "tu") ||
      (activeTab === "dosen" && doc.asal === "dosen");
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === "all" || doc.jenis === filterJenis;

    let matchesDate = true;
    if (filterDateRange.from && filterDateRange.to) {
      const docDate = new Date(doc.tanggal);
      matchesDate = docDate >= filterDateRange.from && docDate <= filterDateRange.to;
    }

    return matchesTab && matchesSearch && matchesJenis && matchesDate;
  });

  const counts = {
    semua: documents.length,
    tu: documents.filter((d) => d.asal === "tu").length,
    dosen: documents.filter((d) => d.asal === "dosen").length,
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterJenis !== "all" ||
    filterDateRange.from ||
    filterDateRange.to;

  const resetFilters = () => {
    setSearchTerm("");
    setFilterJenis("all");
    setFilterDateRange({});
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.tanggal || !selectedFile) {
      toast.error("Mohon lengkapi semua field yang wajib beserta file berkas!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama", uploadForm.name);
    formData.append("jenis_dokumen", uploadForm.jenis);
    formData.append("tanggal_dokumen", uploadForm.tanggal.toISOString());
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({ name: "", jenis: "", tanggal: undefined, addHighlight: false });

      if (uploadForm.addHighlight) {
        toast.success("Dokumen disimpan. Membuka layar penandaan (Highlight)...");
        navigate(`/documents/${result.data.id}/preview`, { state: { allowHighlight: true } });
      } else {
        toast.success("Dokumen pribadi berhasil diabadikan.");
        fetchDosenDocuments();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah dokumen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${selectedDocument.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      toast.success("Dokumen berhasil dihapus.");
      setShowDeleteDialog(false);
      setSelectedDocument(null);
      fetchDosenDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses penghapusan.");
    }
  };

  const getAsalBadge = (asal: string) => {
    if (asal === "tu") {
      return <Badge className="bg-blue-500">Dari TU</Badge>;
    }
    return <Badge className="bg-green-500">Milik Saya</Badge>;
  };

  return (
    <MainLayout
      title="Dokumen Saya"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Dokumen Saya" },
      ]}
    >
      <div className="space-y-4">
        {/* Permintaan Dokumen Section */}
        {pendingRequests.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Permintaan Dokumen
                <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{req.namaDokumen}</p>
                      <p className="text-xs text-muted-foreground">
                        Dibagikan oleh {req.pengirim}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {req.jenisDokumen}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(req.tanggalDistribusi), "dd MMM yyyy")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Menunggu Konfirmasi
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(req.dokumenId)}
                    >
                      <Check className="w-4 h-4 mr-1" /> Terima
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReject(req.dokumenId)}
                    >
                      <X className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Dokumen Saya</h2>
            <p className="text-sm text-muted-foreground">Kelola dokumen dari TU dan unggahan pribadi</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Unggah Dokumen Baru
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="semua">
                Semua <Badge variant="secondary" className="ml-2">{counts.semua}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tu">
                Dari Tata Usaha <Badge variant="secondary" className="ml-2">{counts.tu}</Badge>
              </TabsTrigger>
              <TabsTrigger value="dosen">
                Unggahan Saya <Badge variant="secondary" className="ml-2">{counts.dosen}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                <List className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama dokumen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Jenis Dokumen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURAT_KEPUTUSAN">SURAT_KEPUTUSAN (SK)</SelectItem>
                  <SelectItem value="SURAT_TUGAS">SURAT_TUGAS</SelectItem>
                  <SelectItem value="KONTRAK_PENELITIAN">KONTRAK_PENELITIAN</SelectItem>
                  <SelectItem value="LAPORAN">LAPORAN</SelectItem>
                  <SelectItem value="LEMBAR_PENGESAHAN">LEMBAR_PENGESAHAN</SelectItem>
                  <SelectItem value="SERTIFIKAT">SERTIFIKAT</SelectItem>
                  <SelectItem value="FOTO">FOTO</SelectItem>
                  <SelectItem value="BUKTI_PENDUKUNG_LAIN">BUKTI_PENDUKUNG_LAIN</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" /> Reset Filter
                </Button>
              )}
            </div>

            {/* Table View */}
            {viewMode === "table" && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Dokumen</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Asal</TableHead>
                      <TableHead className="text-center">Highlight</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada dokumen yang sesuai dengan filter
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <button onClick={() => navigate(`/documents/${doc.id}/preview`)} className="font-medium hover:underline text-left">
                              {doc.name}
                            </button>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{doc.jenis}</Badge></TableCell>
                          <TableCell className="text-sm">{format(new Date(doc.tanggal), "dd MMM yyyy")}</TableCell>
                          <TableCell>{getAsalBadge(doc.asal)}</TableCell>
                          <TableCell className="text-center">
                            {doc.hasHighlight && <Highlighter className="w-4 h-4 text-yellow-500 mx-auto" />}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}/preview`)}>
                                  <Eye className="w-4 h-4 mr-2" /> Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}/preview`)}>
                                  <Download className="w-4 h-4 mr-2" /> Unduh
                                </DropdownMenuItem>
                                {doc.asal === "dosen" && (
                                  <DropdownMenuItem onClick={() => { setSelectedDocument(doc); setShowDeleteDialog(true); }} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">{doc.jenis}</Badge>
                              {getAsalBadge(doc.asal)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(doc.tanggal), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex gap-1 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/documents/${doc.id}/preview`)}>
                            <Eye className="w-3 h-3 mr-1" /> Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Dokumen Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Nama Dokumen *</Label>
              <Input
                id="doc-name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="Masukkan nama dokumen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-jenis">Jenis Dokumen Bukti *</Label>
              <Select value={uploadForm.jenis} onValueChange={(value) => setUploadForm({ ...uploadForm, jenis: value })}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis dokumen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURAT_KEPUTUSAN">SURAT_KEPUTUSAN (SK)</SelectItem>
                  <SelectItem value="SURAT_TUGAS">SURAT_TUGAS</SelectItem>
                  <SelectItem value="KONTRAK_PENELITIAN">KONTRAK_PENELITIAN</SelectItem>
                  <SelectItem value="LAPORAN">LAPORAN</SelectItem>
                  <SelectItem value="LEMBAR_PENGESAHAN">LEMBAR_PENGESAHAN</SelectItem>
                  <SelectItem value="SERTIFIKAT">SERTIFIKAT</SelectItem>
                  <SelectItem value="FOTO">FOTO</SelectItem>
                  <SelectItem value="BUKTI_PENDUKUNG_LAIN">BUKTI_PENDUKUNG_LAIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Dokumen *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !uploadForm.tanggal && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {uploadForm.tanggal ? format(uploadForm.tanggal, "dd MMMM yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={uploadForm.tanggal} onSelect={(date) => setUploadForm({ ...uploadForm, tanggal: date })} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <FileUploader onFilesSelected={handleFilesSelected} maxSizeInMB={20} multiple={false} />

            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input type="checkbox" id="add-highlight" checked={uploadForm.addHighlight} onChange={(e) => setUploadForm({ ...uploadForm, addHighlight: e.target.checked })} className="rounded" />
              <Label htmlFor="add-highlight" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <Highlighter className="w-4 h-4 text-yellow-600" />
                <span><strong>Tambahkan highlight</strong> setelah menyimpan</span>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Dokumen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen <strong>{selectedDocument?.name}</strong> akan dihapus dari portofolio Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
