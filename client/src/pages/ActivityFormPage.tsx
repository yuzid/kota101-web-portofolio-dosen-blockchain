import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
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
import { ConfirmDialog } from "../components/ui/confirm-dialog";
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
  Plus,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getDokumenStatus, linkDokumen, unlinkDokumen, unlinkKegiatan } from "../lib/dokumenKegiatanMap";

interface Dosen {
  id: string;
  name: string;
  nidn?: string;
  programStudi: string;
  isPencatat?: boolean;
}

interface Document {
  id: string;
  name: string;
  jenis: string;
  tanggal: string;
  uploadedBy: string;
  uploadedByName: string;
  lampiranId?: string;
}

const kategoriByJenis: Record<string, { label: string; value: string }[]> = {
  pendidikan: [
    { label: 'Pengajaran', value: 'PENGAJARAN' },
    { label: 'Bahan Ajar / Pengembangan Kurikulum', value: 'BAHAN_AJAR' },
    { label: 'Bimbingan Mahasiswa', value: 'BIMBINGAN_MAHASISWA' },
    { label: 'Pembinaan Mahasiswa', value: 'PEMBINAAN_MAHASISWA' },
    { label: 'Pengujian Mahasiswa', value: 'PENGUJIAN_MAHASISWA' },
  ],
  penelitian: [
    { label: 'Penelitian', value: 'PENELITIAN' },
    { label: 'Publikasi Karya Ilmiah', value: 'PUBLIKASI_KARYA' },
    { label: 'Paten / Hak Kekayaan Intelektual', value: 'PATEN' },
    { label: 'Pengelola Jurnal', value: 'PENGELOLA_JURNAL' },
  ],
  pengabdian: [
    { label: 'Pengabdian Masyarakat', value: 'PENGABDIAN' },
    { label: 'Pembicara / Narasumber', value: 'PEMBICARA' },
  ],
  tugas_tambahan: [
    { label: 'Tugas Tambahan', value: 'TUGAS_TAMBAHAN' },
  ],
};

