import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface DokumenData {
  id: string;
  nama: string;
  jenis_dokumen: string;
  file_path: string;
  tanggal_upload: string;
}

export function DocumentDistributionEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingFileName, setExistingFileName] = useState("");

  const [formData, setFormData] = useState({
    nama: "",
    jenis_dokumen: "",
    tanggal_upload: "",
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [hasFileChange, setHasFileChange] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (id) fetchDokumen();
    else setLoading(false);
  }, [id]);

  const fetchDokumen = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/detail`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        const d = result.data;
        setFormData({
          nama: d.nama,
          jenis_dokumen: d.jenis_dokumen,
          tanggal_upload: d.tanggal_upload?.split("T")[0] || "",
        });
        const parts = (d.file_path || "").split("/");
        setExistingFileName(parts[parts.length - 1] || d.nama || "");
      } else {
        toast.error("Gagal memuat data dokumen");
        navigate("/document-distribution");
      }
    } catch {
      toast.error("Gagal memuat data dari server");
      navigate("/document-distribution");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 20MB!");
      return;
    }

    setShowReplaceConfirm(true);
  };

  const confirmReplaceFile = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      setNewFile(file);
      setHasFileChange(true);
    }
    setShowReplaceConfirm(false);
  };

  const handleSubmit = () => {
    if (!formData.nama || !formData.jenis_dokumen || !formData.tanggal_upload) {
      toast.error("Nama, jenis dokumen, dan tanggal wajib diisi.");
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitConfirm(false);
    setSaving(true);
    try {
      const metaPayload = {
        nama: formData.nama,
        jenis_dokumen: formData.jenis_dokumen,
        tanggal_upload: formData.tanggal_upload,
      };

      const metaRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/metadata`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metaPayload),
        }
      );
      const metaResult = await metaRes.json();
      if (metaResult.status !== "success") {
        throw new Error(metaResult.error || "Gagal menyimpan metadata.");
      }

      if (hasFileChange && newFile) {
        const formDataFile = new FormData();
        formDataFile.append("file", newFile);

        const fileRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/replace-file`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataFile,
          }
        );
        const fileResult = await fileRes.json();
        if (fileResult.status !== "success") {
          throw new Error(fileResult.error || "Gagal mengganti file.");
        }
      }

      toast.success("Dokumen berhasil diperbarui.");
      navigate(`/document-distribution/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Edit Dokumen" breadcrumbs={[{ label: "Edit Dokumen" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Edit Dokumen"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Distribusi Dokumen", path: "/document-distribution" },
        { label: formData.nama || "Edit Dokumen" },
      ]}
    >
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(id ? `/document-distribution/${id}` : "/document-distribution")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Dokumen *</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama dokumen"
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Dokumen *</Label>
              <Select
                value={formData.jenis_dokumen}
                onValueChange={(val) => setFormData({ ...formData, jenis_dokumen: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
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
              <Label>Tanggal Upload *</Label>
              <Input
                type="date"
                value={formData.tanggal_upload}
                onChange={(e) => setFormData({ ...formData, tanggal_upload: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing File Display */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">File Saat Ini</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{existingFileName || formData.nama}</p>
                    <p className="text-xs text-muted-foreground">PDF / DOCX</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => id && navigate(`/document-distribution/${id}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" /> Lihat Detail
                  </Button>
                </div>
              </div>
            </div>

            {/* File Replacement */}
            <div className="space-y-2">
              <Label>Ganti File Dokumen</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {newFile ? newFile.name : "Klik untuk memilih file baru"}
                </p>
                {hasFileChange && (
                  <p className="text-xs text-yellow-600 mt-1">File akan diganti setelah disimpan</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(id ? `/document-distribution/${id}` : "/document-distribution")}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti File Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengganti file dokumen saat ini dengan versi baru. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplaceFile}>
              Ya, Ganti File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyimpan perubahan pada dokumen ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
