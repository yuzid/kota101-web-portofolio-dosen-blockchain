import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  CalendarIcon,
  X,
  Search,
  FileText,
  Trash2,
  Highlighter,
  Plus,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createKonfirmasi, deleteKonfirmasi } from "../lib/kegiatanKonfirmasi";
import { useNotifications } from "../contexts/NotificationContext";

interface Dosen {
  id: string;
  email: string;
  name: string;
  nidn?: string;
  programStudi: string;
}

interface Document {
  id: string;
  name: string;
  jenis: string;
  tanggal: string;
  uploadedBy: string;
  uploadedByName: string;
}

const kategoriByJenis: Record<string, string[]> = {
  pengajaran: [
    "Mengajar",
    "Pembimbing TA",
    "Pembimbing PKL",
    "Pengembangan Kurikulum",
  ],
  penelitian: [
    "Penelitian Mandiri",
    "Penelitian Kelompok",
    "Publikasi Jurnal",
    "Publikasi Prosiding",
  ],
  pengabdian: [
    "Pengabdian Kepada Masyarakat",
    "Pelatihan Masyarakat",
    "Konsultasi Masyarakat",
  ],
  tugas_tambahan: [
    "Koordinator Laboratorium",
    "Sekretaris Prodi",
    "Koordinator Mata Kuliah",
    "Lainnya",
  ],
};