export function ActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    namaKegiatan: "",
    jenisTridharma: "",
    kategori: "",
    tanggalMulai: undefined as Date | undefined,
    tanggalSelesai: undefined as Date | undefined,
    tahunAkademik: "",
    semester: "",
    jenisBukti: "MASING_MASING" as "MASING_MASING" | "BERSAMA",
  });

  const [anggota, setAnggota] = useState<Dosen[]>([]);
  const [searchAnggota, setSearchAnggota] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [lampiran, setLampiran] = useState<Document[]>([]);
  const [availableDosen, setAvailableDosen] = useState<Dosen[]>([]);
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [removeAnggotaId, setRemoveAnggotaId] = useState<string | null>(null);
  const [removeDocId, setRemoveDocId] = useState<string | null>(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCurrentUserPencatat, setIsCurrentUserPencatat] = useState(false);
  const [pencatatId, setPencatatId] = useState<string | null>(null);
  const [deletedLampiranIds, setDeletedLampiranIds] = useState<string[]>([]);
  const [docxWarnings, setDocxWarnings] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token');

  const LS_PREFIX = 'kegiatan_mock_';

  const saveToLocalStorage = (kegiatanId: string, data: any, deletedIds: string[], docs: Document[], members: Dosen[]) => {
    try {
      localStorage.setItem(LS_PREFIX + kegiatanId, JSON.stringify({
        data,
        deletedLampiranIds: deletedIds,
        lampiran: docs,
        anggota: members,
        savedAt: new Date().toISOString()
      }));
    } catch {}
  };

  const loadFromLocalStorage = (kegiatanId: string) => {
    try {
      const raw = localStorage.getItem(LS_PREFIX + kegiatanId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

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
    let apiSuccess = false;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        apiSuccess = true;
        const act = result.data;
        setFormData({
          namaKegiatan: act.namaKegiatan,
          jenisTridharma: act.jenisTridharma,
          kategori: act.kategori || '',
          tanggalMulai: new Date(act.tanggalMulai),
          tanggalSelesai: new Date(act.tanggalSelesai),
          tahunAkademik: act.tahunAkademik,
          semester: act.semester,
          jenisBukti: act.jenisBukti || "MASING_MASING",
        });

        setIsCurrentUserPencatat(act.isCurrentUserPencatat);

        const creatorId = act.dosenTerlibat.find((d: any) => d.isPencatat)?.id || null;
        setPencatatId(creatorId);

        const members = act.dosenTerlibat
          .filter((d: any) => d.id !== user?.uuid)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            nidn: d.nidn,
            programStudi: d.programStudi || "",
            isPencatat: d.isPencatat || false,
          }));
        setAnggota(members);

        const docs = act.dosenTerlibat.flatMap((d: any) =>
          d.dokumen.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            jenis: doc.jenis,
            tanggal: doc.tanggalUpload,
            uploadedBy: d.id,
            uploadedByName: d.name,
            lampiranId: doc.lampiranId
          }))
        );
        const bersamDocs = (act.dokumenBersama || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          jenis: doc.jenis,
          tanggal: doc.tanggalUpload,
          uploadedBy: doc.uploadedBy.id,
          uploadedByName: doc.uploadedBy.name,
          lampiranId: doc.lampiranId
        }));
        setLampiran([...docs, ...bersamDocs]);

        // Task 6: filter deleted docs dari localStorage
        if (id) {
          const savedDeleted = JSON.parse(localStorage.getItem(LS_PREFIX + id + '_deleted') || '[]');
          if (savedDeleted.length > 0) {
            setLampiran(prev => prev.filter(l => !savedDeleted.includes(l.lampiranId)));
            setDeletedLampiranIds(savedDeleted);
          }
        }
      }
    } catch {}
    if (!apiSuccess && id) {
      const mock = loadFromLocalStorage(id);
      if (mock) {
        setFormData(mock.data.formData || mock.data);
        setAnggota(mock.anggota || []);
        setLampiran(mock.lampiran || []);
        setDeletedLampiranIds(mock.deletedLampiranIds || []);
      }
    }
    setIsLoading(false);
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

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        tanggalMulai: formData.tanggalMulai?.toISOString(),
        tanggalSelesai: formData.tanggalSelesai?.toISOString(),
        anggota_ids: anggota.filter(a => a.id !== pencatatId).map(a => a.id),
        lampiran_ids: lampiran.filter(l => l.uploadedBy === user?.uuid).map(l => l.id),
        ...(isEdit && deletedLampiranIds.length > 0 ? { deleted_lampiran_ids: deletedLampiranIds } : {})
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
        if (isEdit && id) {
          saveToLocalStorage(id, payload, deletedLampiranIds, lampiran, anggota);
          localStorage.setItem(LS_PREFIX + id + '_deleted', JSON.stringify(deletedLampiranIds));
          lampiran.filter(l => l.uploadedBy === user?.uuid).forEach(doc => {
            linkDokumen(doc.id, id, formData.namaKegiatan);
          });
        }
        setDeletedLampiranIds([]);
        toast.success(isEdit ? "Kegiatan berhasil diperbarui." : "Kegiatan berhasil dicatat.");
        navigate(isEdit ? `/activities/${id}` : "/activities");
      } else {
        toast.error(result.error || 'Gagal menyimpan kegiatan');
      }
    } catch (error) {
      // Mock fallback: save to localStorage if API unavailable
      if (isEdit && id) {
        saveToLocalStorage(id, payload, deletedLampiranIds, lampiran, anggota);
        localStorage.setItem(LS_PREFIX + id + '_deleted', JSON.stringify(deletedLampiranIds));
        lampiran.filter(l => l.uploadedBy === user?.uuid).forEach(doc => {
          linkDokumen(doc.id, id, formData.namaKegiatan);
        });
        setDeletedLampiranIds([]);
        toast.success(isEdit ? "Kegiatan berhasil diperbarui (mock)." : "Kegiatan berhasil dicatat.");
        navigate(isEdit ? `/activities/${id}` : "/activities");
        setIsLoading(false);
        return;
      }
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    if (id) unlinkKegiatan(id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/kegiatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        if (id) localStorage.removeItem(LS_PREFIX + id);
        toast.success(`Kegiatan berhasil dihapus.`);
        navigate("/activities");
      } else {
        toast.error(result.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      if (isEdit && id) {
        localStorage.removeItem(LS_PREFIX + id);
        toast.success('Kegiatan berhasil dihapus (mock).');
        navigate("/activities");
        setIsLoading(false);
        return;
      }
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
    setShowDropdown(false);
  };

  const handleRemoveAnggota = (dosenId: string) => {
    setAnggota(anggota.filter((a) => a.id !== dosenId));
  };

  const filteredDosen = availableDosen.filter(
    (d) =>
      d.name.toLowerCase().includes(searchAnggota.toLowerCase()) &&
      !anggota.find((a) => a.id === d.id) &&
      d.id !== user?.uuid
  );

  const handleAddDoc = (doc: Document) => {
    const status = getDokumenStatus(doc.id, id);
    if (!status.available) {
      toast.error(`Dokumen "${doc.name}" sudah terikat ke kegiatan "${status.kegiatanNama}"`);
      return;
    }
    if (!lampiran.find(l => l.id === doc.id)) {
      setLampiran([...lampiran, doc]);
    }
    setShowDocPicker(false);
  };

  const confirmRemoveDoc = () => {
    const docId = removeDocId;
    if (!docId) return;
    const doc = lampiran.find(l => l.id === docId);
    if (doc?.lampiranId && isEdit) {
      setDeletedLampiranIds(prev => [...prev, doc.lampiranId!]);
    }
    setLampiran(lampiran.filter(l => l.id !== docId));
    setRemoveDocId(null);
    unlinkDokumen(docId);
  };

  const handleUploadFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 20MB!");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('nama', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('jenis_dokumen', 'BUKTI_PENDUKUNG_LAIN');
      formData.append('tanggal_dokumen', new Date().toISOString().split('T')[0]);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const result = await response.json();
        if (result.status === 'success') {
          const newDoc: Document = {
            id: result.data.id,
            name: file.name.replace(/\.[^/.]+$/, ""),
            jenis: 'BUKTI_PENDUKUNG_LAIN',
            tanggal: new Date().toISOString().split('T')[0],
            uploadedBy: user?.uuid || '',
            uploadedByName: user?.name || ''
          };
          setLampiran([...lampiran, newDoc]);
          fetchMyDocuments();
          if (file.name.endsWith('.docx')) {
            setDocxWarnings(prev => [...prev, `File "${file.name}" tipenya DOCX. Preview hanya tersedia untuk file PDF.`]);
          }
          toast.success('Dokumen berhasil diupload');
        } else {
          toast.error(result.error || 'Gagal upload dokumen');
        }
      } catch (error) {
        toast.error('Gagal upload dokumen');
      }
    };
    input.click();
  };

  const handleFocusSearch = () => {
    setShowDropdown(true);
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

  const anggotaToRemove = removeAnggotaId ? anggota.find(a => a.id === removeAnggotaId) : null;
  const docToRemove = removeDocId ? lampiran.find(l => l.id === removeDocId) : null;

  return (
    <MainLayout
      title={isEdit ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Kegiatan Tridharma", path: "/activities" },
        { label: isEdit ? "Edit" : "Tambah Kegiatan Baru" },
      ]}
    >
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
        <div className="space-y-6 max-w-4xl mx-auto relative">
         {isLoading && (
           <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
             <Loader2 className="w-10 h-10 animate-spin text-primary" />
           </div>
         )}

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
                    <SelectItem value="pendidikan">Pendidikan</SelectItem>
                    <SelectItem value="penelitian">Penelitian</SelectItem>
                    <SelectItem value="pengabdian">Pengabdian kepada Masyarakat</SelectItem>
                    <SelectItem value="tugas_tambahan">Tugas Tambahan</SelectItem>
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
                      kategoriByJenis[formData.jenisTridharma]?.map((kat) => (
                        <SelectItem key={kat.value} value={kat.value}>
                          {kat.label}
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

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dosen yang Terlibat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                {isCurrentUserPencatat && (
                   <Badge className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Pembuat</Badge>
                 )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tambah Anggota Dosen (opsional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Cari nama dosen..."
                  value={searchAnggota}
                  onChange={(e) => {
                    setSearchAnggota(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={handleFocusSearch}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="pl-9"
                />
                {showDropdown && searchAnggota && filteredDosen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredDosen.map((dosen) => (
                      <button
                        key={dosen.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddAnggota(dosen);
                        }}
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
                  </div>
                )}
                {showDropdown && !searchAnggota && filteredDosen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredDosen.map((dosen) => (
                      <button
                        key={dosen.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddAnggota(dosen);
                        }}
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
                  </div>
                )}
              </div>
            </div>

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
                      {d.isPencatat ? (
                         <Badge className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Pembuat</Badge>
                       ) : (
                         <Badge variant="secondary">Anggota</Badge>
                       )}
                      {!d.isPencatat && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveAnggotaId(d.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jenis Bukti Kegiatan</CardTitle>
            <CardDescription>
              Pilih bagaimana bukti dokumen dikelola untuk kegiatan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEdit && !isCurrentUserPencatat && (
              <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Hanya pencatat yang dapat mengubah jenis bukti
              </p>
            )}
            <div className={cn("space-y-3", isEdit && !isCurrentUserPencatat && "pointer-events-none opacity-50")}>
              <div
                className={`p-4 border rounded-lg cursor-pointer ${formData.jenisBukti === "MASING_MASING" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => !(isEdit && !isCurrentUserPencatat) && setFormData({ ...formData, jenisBukti: "MASING_MASING" })}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${formData.jenisBukti === "MASING_MASING" ? "border-primary bg-primary" : ""}`}>
                    {formData.jenisBukti === "MASING_MASING" && (
                      <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Bukti Diunggah Masing-Masing</p>
                    <p className="text-sm text-muted-foreground">
                      Setiap dosen mengupload dokumen bukti secara mandiri
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer ${formData.jenisBukti === "BERSAMA" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => !(isEdit && !isCurrentUserPencatat) && setFormData({ ...formData, jenisBukti: "BERSAMA" })}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${formData.jenisBukti === "BERSAMA" ? "border-primary bg-primary" : ""}`}>
                    {formData.jenisBukti === "BERSAMA" && (
                      <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Bukti Bersama</p>
                    <p className="text-sm text-muted-foreground">
                      Satu dokumen yang digunakan bersama untuk seluruh anggota kegiatan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen Bukti Kegiatan</CardTitle>
            <CardDescription>
              {formData.jenisBukti === "BERSAMA"
                ? "Upload satu dokumen yang akan digunakan bersama seluruh anggota"
                : "Setiap dosen dapat mengupload dokumen bukti masing-masing"}
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <RippleButton
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDocPicker(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Pilih dari Dokumen Saya
              </RippleButton>
              <RippleButton
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleUploadFile}
              >
                <Upload className="w-4 h-4 mr-2" />
                Unggah Dokumen Baru
              </RippleButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {docxWarnings.length > 0 && (
              <div className="space-y-2">
                {docxWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-900">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
            {lampiran.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada dokumen bukti yang diupload</p>
              </div>
            ) : (
              <>
                {lampiran.filter((l) => l.uploadedBy === user?.uuid).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      Dokumen Anda{" "}
                      <Badge variant="outline">
                        {lampiran.filter((l) => l.uploadedBy === user?.uuid).length}
                      </Badge>
                    </h4>
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
                              onClick={() => setRemoveDocId(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

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
            <Button variant="outline" onClick={() => navigate(isEdit ? `/activities/${id}` : "/activities")}>
              Batal
            </Button>
            <RippleButton onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </RippleButton>
          </div>
        </div>
       </div>
       </motion.div>

       <Dialog open={showDocPicker} onOpenChange={setShowDocPicker}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pilih Dokumen Bukti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            {availableDocs.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">Tidak ada dokumen tersedia. Silakan upload terlebih dahulu.</p>
            ) : (
              <div className="space-y-2">
                {availableDocs.map(doc => {
                  const status = getDokumenStatus(doc.id, id);
                  return (
                    <div key={doc.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg ${status.available ? 'hover:bg-accent cursor-pointer' : 'bg-muted/30 opacity-70'}`}
                      onClick={() => status.available && handleAddDoc(doc)}
                    >
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.jenis}</p>
                        {!status.available ? (
                          <Badge variant="secondary" className="text-xs mt-1">Terpakai di "{status.kegiatanNama}"</Badge>
                        ) : null}
                      </div>
                      {status.available ? (
                        <Button variant="ghost" size="sm" className="flex-shrink-0">Pilih</Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeAnggotaId}
        onOpenChange={(open) => { if (!open) setRemoveAnggotaId(null); }}
        title="Keluarkan Anggota?"
        description={`Apakah Anda yakin ingin mengeluarkan ${anggotaToRemove?.name} dari kegiatan ini?`}
        confirmLabel="Keluarkan"
        variant="destructive"
        onConfirm={() => {
          if (removeAnggotaId) handleRemoveAnggota(removeAnggotaId);
          setRemoveAnggotaId(null);
        }}
      />

      <ConfirmDialog
        open={!!removeDocId}
        onOpenChange={(open) => { if (!open) setRemoveDocId(null); }}
        title="Hapus Dokumen?"
        description={`Apakah Anda yakin ingin menghapus dokumen ${docToRemove?.name} dari kegiatan ini?`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={confirmRemoveDoc}
      />

      <ConfirmDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Konfirmasi Simpan"
        description={`Apakah Anda yakin ingin ${isEdit ? 'menyimpan perubahan' : 'mencatat'} kegiatan ${formData.namaKegiatan}?`}
        confirmLabel={isEdit ? 'Simpan Perubahan' : 'Catat Kegiatan'}
        onConfirm={confirmSubmit}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Kegiatan?"
        description={`Kegiatan ${formData.namaKegiatan} beserta seluruh asosiasinya akan dihapus.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
