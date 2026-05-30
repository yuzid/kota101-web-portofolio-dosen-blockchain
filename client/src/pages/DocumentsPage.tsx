import { useState } from "react";
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
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
  Edit,
  Trash2,
  Highlighter,
  Upload,
  FileText,
  CalendarIcon,
  X,
  Grid3X3,
  List,
  MoreVertical,
  Share2,
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

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "SK Mengajar Semester Ganjil 2025/2026",
    jenis: "SK",
    tanggal: "2025-08-15",
    asal: "tu",
    size: "1.2 MB",
    hasHighlight: true,
  },
  {
    id: "2",
    name: "Surat Tugas Penelitian Blockchain",
    jenis: "Surat Tugas",
    tanggal: "2026-01-10",
    asal: "tu",
    size: "856 KB",
    hasHighlight: false,
  },
  {
    id: "3",
    name: "Laporan Penelitian Q1 2026",
    jenis: "Laporan Kegiatan",
    tanggal: "2026-04-01",
    asal: "dosen",
    size: "3.4 MB",
    hasHighlight: true,
  },
  {
    id: "4",
    name: "Sertifikat Pelatihan Web Development",
    jenis: "Sertifikat",
    tanggal: "2026-05-10",
    asal: "dosen",
    size: "524 KB",
    hasHighlight: false,
  },
  {
    id: "5",
    name: "Artikel Jurnal - IoT in Education",
    jenis: "Artikel Jurnal",
    tanggal: "2026-03-20",
    asal: "dosen",
    size: "2.1 MB",
    hasHighlight: true,
  },
  {
    id: "6",
    name: "Prosiding Konferensi ICACSIS 2026",
    jenis: "Prosiding",
    tanggal: "2026-02-28",
    asal: "dosen",
    size: "1.8 MB",
    hasHighlight: false,
  },
];

