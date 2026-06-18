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
import {
  Upload,
  Search,
  FileText,
  Eye,
  Trash2,
  Check,
  X,
  Clock,
  Save,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  distribusi: DistribusiItem[];
}

interface Dosen {
  id: string;
  nama: string;
  nip: string;
  program_studi?: { id: string; nama_prodi: string };
}

const statusBadge: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "bg-yellow-100 text-yellow-800",
  DISETUJUI: "bg-green-100 text-green-800",
  DITOLAK: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const statusIcon: Record<string, React.ReactNode> = {
  MENUNGGU_KONFIRMASI: <Clock className="w-3.5 h-3.5" />,
  DISETUJUI: <Check className="w-3.5 h-3.5" />,
  DITOLAK: <X className="w-3.5 h-3.5" />,
};

const statusSummary = (distribusi: DistribusiItem[]) => {
  if (!distribusi || distribusi.length === 0) return "-";
  const disetujui = distribusi.filter(d => d.status === "DISETUJUI").length;
  const ditolak = distribusi.filter(d => d.status === "DITOLAK").length;
  const menunggu = distribusi.filter(d => d.status === "MENUNGGU_KONFIRMASI").length;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {disetujui > 0 && <Badge className="bg-green-100 text-green-800 border-0 text-xs">{disetujui} ✓</Badge>}
      {ditolak > 0 && <Badge className="bg-red-100 text-red-800 border-0 text-xs">{ditolak} ✗</Badge>}
      {menunggu > 0 && <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs">{menunggu} ⏳</Badge>}
    </div>
  );
};

export function DocumentDistributionPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDosen, setAllDosen] = useState<Dosen[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const [selectedProdiId, setSelectedProdiId] = useState<string>("all");
  const [recipientSearch, setRecipientSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    jenis: "",
    file: null as File | null,
    recipients: [] as string[],
  });

  const [submitAction, setSubmitAction] = useState<"draft" | "distribute" | null>(null);

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
      if (dataDocs.status === "success") {
        setDocuments(dataDocs.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data dari server.");
    }
  };

  const uniqueProdis = useMemo(
    () =>
      Array.from(
        new Map(
          allDosen
            .filter((d) => d.program_studi)
            .map((d) => [d.program_studi!.id, d.program_studi])
        ).values()
      ),
    [allDosen]
  );

  const filteredDosenByProdi = allDosen.filter((dosen) => {
    if (selectedProdiId === "all") return true;
    return dosen.program_studi?.id === selectedProdiId;
  });

  const searchedDosen = filteredDosenByProdi.filter((dosen) =>
    dosen.nama.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const sortedDosen = useMemo(() => {
    const selected = new Set(uploadForm.recipients);
    const withSelected = searchedDosen.filter((d) => selected.has(d.id));
    const withoutSelected = searchedDosen.filter((d) => !selected.has(d.id));
    return [...withSelected, ...withoutSelected];
  }, [searchedDosen, uploadForm.recipients]);

  const filteredDocuments = documents.filter((doc) =>
    doc.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRecipient = (dosenId: string) => {
    setUploadForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(dosenId)
        ? prev.recipients.filter((id) => id !== dosenId)
        : [...prev.recipients, dosenId],
    }));
  };

  const handleAction = (action: "draft" | "distribute") => {
    if (!uploadForm.name || !uploadForm.jenis || !uploadForm.file) {
      toast.error("Nama, Jenis, dan File dokumen wajib diisi!");
      return;
    }
    if (uploadForm.file.size > 20 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 20MB!");
      return;
    }
    if (action === "distribute" && uploadForm.recipients.length === 0) {
      toast.error("Pilih minimal satu dosen penerima!");
      return;
    }
    setSubmitAction(action);
    setShowUploadDialog(false);
  };

  const confirmSubmit = async () => {
    if (!uploadForm.file || !submitAction) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama", uploadForm.name);
    formData.append("jenis_dokumen", uploadForm.jenis);
    formData.append("tanggal_upload", new Date().toISOString().split("T")[0]);
    formData.append("file", uploadForm.file);
    formData.append("dosen_penerima_ids", JSON.stringify(uploadForm.recipients));

    const endpoint =
      submitAction === "draft"
        ? `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/draft`
        : `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribute`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);

      toast.success(
        submitAction === "draft"
          ? "Dokumen berhasil disimpan sebagai Draft."
          : "Dokumen berhasil didistribusikan!"
      );
      setShowUploadDialog(false);
      setUploadForm({ name: "", jenis: "", file: null, recipients: [] });
      setSelectedProdiId("all");
      setRecipientSearch("");
      setSubmitAction(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (doc: Document) => {
    setDeleteTarget(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setShowDeleteDialog(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${deleteTarget.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.error);
      toast.success("Dokumen berhasil dihapus.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
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
                  <TableHead>Status Distribusi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada dokumen administratif.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.nama}</TableCell>
                      <TableCell><Badge variant="secondary">{doc.jenis_dokumen}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(doc.tanggal_upload), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{statusSummary(doc.distribusi)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/document-distribution/${doc.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
              <Select
                value={uploadForm.jenis}
                onValueChange={(val) => setUploadForm({ ...uploadForm, jenis: val })}
              >
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

            <div className="space-y-2 bg-muted p-3 rounded-lg border">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Filter Program Studi Dosen
              </Label>
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

            <div className="space-y-2">
              <Label>Pilih Penerima Dokumen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dosen..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {uploadForm.recipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {uploadForm.recipients.map((id) => {
                    const d = allDosen.find((d) => d.id === id);
                    return d ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => toggleRecipient(id)}
                      >
                        {d.nama}
                        <X className="w-3 h-3" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <div className="border rounded-lg max-h-[240px] overflow-y-auto bg-background">
                {sortedDosen.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {recipientSearch
                      ? "Tidak ada dosen yang cocok dengan pencarian."
                      : "Tidak ada dosen di prodi ini."}
                  </p>
                ) : (
                  sortedDosen.map((dosen) => {
                    const isSelected = uploadForm.recipients.includes(dosen.id);
                    return (
                      <div
                        key={dosen.id}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                          isSelected ? "bg-primary/5 border-l-2 border-primary" : ""
                        }`}
                        onClick={() => toggleRecipient(dosen.id)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dosen.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            NIP: {dosen.nip}
                            {selectedProdiId === "all" && dosen.program_studi
                              ? ` [${dosen.program_studi.nama_prodi}]`
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadForm.recipients.length} dosen dipilih
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAction("draft")}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting && submitAction === "draft" ? "Menyimpan..." : "Simpan sebagai Draft"}
            </Button>
            <Button
              onClick={() => handleAction("distribute")}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting && submitAction === "distribute" ? "Mendistribusikan..." : "Distribusikan"}
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
              Apakah Anda yakin ingin menghapus dokumen <strong>{deleteTarget?.nama}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation */}
      <AlertDialog
        open={submitAction !== null}
        onOpenChange={(open) => { if (!open) setSubmitAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {submitAction === "draft" ? "Simpan sebagai Draft?" : "Konfirmasi Distribusi"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {submitAction === "draft"
                ? `Dokumen "${uploadForm.name}" akan disimpan sebagai Draft dan tidak akan dikirim ke dosen mana pun.`
                : `Apakah Anda yakin ingin mendistribusikan dokumen "${uploadForm.name}" ke ${uploadForm.recipients.length} dosen?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              {submitAction === "draft" ? "Simpan Draft" : "Ya, Distribusikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
