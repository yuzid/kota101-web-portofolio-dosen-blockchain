import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
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
  AlertCircle,
  Files,
} from "lucide-react";
import { format } from "date-fns";
import { cn, getAllJenisDokumen } from "@/lib/utils";
import { toast } from "sonner";
import { DocumentSharing } from "../components/document/DocumentSharing";
import { getHighlightStatusByDokumenId, isHighlightMockMode } from "../services/highlightService";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { AnimatedTable, AnimatedTableRow } from "@/components/ui/animated-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const [showFileSizeDialog, setShowFileSizeDialog] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docxWarning, setDocxWarning] = useState<string | null>(null);

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
        const docs = result.data;
        if (isHighlightMockMode()) {
          docs.forEach((doc: any) => {
            if (getHighlightStatusByDokumenId(doc.id)) {
              doc.hasHighlight = true;
            }
          });
        }
        setDocuments(docs);
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
        setPendingRequests((result.data || []).map((item: any) => ({
          id: item.id,
          dokumenId: item.dokumen_id,
          namaDokumen: item.dokumen?.nama || '',
          jenisDokumen: item.dokumen?.jenis_dokumen || '',
          tanggalDistribusi: item.tanggal_distribusi,
          status: item.status,
          pengirim: item.didistribusikan_oleh?.tata_usaha?.nama || 'Tata Usaha',
        })));
      }
    } catch {
    }
  };

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleAccept = async (dokumenId: string) => {
    if (actionLoading[dokumenId]) return;
    setActionLoading(prev => ({ ...prev, [dokumenId]: true }));
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
    } finally {
      setActionLoading(prev => ({ ...prev, [dokumenId]: false }));
    }
  };

  const handleReject = async (dokumenId: string) => {
    if (actionLoading[dokumenId]) return;
    setActionLoading(prev => ({ ...prev, [dokumenId]: true }));
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
    } finally {
      setActionLoading(prev => ({ ...prev, [dokumenId]: false }));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setDocxWarning(files[0].name.endsWith('.docx') ? 'File yang dipilih tipenya DOCX. Preview hanya tersedia untuk file PDF.' : null);
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
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.tanggal) {
      toast.error("Mohon lengkapi field nama, jenis, dan tanggal dokumen!");
      return;
    }
    if (!selectedFile) {
      setShowFileSizeDialog(true);
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setShowFileSizeDialog(true);
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
      setDocxWarning(null);
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
      return <Badge variant="outline" className="text-info border-info/40 bg-info/5">Dari TU</Badge>;
    }
    return <Badge variant="outline" className="text-success border-success/40 bg-success/5">Milik Saya</Badge>;
  };

  const handleDownload = async (doc: Document) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${doc.id}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengunduh');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh dokumen');
    }
  };

  return (
    <MainLayout
      title="Dokumen Saya"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Dokumen Saya" },
      ]}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Dokumen Saya"
          description="Kelola dokumen dari TU dan unggahan pribadi"
        >
          <RippleButton onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Unggah Dokumen
          </RippleButton>
        </PageHeader>

        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Permintaan Dokumen
                  <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-info/10 rounded-lg">
                        <FileText className="w-5 h-5 text-info" />
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
                          <span className="inline-flex items-center gap-1 text-xs text-warning-foreground bg-warning/10 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Menunggu Konfirmasi
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/documents/${req.dokumenId}/preview`, { state: { fromPendingRequest: true } })}
                        disabled={actionLoading[req.dokumenId]}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Detail
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req.dokumenId)}
                        disabled={actionLoading[req.dokumenId]}
                      >
                        <Check className="w-4 h-4 mr-1" /> Terima
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.dokumenId)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={actionLoading[req.dokumenId]}
                      >
                        <X className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="semua">
                Semua <Badge variant="secondary" className="ml-2">{counts.semua}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tu">
                Dari TU <Badge variant="secondary" className="ml-2">{counts.tu}</Badge>
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
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Jenis Dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {getAllJenisDokumen().map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                  <X className="w-4 h-4 mr-1.5" /> Reset
                </Button>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Tidak ada dokumen</p>
              ) : (
                filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {doc.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <button onClick={() => navigate(`/documents/${doc.id}/preview`)} className="font-medium text-sm truncate block hover:underline">
                                {doc.name}
                              </button>
                              <div className="flex gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-xs">{doc.jenis}</Badge>
                                {getAsalBadge(doc.asal)}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[130px]">
                                <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}/preview`)}>
                                  <Eye className="w-3.5 h-3.5 mr-2" /> Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="w-3.5 h-3.5 mr-2" /> Unduh
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShareDocument(doc)}>
                                  <Share2 className="w-3.5 h-3.5 mr-2" /> Bagikan
                                </DropdownMenuItem>
                                {doc.asal === "dosen" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setSelectedDocument(doc); setShowDeleteDialog(true); }} className="text-destructive">
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(doc.tanggal), "dd MMM yyyy")}</span>
                            {doc.hasHighlight ? (
                              <span className="flex items-center gap-1 text-warning">
                                <Highlighter className="w-3 h-3" /> Highlight
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Views */}
            <div className="hidden md:block">
            {viewMode === "table" && (
              <motion.div layout className="border rounded-xl bg-card overflow-x-auto">
                {filteredDocuments.length === 0 ? (
                  <EmptyState
                    icon={<Files className="w-10 h-10" />}
                    title="Tidak ada dokumen"
                    description={
                      hasActiveFilters
                        ? "Tidak ada dokumen yang sesuai filter"
                        : "Belum ada dokumen"
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
                  <AnimatedTable className="table-fixed">
                    <colgroup>
                      <col className="w-2/5" />
                      <col className="w-1/6" />
                      <col className="w-28" />
                      <col className="w-24" />
                      <col className="w-24" />
                      <col className="w-20" />
                    </colgroup>
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
                      {filteredDocuments.map((doc) => (
                        <AnimatedTableRow key={doc.id}>
                          <TableCell>
                            <button onClick={() => navigate(`/documents/${doc.id}/preview`)} className="font-medium hover:underline text-left truncate max-w-[250px] block">
                              {doc.name}
                            </button>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{doc.jenis}</Badge></TableCell>
                          <TableCell className="text-sm">{format(new Date(doc.tanggal), "dd MMM yyyy")}</TableCell>
                          <TableCell>{getAsalBadge(doc.asal)}</TableCell>
                          <TableCell className="text-center">
                            {doc.hasHighlight ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Highlighter className="w-4 h-4 text-warning" />
                                <span className="text-xs text-success font-medium">Sudah</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Belum</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}/preview`)}>
                                  <Eye className="w-4 h-4 mr-2" /> Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="w-4 h-4 mr-2" /> Unduh
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShareDocument(doc)}>
                                  <Share2 className="w-4 h-4 mr-2" /> Bagikan
                                </DropdownMenuItem>
                                {doc.asal === "dosen" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setSelectedDocument(doc); setShowDeleteDialog(true); }} className="text-destructive">
                                      <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </AnimatedTableRow>
                      ))}
                    </TableBody>
                  </AnimatedTable>
                )}
              </motion.div>
            )}
            </div>

            <div className="hidden md:block">
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
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
                              <Eye className="w-3 h-3 mr-1" /> Lihat
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShareDocument(doc)}>
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <DialogHeader>
              <DialogTitle>Unggah Dokumen Baru</DialogTitle>
            </DialogHeader>
          </motion.div>

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
                  {getAllJenisDokumen().map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
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

            <FileUploader key={uploadKey} onFilesSelected={handleFilesSelected} maxSizeInMB={20} multiple={false} />

            {docxWarning && (
              <div className="flex items-start gap-2 p-3 border border-warning/50 bg-warning/5 rounded-lg text-sm text-warning-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{docxWarning}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 p-3 border border-warning/40 bg-warning/5 rounded-lg">
              <input type="checkbox" id="add-highlight" checked={uploadForm.addHighlight} onChange={(e) => setUploadForm({ ...uploadForm, addHighlight: e.target.checked })} className="rounded" />
              <Label htmlFor="add-highlight" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <Highlighter className="w-4 h-4 text-warning" />
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
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Dokumen?"
        description={
          <>Dokumen <strong>{selectedDocument?.name}</strong> akan dihapus dari portofolio Anda.</>
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* File Size Error */}
      <ConfirmDialog
        open={showFileSizeDialog}
        onOpenChange={setShowFileSizeDialog}
        title="Ukuran File Melebihi Batas"
        description={
          <>
            File yang dipilih melebihi batas maksimal <strong>20MB</strong>.<br /><br />
            Silahkan upload ulang file dengan ukuran maksimal <strong>20MB</strong> dan format <strong>PDF</strong>.
          </>
        }
        confirmLabel="Mengerti"
        variant="warning"
        onConfirm={() => { setShowFileSizeDialog(false); setUploadKey(k => k + 1); }}
      />

      {/* Share Dialog */}
      {shareDocument && (
        <DocumentSharing
          documentId={shareDocument.id}
          documentName={shareDocument.name}
          open={true}
          onOpenChange={(open) => { if (!open) setShareDocument(null); }}
        />
      )}
    </MainLayout>
  );
}
