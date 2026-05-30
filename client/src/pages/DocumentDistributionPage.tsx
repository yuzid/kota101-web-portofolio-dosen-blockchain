import { useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import {
  Upload,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  FileText,
  CalendarIcon,
  Send,
  Eye,
  MoreVertical,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DistributedDocument {
  id: string;
  name: string;
  jenis: string;
  uploadDate: string;
  distributionDate?: string;
  recipients: string[];
  recipientNames: string[];
  status: "draft" | "pending" | "distributed";
  totalRecipients: number;
  receivedCount: number;
}

const mockDocuments: DistributedDocument[] = [
  {
    id: "1",
    name: "SK Mengajar Semester Genap 2025/2026",
    jenis: "SK",
    uploadDate: "2026-05-16",
    distributionDate: "2026-05-16",
    recipients: ["1", "2", "3", "4", "5"],
    recipientNames: [
      "Dr. John Doe",
      "Dr. Ahmad Fauzi",
      "Dr. Siti Nurhaliza",
      "Dr. Budi Santoso",
      "Dr. Jane Smith",
    ],
    status: "distributed",
    totalRecipients: 5,
    receivedCount: 5,
  },
  {
    id: "2",
    name: "Surat Tugas Penelitian Q2 2026",
    jenis: "Surat Tugas",
    uploadDate: "2026-05-15",
    distributionDate: "2026-05-15",
    recipients: ["1", "2"],
    recipientNames: ["Dr. John Doe", "Dr. Ahmad Fauzi"],
    status: "distributed",
    totalRecipients: 2,
    receivedCount: 1,
  },
  {
    id: "3",
    name: "SK Penugasan Koordinator Lab",
    jenis: "SK",
    uploadDate: "2026-05-14",
    recipients: ["3", "4"],
    recipientNames: ["Dr. Siti Nurhaliza", "Dr. Budi Santoso"],
    status: "pending",
    totalRecipients: 2,
    receivedCount: 0,
  },
  {
    id: "4",
    name: "Jadwal Mengajar Semester Genap Draft",
    jenis: "Jadwal",
    uploadDate: "2026-05-13",
    recipients: [],
    recipientNames: [],
    status: "draft",
    totalRecipients: 0,
    receivedCount: 0,
  },
];

const allDosen = [
  {
    id: "1",
    name: "Dr. John Doe",
    nidn: "0412108901",
    programStudi: "D4 Teknik Informatika",
  },
  {
    id: "2",
    name: "Dr. Ahmad Fauzi",
    nidn: "0420059102",
    programStudi: "D4 Teknik Informatika",
  },
  {
    id: "3",
    name: "Dr. Siti Nurhaliza",
    nidn: "0405067801",
    programStudi: "D3 Teknik Informatika",
  },
  {
    id: "4",
    name: "Dr. Budi Santoso",
    nidn: "0408068901",
    programStudi: "D4 Teknik Komputer",
  },
  {
    id: "5",
    name: "Dr. Jane Smith",
    nidn: "0415078801",
    programStudi: "D4 Teknik Informatika",
  },
];

export function DocumentDistributionPage() {
  const [documents, setDocuments] =
    useState<DistributedDocument[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRecipient, setFilterRecipient] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DistributedDocument | null>(null);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    file: null as File | null,
    recipients: [] as string[],
    sendNow: true,
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchesRecipient =
      filterRecipient === "all" || doc.recipients.includes(filterRecipient);

    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      const docDate = new Date(doc.uploadDate);
      matchesDate = docDate >= dateRange.from && docDate <= dateRange.to;
    }

    return matchesSearch && matchesStatus && matchesRecipient && matchesDate;
  });

  const hasActiveFilters =
    searchTerm !== "" ||
    filterStatus !== "all" ||
    filterRecipient !== "all" ||
    dateRange.from ||
    dateRange.to;

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterRecipient("all");
    setDateRange({});
  };

  const counts = {
    all: documents.length,
    draft: documents.filter((d) => d.status === "draft").length,
    pending: documents.filter((d) => d.status === "pending").length,
    distributed: documents.filter((d) => d.status === "distributed").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "distributed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terdistribusi
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleUpload = () => {
    if (!uploadForm.name || !uploadForm.jenis) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    const newDoc: DistributedDocument = {
      id: `doc-${Date.now()}`,
      name: uploadForm.name,
      jenis: uploadForm.jenis,
      uploadDate: new Date().toISOString().split("T")[0],
      distributionDate: uploadForm.sendNow
        ? new Date().toISOString().split("T")[0]
        : undefined,
      recipients: uploadForm.recipients,
      recipientNames: allDosen
        .filter((d) => uploadForm.recipients.includes(d.id))
        .map((d) => d.name),
      status: uploadForm.sendNow
        ? "distributed"
        : uploadForm.recipients.length > 0
        ? "pending"
        : "draft",
      totalRecipients: uploadForm.recipients.length,
      receivedCount: 0,
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadDialog(false);
    setUploadForm({
      name: "",
      jenis: "",
      file: null,
      recipients: [],
      sendNow: true,
    });

    if (uploadForm.sendNow && uploadForm.recipients.length > 0) {
      toast.success(
        `Dokumen "${uploadForm.name}" berhasil didistribusikan ke ${uploadForm.recipients.length} dosen`
      );
    } else {
      toast.success(
        `Dokumen "${uploadForm.name}" disimpan sebagai ${
          uploadForm.recipients.length > 0 ? "pending" : "draft"
        }`
      );
    }
  };

  const handleViewDetail = (doc: DistributedDocument) => {
    setSelectedDocument(doc);
    setShowDetailDialog(true);
  };

  const handleDelete = (doc: DistributedDocument) => {
    setDocuments(documents.filter((d) => d.id !== doc.id));
    toast.success(`Dokumen "${doc.name}" berhasil dihapus`);
  };

  const toggleRecipient = (dosenId: string) => {
    setUploadForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(dosenId)
        ? prev.recipients.filter((id) => id !== dosenId)
        : [...prev.recipients, dosenId],
    }));
  };

  const toggleAllRecipients = () => {
    setUploadForm((prev) => ({
      ...prev,
      recipients:
        prev.recipients.length === allDosen.length
          ? []
          : allDosen.map((d) => d.id),
    }));
  };

  return (
    <MainLayout
      title="Distribusi Dokumen"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Distribusi Dokumen" },
      ]}
    >
      <div className="space-y-4 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Distribusi Dokumen</h2>
            <p className="text-sm text-muted-foreground">
              Kelola dan distribusikan dokumen ke dosen
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Dokumen Baru
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Dokumen</p>
                <p className="text-3xl font-bold">{counts.all}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Terdistribusi</p>
                <p className="text-3xl font-bold text-green-600">
                  {counts.distributed}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {counts.pending}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-3xl font-bold text-gray-600">
                  {counts.draft}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="distributed">Terdistribusi</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterRecipient}
                onValueChange={setFilterRecipient}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Penerima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Penerima</SelectItem>
                  {allDosen.map((dosen) => (
                    <SelectItem key={dosen.id} value={dosen.id}>
                      {dosen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from &&
                        !dateRange.to &&
                        "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "dd/MM/yy")} - ${format(
                          dateRange.to,
                          "dd/MM/yy"
                        )}`
                      : "Pilih Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange(range || {})}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diterima</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                        <p>Tidak ada dokumen yang sesuai filter</p>
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
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.jenis}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(doc.uploadDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{doc.totalRecipients}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        {doc.status !== "draft" && (
                          <span className="text-sm">
                            {doc.receivedCount}/{doc.totalRecipients}
                          </span>
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
                              onClick={() => handleViewDetail(doc)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {doc.status === "draft" && (
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Distribusikan Sekarang
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Dokumen Baru</DialogTitle>
            <DialogDescription>
              Upload dan distribusikan dokumen ke dosen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Dokumen *</Label>
              <Input
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                placeholder="Contoh: SK Mengajar Semester Genap 2025/2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Dokumen *</Label>
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
                  <SelectItem value="SK">SK</SelectItem>
                  <SelectItem value="Surat Tugas">Surat Tugas</SelectItem>
                  <SelectItem value="Jadwal">Jadwal</SelectItem>
                  <SelectItem value="Pengumuman">Pengumuman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File Dokumen *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">Drag & drop atau klik untuk upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, maksimal 10MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pilih Penerima *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllRecipients}
                >
                  {uploadForm.recipients.length === allDosen.length
                    ? "Hapus Semua"
                    : "Pilih Semua"}
                </Button>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {allDosen.map((dosen) => (
                  <div key={dosen.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`dosen-${dosen.id}`}
                      checked={uploadForm.recipients.includes(dosen.id)}
                      onCheckedChange={() => toggleRecipient(dosen.id)}
                    />
                    <Label
                      htmlFor={`dosen-${dosen.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {dosen.name} ({dosen.programStudi})
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadForm.recipients.length} dosen dipilih
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="send-now"
                checked={uploadForm.sendNow}
                onCheckedChange={(checked) =>
                  setUploadForm({ ...uploadForm, sendNow: !!checked })
                }
              />
              <Label htmlFor="send-now" className="cursor-pointer">
                Distribusikan sekarang
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
            <Button onClick={handleUpload}>
              {uploadForm.sendNow
                ? "Upload & Distribusikan"
                : "Simpan sebagai Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Dokumen</DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Nama Dokumen
                </Label>
                <p className="font-medium">{selectedDocument.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedDocument.status)}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Daftar Penerima
                </Label>
                <div className="mt-2 border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {selectedDocument.recipientNames.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      Belum ada penerima
                    </p>
                  ) : (
                    selectedDocument.recipientNames.map((name, index) => (
                      <div
                        key={index}
                        className="p-3 flex items-center justify-between"
                      >
                        <span className="text-sm">{name}</span>
                        <Badge variant="secondary">
                          {index === 0 ? "Diterima" : "Belum"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