export function DocumentsPage() {
  const navigate = useNavigate();
  const [documents] = useState<Document[]>(mockDocuments);
  const [activeTab, setActiveTab] = useState("semua");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    tanggal: undefined as Date | undefined,
    addHighlight: false,
  });

  // Filter documents
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
      matchesDate =
        docDate >= filterDateRange.from && docDate <= filterDateRange.to;
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

  const handleFilesSelected = (files: File[]) => {
    // In production, this would upload files to server
    console.log("Files selected:", files);
  };

  const handleUpload = () => {
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.tanggal) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    setShowUploadDialog(false);

    if (uploadForm.addHighlight) {
      // Navigate to highlight mode
      toast.success("Dokumen berhasil diunggah. Membuka mode highlight...");
      navigate("/documents/new-doc-id/preview", {
        state: { allowHighlight: true },
      });
    } else {
      toast.success("Dokumen berhasil diunggah.");
    }

    setUploadForm({
      name: "",
      jenis: "",
      tanggal: undefined,
      addHighlight: false,
    });
  };

  const handleDelete = () => {
    toast.success(`Dokumen "${selectedDocument?.name}" berhasil dihapus.`);
    setShowDeleteDialog(false);
    setSelectedDocument(null);
  };

  const handleShareFromDropdown = (doc: Document) => {
    // This will be handled by DocumentSharing component
    toast.info("Klik tombol Bagikan untuk membagikan dokumen");
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Dokumen Saya</h2>
            <p className="text-sm text-muted-foreground">
              Kelola dokumen dari TU dan unggahan pribadi
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Unggah Dokumen Baru
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="semua">
                Semua{" "}
                <Badge variant="secondary" className="ml-2">
                  {counts.semua}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="tu">
                Dari Tata Usaha{" "}
                <Badge variant="secondary" className="ml-2">
                  {counts.tu}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="dosen">
                Unggahan Saya{" "}
                <Badge variant="secondary" className="ml-2">
                  {counts.dosen}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Filters */}
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Jenis Dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="SK">SK</SelectItem>
                  <SelectItem value="Surat Tugas">Surat Tugas</SelectItem>
                  <SelectItem value="Laporan Kegiatan">
                    Laporan Kegiatan
                  </SelectItem>
                  <SelectItem value="Sertifikat">Sertifikat</SelectItem>
                  <SelectItem value="Artikel Jurnal">Artikel Jurnal</SelectItem>
                  <SelectItem value="Prosiding">Prosiding</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Reset Filter
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
                      <TableHead>Ukuran</TableHead>
                      <TableHead className="text-center">Highlight</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="w-8 h-8" />
                            <p>Tidak ada dokumen yang sesuai dengan filter</p>
                            {hasActiveFilters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                              >
                                Reset Filter
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <button
                              onClick={() =>
                                navigate(`/documents/${doc.id}/preview`)
                              }
                              className="font-medium hover:underline text-left"
                            >
                              {doc.name}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{doc.jenis}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(doc.tanggal), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>{getAsalBadge(doc.asal)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.size}
                          </TableCell>
                          <TableCell className="text-center">
                            {doc.hasHighlight && (
                              <Highlighter className="w-4 h-4 text-yellow-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/documents/${doc.id}/preview`)
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/documents/${doc.id}/preview`, {
                                      state: { allowHighlight: true },
                                    })
                                  }
                                >
                                  <Highlighter className="w-4 h-4 mr-2" />
                                  Tambah Highlight
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleShareFromDropdown(doc)}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Bagikan{" "}
                                  {doc.asal === "tu" ? "(versi highlight)" : ""}
                                </DropdownMenuItem>
                                {doc.asal === "dosen" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        toast.info(
                                          "Fitur edit metadata dokumen akan segera tersedia"
                                        );
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </>
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
                  <Card
                    key={doc.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {doc.name}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {doc.jenis}
                              </Badge>
                              {getAsalBadge(doc.asal)}
                            </div>
                          </div>
                          {doc.hasHighlight && (
                            <Highlighter className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {format(new Date(doc.tanggal), "dd MMM yyyy")}
                          </span>
                          <span>{doc.size}</span>
                        </div>
                        <div className="flex gap-1 pt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <MoreVertical className="w-3 h-3 mr-1" />
                                Aksi
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/documents/${doc.id}/preview`)
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/documents/${doc.id}/preview`, {
                                    state: { allowHighlight: true },
                                  })
                                }
                              >
                                <Highlighter className="w-4 h-4 mr-2" />
                                Tambah Highlight
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleShareFromDropdown(doc)}
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Bagikan{" "}
                                {doc.asal === "tu" ? "(versi highlight)" : ""}
                              </DropdownMenuItem>
                              {doc.asal === "dosen" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      toast.info(
                                        "Fitur edit metadata dokumen akan segera tersedia"
                                      );
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredDocuments.length} dari{" "}
              {counts[activeTab as keyof typeof counts]} dokumen
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Dokumen Baru</DialogTitle>
            <DialogDescription>
              Unggah dokumen bukti kegiatan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Nama Dokumen *</Label>
              <Input
                id="doc-name"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                placeholder="Masukkan nama dokumen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-jenis">Jenis Dokumen Bukti *</Label>
              <Select
                value={uploadForm.jenis}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, jenis: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laporan Kegiatan">
                    Laporan Kegiatan
                  </SelectItem>
                  <SelectItem value="Sertifikat">Sertifikat</SelectItem>
                  <SelectItem value="Artikel Jurnal">Artikel Jurnal</SelectItem>
                  <SelectItem value="Prosiding">Prosiding</SelectItem>
                  <SelectItem value="Buku">Buku</SelectItem>
                  <SelectItem value="HKI">HKI</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Dokumen *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !uploadForm.tanggal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {uploadForm.tanggal
                      ? format(uploadForm.tanggal, "dd MMMM yyyy")
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={uploadForm.tanggal}
                    onSelect={(date) =>
                      setUploadForm({ ...uploadForm, tanggal: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <FileUploader
              onFilesSelected={handleFilesSelected}
              maxSizeInMB={20}
              multiple={false}
            />

            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="add-highlight"
                checked={uploadForm.addHighlight}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    addHighlight: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label
                htmlFor="add-highlight"
                className="text-sm font-normal cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-yellow-600" />
                  <span>
                    <strong>Tambahkan highlight</strong> setelah menyimpan
                    (untuk menandai nama/bagian penting)
                  </span>
                </div>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleUpload}>Simpan Dokumen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen <strong>{selectedDocument?.name}</strong> akan dihapus
              dari sistem. Jika dokumen ini dilampirkan ke kegiatan, asosiasi
              tersebut juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