export function ActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    namaKegiatan: "",
    jenisTridharma: "",
    kategori: "",
    tanggalMulai: undefined as Date | undefined,
    tanggalSelesai: undefined as Date | undefined,
    tahunAkademik: "",
    semester: "",
    sumberDana: "",
    biaya: "",
  });

  const [jenisBukti, setJenisBukti] = useState<'masing-masing' | 'bersama'>('masing-masing');
  const [anggota, setAnggota] = useState<Dosen[]>([]);
  const [searchAnggota, setSearchAnggota] = useState("");
  const [searchAnggotaFocused, setSearchAnggotaFocused] = useState(false);
  const [lampiran, setLampiran] = useState<Document[]>([]);
  const [availableDosen, setAvailableDosen] = useState<Dosen[]>([]);
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadJenis, setUploadJenis] = useState('');
  const [uploadTanggal, setUploadTanggal] = useState<Date | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const originalAnggotaIds = useRef<string[]>([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDosenList();
    fetchMyDocuments();
    if (isEdit) {
      fetchActivityForEdit();
    }
  }, [isEdit]);

  const fetchDosenList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?role=DOSEN`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const mapped = result.data.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.dosen?.nama || u.email,
          nidn: u.dosen?.nidn || u.dosen?.nip,
          programStudi: u.dosen?.program_studi?.nama_prodi || 'Tidak ada prodi'
        }));
        setAvailableDosen(mapped);
      }
    } catch (error) {
      console.error('Gagal memuat daftar dosen:', error);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const mapped = result.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          jenis: d.jenis,
          tanggal: d.tanggal,
          uploadedBy: user?.uuid,
          uploadedByName: user?.name
        }));
        setAvailableDocs(mapped);
      }
    } catch (error) {
      console.error('Gagal memuat dokumen:', error);
    }
  };

  const fetchActivityForEdit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const act = result.data;
        setFormData({
          namaKegiatan: act.namaKegiatan,
          jenisTridharma: act.jenisTridharma,
          kategori: act.kategori,
          tanggalMulai: new Date(act.tanggalMulai),
          tanggalSelesai: new Date(act.tanggalSelesai),
          tahunAkademik: act.tahunAkademik,
          semester: act.semester,
          sumberDana: act.sumberDana || "",
          biaya: act.biaya?.toString() || "",
        });

        // Set anggota (exclude current user / pencatat)
        const members = act.dosenTerlibat
          .filter((d: any) => !d.isPencatat)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            nidn: d.nidn,
            programStudi: "" // Backend doesn't return prodi in detail currently
          }));
        setAnggota(members);
        originalAnggotaIds.current = members.map((m: any) => m.id);

        // Set lampiran
        const docs = act.dosenTerlibat.flatMap((d: any) => 
          d.dokumen.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            jenis: doc.jenis,
            tanggal: doc.tanggalUpload,
            uploadedBy: d.id,
            uploadedByName: d.name
          }))
        );
        setLampiran(docs);
      }
    } catch (error) {
      toast.error('Gagal memuat data kegiatan');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.namaKegiatan.trim()) {
      newErrors.namaKegiatan = "Nama kegiatan wajib diisi";
    }
    if (!formData.jenisTridharma) {
      newErrors.jenisTridharma = "Jenis Tridharma wajib dipilih";
    }
    if (!formData.kategori) {
      newErrors.kategori = "Kategori kegiatan wajib dipilih";
    }
    if (!formData.tanggalMulai) {
      newErrors.tanggalMulai = "Tanggal mulai wajib diisi";
    }
    if (!formData.tanggalSelesai) {
      newErrors.tanggalSelesai = "Tanggal selesai wajib diisi";
    }
    if (
      formData.tanggalMulai &&
      formData.tanggalSelesai &&
      formData.tanggalSelesai < formData.tanggalMulai
    ) {
      newErrors.tanggalSelesai =
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai";
    }
    if (!formData.tahunAkademik) {
      newErrors.tahunAkademik = "Tahun akademik wajib dipilih";
    }
    if (!formData.semester) {
      newErrors.semester = "Semester wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        jenisBukti,
        anggota_ids: anggota.map(a => a.id),
        lampiran_ids: lampiran.filter(l => l.uploadedBy === user?.uuid).map(l => l.id)
      };

      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`
        : `${import.meta.env.VITE_API_URL}/api/dosen/kegiatan`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        const kegiatanId = result.data?.id || id || '';
        if (!isEdit) {
          createKonfirmasi(
            kegiatanId,
            anggota.map(a => a.id),
            user?.uuid || '',
            user?.name || '',
            formData.namaKegiatan
          );
          if (anggota.length > 0) {
            addNotification({
              type: 'member_added',
              title: 'Undangan Kegiatan Terkirim',
              description: `Undangan kegiatan "${formData.namaKegiatan}" telah dikirim ke ${anggota.length} dosen.`,
              actor: user?.name,
              priority: 'medium',
              category: 'Kegiatan',
            });
          }
        } else {
          const currentIds = anggota.map(a => a.id);
          const newIds = currentIds.filter(id => !originalAnggotaIds.current.includes(id));
          const removedIds = originalAnggotaIds.current.filter(id => !currentIds.includes(id));

          if (newIds.length > 0) {
            createKonfirmasi(
              kegiatanId,
              newIds,
              user?.uuid || '',
              user?.name || '',
              formData.namaKegiatan
            );
          }
          removedIds.forEach(id => deleteKonfirmasi(kegiatanId, id));
        }
        toast.success(isEdit ? "Kegiatan berhasil diperbarui." : "Kegiatan berhasil dicatat.");
        navigate(isEdit ? `/activities/${id}` : "/activities");
      } else {
        toast.error(result.error || 'Gagal menyimpan kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Kegiatan berhasil dihapus.`);
        navigate("/activities");
      } else {
        toast.error(result.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnggota = (dosen: Dosen) => {
    if (!anggota.find((a) => a.id === dosen.id)) {
      setAnggota([...anggota, dosen]);
    }
    setSearchAnggota("");
  };

  const handleRemoveAnggota = (dosenId: string) => {
    setAnggota(anggota.filter((a) => a.id !== dosenId));
  };

  const filteredDosen = availableDosen.filter(
    (d) =>
      d.name.toLowerCase().includes(searchAnggota.toLowerCase()) &&
      !anggota.find((a) => a.id === d.id) &&
      d.email !== user?.email &&
      d.id !== user?.uuid
  );

  const handleAddDoc = (doc: Document) => {
    if (!lampiran.find(l => l.id === doc.id)) {
      setLampiran([...lampiran, doc]);
    }
    setShowDocPicker(false);
  };

  const handleRemoveDoc = (docId: string) => {
    setLampiran(lampiran.filter(l => l.id !== docId));
  };

  const handleUploadDoc = async () => {
    if (!uploadFile || !uploadFileName.trim() || !uploadJenis || !uploadTanggal) {
      toast.error("Lengkapi nama, jenis, tanggal, dan pilih file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('nama', uploadFileName.trim());
      formData.append('jenis_dokumen', uploadJenis);
      formData.append('tanggal_dokumen', format(uploadTanggal, 'yyyy-MM-dd'));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success') {
        const newDoc: Document = {
          id: result.data?.id || `doc-${Date.now()}`,
          name: uploadFileName.trim(),
          jenis: uploadJenis,
          tanggal: uploadTanggal.toISOString(),
          uploadedBy: user?.uuid || '',
          uploadedByName: user?.name || '',
        };
        setLampiran([...lampiran, newDoc]);
        setAvailableDocs([...availableDocs, newDoc]);
        setShowUploadDialog(false);
        setUploadFile(null);
        setUploadFileName('');
        setUploadJenis('');
        setUploadTanggal(undefined);
        toast.success("Dokumen berhasil diupload.");
      } else {
        toast.error(result.error || 'Gagal mengupload dokumen');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengupload');
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <MainLayout
      title={isEdit ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Kegiatan Tridharma", path: "/activities" },
        { label: isEdit ? "Edit" : "Tambah Kegiatan Baru" },
      ]}
    >
      <div className="space-y-6 max-w-4xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {/* Section 1: Informasi Kegiatan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Kegiatan *</Label>
              <Textarea
                id="nama"
                placeholder="Tuliskan nama lengkap kegiatan"
                value={formData.namaKegiatan}
                onChange={(e) =>
                  setFormData({ ...formData, namaKegiatan: e.target.value })
                }
                className={errors.namaKegiatan ? "border-destructive" : ""}
                rows={2}
              />
              {errors.namaKegiatan && (
                <p className="text-sm text-destructive">
                  {errors.namaKegiatan}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis">Jenis Tridharma *</Label>
                <Select
                  value={formData.jenisTridharma}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      jenisTridharma: value,
                      kategori: "",
                    });
                    setErrors({ ...errors, jenisTridharma: "" });
                  }}
                >
                  <SelectTrigger
                    className={
                      errors.jenisTridharma ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Pilih jenis tridharma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pengajaran">Pendidikan</SelectItem>
                    <SelectItem value="penelitian">Penelitian</SelectItem>
                    <SelectItem value="pengabdian">
                      Pengabdian kepada Masyarakat
                    </SelectItem>
                    <SelectItem value="tugas_tambahan">
                      Tugas Tambahan
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenisTridharma && (
                  <p className="text-sm text-destructive">
                    {errors.jenisTridharma}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori Kegiatan *</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => {
                    setFormData({ ...formData, kategori: value });
                    setErrors({ ...errors, kategori: "" });
                  }}
                  disabled={!formData.jenisTridharma}
                >
                  <SelectTrigger
                    className={errors.kategori ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={
                        formData.jenisTridharma
                          ? "Pilih kategori"
                          : "Pilih jenis tridharma terlebih dahulu"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.jenisTridharma &&
                      kategoriByJenis[formData.jenisTridharma].map((kat) => (
                        <SelectItem key={kat} value={kat}>
                          {kat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.kategori && (
                  <p className="text-sm text-destructive">{errors.kategori}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.tanggalMulai && "text-muted-foreground",
                        errors.tanggalMulai && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.tanggalMulai
                        ? format(formData.tanggalMulai, "dd MMMM yyyy", { locale: localeId })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.tanggalMulai}
                      onSelect={(date) => {
                        setFormData({ ...formData, tanggalMulai: date });
                        setErrors({ ...errors, tanggalMulai: "" });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.tanggalMulai && (
                  <p className="text-sm text-destructive">
                    {errors.tanggalMulai}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tanggal Selesai *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.tanggalSelesai && "text-muted-foreground",
                        errors.tanggalSelesai && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.tanggalSelesai
                        ? format(formData.tanggalSelesai, "dd MMMM yyyy", { locale: localeId })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.tanggalSelesai}
                      onSelect={(date) => {
                        setFormData({ ...formData, tanggalSelesai: date });
                        setErrors({ ...errors, tanggalSelesai: "" });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.tanggalSelesai && (
                  <p className="text-sm text-destructive">
                    {errors.tanggalSelesai}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun Akademik *</Label>
                <Select
                  value={formData.tahunAkademik}
                  onValueChange={(value) => {
                    setFormData({ ...formData, tahunAkademik: value });
                    setErrors({ ...errors, tahunAkademik: "" });
                  }}
                >
                  <SelectTrigger
                    className={errors.tahunAkademik ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Pilih tahun akademik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2023/2024">2023/2024</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tahunAkademik && (
                  <p className="text-sm text-destructive">
                    {errors.tahunAkademik}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => {
                    setFormData({ ...formData, semester: value });
                    setErrors({ ...errors, semester: "" });
                  }}
                >
                  <SelectTrigger
                    className={errors.semester ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ganjil">Ganjil</SelectItem>
                    <SelectItem value="genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
                {errors.semester && (
                  <p className="text-sm text-destructive">{errors.semester}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sumber-dana">Sumber Dana</Label>
                <Select
                  value={formData.sumberDana}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sumberDana: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber dana (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIPA POLBAN">DIPA POLBAN</SelectItem>
                    <SelectItem value="Mandiri">Mandiri</SelectItem>
                    <SelectItem value="Hibah Eksternal">
                      Hibah Eksternal
                    </SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">(opsional)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biaya">Biaya Kegiatan (Rp)</Label>
                <Input
                  id="biaya"
                  type="number"
                  placeholder="0"
                  value={formData.biaya}
                  onChange={(e) =>
                    setFormData({ ...formData, biaya: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">(opsional)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Jenis Bukti Kegiatan */}
        <Card>
          <CardHeader>
            <CardTitle>Jenis Bukti Kegiatan</CardTitle>
            <CardDescription>
              Pilih bagaimana dokumen bukti dikelola untuk kegiatan bersama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setJenisBukti('masing-masing')}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  jenisBukti === 'masing-masing'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    jenisBukti === 'masing-masing' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {jenisBukti === 'masing-masing' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Bukti diunggah masing-masing</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Setiap dosen yang terlibat mengunggah dokumen buktinya sendiri.
                      Dokumen tidak saling terhubung antar dosen.
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Status kelengkapan dihitung per dosen</li>
                      <li>Dosen lain tidak bisa melihat dokumen pribadi</li>
                    </ul>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJenisBukti('bersama')}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  jenisBukti === 'bersama'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    jenisBukti === 'bersama' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {jenisBukti === 'bersama' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Bukti bersama</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Satu dokumen dipakai bersama oleh seluruh dosen yang terlibat.
                      Cukup satu kali upload oleh pencatat kegiatan.
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Dokumen otomatis terhubung ke dosen yang menyetujui</li>
                      <li>Dosen lain dapat melihat dokumen (read-only)</li>
                      <li>Hanya uploader yang bisa edit/hapus</li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Dosen yang Terlibat */}
        <Card>
          <CardHeader>
            <CardTitle>Dosen yang Terlibat</CardTitle>
            <CardDescription>
              Tambahkan dosen lain untuk kegiatan bersama. Dosen yang ditambahkan harus mengonfirmasi keterlibatan mereka.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current User (Fixed) - Pencatat is also Anggota */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.programStudi}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-500">Pencatat</Badge>
                <Badge variant="secondary">Anggota</Badge>
              </div>
            </div>

            {/* Search and Add Members */}
            <div className="space-y-2">
              <Label>Tambah Anggota Dosen (opsional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Klik untuk cari nama dosen..."
                  value={searchAnggota}
                  onChange={(e) => setSearchAnggota(e.target.value)}
                  onFocus={() => setSearchAnggotaFocused(true)}
                  onBlur={() => setTimeout(() => setSearchAnggotaFocused(false), 200)}
                  className="pl-9"
                />
                {(searchAnggotaFocused || (searchAnggota && filteredDosen.length > 0)) && filteredDosen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredDosen.map((dosen) => (
                      <button
                        key={dosen.id}
                        onMouseDown={(e) => { e.preventDefault(); handleAddAnggota(dosen); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(dosen.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{dosen.name}</p>
                          {dosen.nidn && (
                            <p className="text-xs text-muted-foreground font-mono">
                              ID/NIP: {dosen.nidn}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {dosen.programStudi}
                          </p>
                        </div>
                      </button>
                    ))}
                    {!searchAnggota && (
                      <div className="p-2 text-xs text-muted-foreground text-center border-t">
                        Ketik untuk memfilter hasil
                      </div>
                    )}
                  </div>
                )}
                {(searchAnggotaFocused || searchAnggota) && filteredDosen.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 p-4 text-sm text-muted-foreground text-center">
                    {searchAnggota ? 'Tidak ada dosen ditemukan' : 'Semua dosen sudah ditambahkan'}
                  </div>
                )}
              </div>
            </div>

            {/* Added Members */}
            {anggota.length > 0 && (
              <div className="space-y-2">
                {anggota.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(d.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {d.programStudi || 'Anggota Eksternal/Lainnya'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Anggota</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAnggota(d.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Lampiran Bukti */}
        <Card>
          <CardHeader>
            <CardTitle>Lampiran Bukti Kegiatan</CardTitle>
            <CardDescription>
              {jenisBukti === 'bersama'
                ? 'Upload satu dokumen bukti yang akan dipakai bersama oleh seluruh dosen yang terlibat'
                : 'Setiap dosen yang terlibat mengunggah dokumen buktinya masing-masing'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {jenisBukti === 'bersama' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">📄 Bukti bersama dipilih</p>
                <p className="mt-1">
                  Dokumen yang diupload akan otomatis terhubung ke seluruh dosen yang
                  menyetujui keterlibatannya. Dosen lain dapat melihat dokumen ini
                  (read-only).
                </p>
              </div>
            )}
            {/* Dokumen Anda heading (always visible) */}
            <h4 className="text-sm font-semibold flex items-center gap-2">
              Dokumen Anda{" "}
              <Badge variant="outline">
                {lampiran.filter((l) => l.uploadedBy === user?.uuid).length}
              </Badge>
            </h4>

            {/* Upload/Pick Actions — placed right after Dokumen Anda heading */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDocPicker(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Pilih dari Dokumen Saya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Unggah Dokumen Baru
              </Button>
            </div>

            {lampiran.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Belum ada dokumen bukti yang diupload</p>
                <p className="text-sm mt-1">
                  {jenisBukti === 'bersama'
                    ? 'Upload satu dokumen yang akan menjadi bukti bersama'
                    : 'Setiap dosen yang terlibat harus mengupload dokumen bukti'}
                </p>
              </div>
            ) : (
              <>
                {/* Dokumen Saya list */}
                {lampiran.filter((l) => l.uploadedBy === user?.uuid).length > 0 && (
                  <div className="space-y-2">
                    {lampiran
                      .filter((l) => l.uploadedBy === user?.uuid)
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.jenis}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRemoveDoc(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Dokumen Anggota Lain (Read-only view) */}
                {lampiran.filter((l) => l.uploadedBy !== user?.uuid).length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                      Dokumen Anggota Lain{" "}
                      <Badge variant="outline">
                        {lampiran.filter((l) => l.uploadedBy !== user?.uuid).length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {lampiran
                        .filter((l) => l.uploadedBy !== user?.uuid)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 opacity-70"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.jenis} • Oleh: {doc.uploadedByName}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between sticky bottom-6 bg-background p-4 border rounded-lg shadow-lg z-20">
          <div>
            {isEdit && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Hapus Kegiatan
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/activities")}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </Button>
          </div>
        </div>
      </div>

      {/* Document Picker Dialog */}
      <Dialog open={showDocPicker} onOpenChange={setShowDocPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pilih Dokumen Bukti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableDocs.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">Tidak ada dokumen tersedia. Silakan upload terlebih dahulu.</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {availableDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => handleAddDoc(doc)}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.jenis}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Pilih</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Dokumen Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-file">File *</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    if (!uploadFileName) {
                      setUploadFileName(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }
                }}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-nama">Nama Dokumen *</Label>
              <Input
                id="upload-nama"
                placeholder="Nama dokumen"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-jenis">Jenis Dokumen *</Label>
              <Select value={uploadJenis} onValueChange={setUploadJenis}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURAT_KEPUTUSAN">Surat Keputusan</SelectItem>
                  <SelectItem value="SURAT_TUGAS">Surat Tugas</SelectItem>
                  <SelectItem value="LEMBAR_PENGESAHAN">Lembar Pengesahan</SelectItem>
                  <SelectItem value="KONTRAK_PENELITIAN">Kontrak Penelitian</SelectItem>
                  <SelectItem value="SERTIFIKAT">Sertifikat</SelectItem>
                  <SelectItem value="FOTO">Foto</SelectItem>
                  <SelectItem value="LAPORAN">Laporan</SelectItem>
                  <SelectItem value="BUKTI_PENDUKUNG_LAIN">Bukti Pendukung Lain</SelectItem>
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
                      !uploadTanggal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {uploadTanggal
                      ? format(uploadTanggal, "dd MMMM yyyy", { locale: localeId })
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={uploadTanggal}
                    onSelect={setUploadTanggal}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadFile(null);
                  setUploadFileName('');
                  setUploadJenis('');
                  setUploadTanggal(undefined);
                }}
              >
                Batal
              </Button>
              <Button className="flex-1" onClick={handleUploadDoc} disabled={isUploading}>
                {isUploading ? 'Mengupload...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kegiatan <strong>{formData.namaKegiatan}</strong> beserta seluruh
              asosiasinya akan dihapus. Dokumen bukti yang terlampir tidak akan
              terhapus, tetapi asosiasi dengan kegiatan ini akan hilang.
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
