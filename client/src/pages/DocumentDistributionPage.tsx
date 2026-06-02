import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import {
  Upload,
  Search,
  FileText,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DistributedDocument {
  id: string;
  nama: string;
  jenis_dokumen: string;
  tanggal_upload: string;
  file_path: string;
}

interface Dosen {
  id: string; // ID User / ID Dosen murni
  nama: string;
  nip: string;
  program_studi?: {
    id: string;
    nama_prodi: string;
  };
}

export function DocumentDistributionPage() {
  const [documents, setDocuments] = useState<DistributedDocument[]>([]);
  const [allDosen, setAllDosen] = useState<Dosen[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DistributedDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State baru untuk memfilter list dosen berdasarkan prodi di dalam modal
  const [selectedProdiId, setSelectedProdiId] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    file: null as File | null,
    recipients: [] as string[],
  });

  const token = localStorage.getItem("token");

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
            id: u.id, // FIX: Menggunakan u.id (Top-Level ID User) agar ID tidak undefined dan tidak bug klik semua
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
      if (dataDocs.status === "success") {
        setDocuments(dataDocs.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data dari server.");
    }
  };

  // Mendapatkan daftar prodi unik dari data dosen yang ada untuk dropdown filter
  const uniqueProdis = Array.from(
    new Map(
      allDosen
        .filter((d) => d.program_studi)
        .map((d) => [d.program_studi!.id, d.program_studi])
    ).values()
  );

  // Memfilter dosen yang akan ditampilkan di checkbox berdasarkan prodi yang dipilih
  const filteredDosenForUpload = allDosen.filter((dosen) => {
    if (selectedProdiId === "all") return true;
    return dosen.program_studi?.id === selectedProdiId;
  });

  const filteredDocuments = documents.filter((doc) =>
    doc.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.file) {
      toast.error("Nama, Jenis, dan File dokumen wajib diisi!");
      return;
    }
    if (uploadForm.recipients.length === 0) {
      toast.error("Pilih minimal satu dosen penerima!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama", uploadForm.name);
    formData.append("jenis_dokumen", uploadForm.jenis); 
    formData.append("tanggal_upload", new Date().toISOString());
    formData.append("file", uploadForm.file);
    formData.append("dosen_penerima_ids", JSON.stringify(uploadForm.recipients));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      toast.success("Dokumen administratif berhasil didistribusikan!");
      setShowUploadDialog(false);
      setUploadForm({ name: "", jenis: "", file: null, recipients: [] });
      setSelectedProdiId("all");
      fetchData(); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc: DistributedDocument) => {
    if (!window.confirm(`Hapus dokumen "${doc.nama}"?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      toast.success("Dokumen berhasil dihapus.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  };

  const toggleRecipient = (dosenId: string) => {
    setUploadForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(dosenId)
        ? prev.recipients.filter((id) => id !== dosenId)
        : [...prev.recipients, dosenId],
    }));
  };

  const toggleAllFilteredRecipients = () => {
    const filteredIds = filteredDosenForUpload.map((d) => d.id);
    const allSelected = filteredIds.every((id) => uploadForm.recipients.includes(id));

    if (allSelected) {
      setUploadForm((prev) => ({
        ...prev,
        recipients: prev.recipients.filter((id) => !filteredIds.includes(id)),
      }));
    } else {
      setUploadForm((prev) => ({
        ...prev,
        recipients: Array.from(new Set([...prev.recipients, ...filteredIds])),
      }));
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Distribusi Dokumen</h2>
            <p className="text-sm text-muted-foreground">Kelola dan distribusikan dokumen ke dosen</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Dokumen Baru
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama dokumen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada dokumen administratif.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.nama}</TableCell>
                      <TableCell><Badge variant="secondary">{doc.jenis_dokumen}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(doc.tanggal_upload), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedDocument(doc); setShowDetailDialog(true); }}>
                              <Eye className="w-4 h-4 mr-2" /> Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(doc)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Hapus
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
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Dokumen Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Dokumen *</Label>
              <Input
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="Contoh: SK Mengajar Semester Genap"
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Dokumen *</Label>
              <Select value={uploadForm.jenis} onValueChange={(val) => setUploadForm({ ...uploadForm, jenis: val })}>
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
              <Label>File Dokumen (PDF/DOCX) *</Label>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.docx"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {uploadForm.file ? uploadForm.file.name : "Klik untuk memilih file dokumen"}
                </p>
              </div>
            </div>

            {/* BARU: Dropdown Filter Program Studi Sebelum Checkbox List */}
            <div className="space-y-2 bg-muted p-3 rounded-lg border">
              <Label className="text-xs font-semibold uppercase tracking-wider">Filter Program Studi Dosen</Label>
              <Select value={selectedProdiId} onValueChange={setSelectedProdiId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih Program Studi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {uniqueProdis.map((prodi) => (
                    <SelectItem key={prodi.id} value={prodi.id}>
                      {prodi.nama_prodi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox List Dosen Terfilter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pilih Penerima Dokumen *</Label>
                <Button variant="outline" size="sm" onClick={toggleAllFilteredRecipients}>
                  Pilih / Hapus Semua Terfilter
                </Button>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto bg-background">
                {filteredDosenForUpload.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Tidak ada dosen di prodi ini.</p>
                ) : (
                  filteredDosenForUpload.map((dosen) => (
                    <div key={dosen.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dosen-${dosen.id}`}
                        checked={uploadForm.recipients.includes(dosen.id)}
                        onCheckedChange={() => toggleRecipient(dosen.id)}
                      />
                      <Label htmlFor={`dosen-${dosen.id}`} className="flex-1 cursor-pointer text-sm">
                        {dosen.nama} (NIP: {dosen.nip}) {selectedProdiId === "all" && dosen.program_studi ? `[${dosen.program_studi.nama_prodi}]` : ""}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadForm.recipients.length} dosen total dipilih dari seluruh prodi.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? "Mengunggah..." : "Upload & Distribusikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detail Dokumen Administratif</DialogTitle></DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nama Dokumen</Label>
                <p className="font-semibold text-base">{selectedDocument.nama}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Lokasi S3 Storage</Label>
                <p className="text-xs break-all text-blue-600 underline">
                  <a href={selectedDocument.file_path} target="_blank" rel="noreferrer">{selectedDocument.file_path}</a>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}