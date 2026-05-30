import { useState, useEffect } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface Dosen {
  id: string;
  name: string;
  nidn?: string;
  programStudi: string;
}

interface Document {
  id: string;
  name: string;
  jenis: string;
  tanggal: string;
  uploadedBy: string; // ID dosen yang upload
  uploadedByName: string; // Nama dosen yang upload
}

const mockDosen: Dosen[] = [
  {
    id: "1",
    name: "Dr. Ahmad Fauzi",
    nidn: "0420059102",
    programStudi: "D4 Teknik Informatika",
  },
  {
    id: "2",
    name: "Dr. Siti Nurhaliza",
    nidn: "0405067801",
    programStudi: "D4 Teknik Informatika",
  },
  {
    id: "3",
    name: "Prof. Budi Santoso",
    nidn: "0418088902",
    programStudi: "D3 Teknik Informatika",
  },
];

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Sertifikat Pelatihan Web Development",
    jenis: "Sertifikat",
    tanggal: "2026-05-10",
    uploadedBy: "1",
    uploadedByName: "Dr. John Doe",
  },
  {
    id: "2",
    name: "Laporan Penelitian Blockchain",
    jenis: "Laporan Kegiatan",
    tanggal: "2026-04-15",
    uploadedBy: "1",
    uploadedByName: "Dr. John Doe",
  },
  {
    id: "3",
    name: "Artikel Jurnal - IoT in Education",
    jenis: "Artikel Jurnal",
    tanggal: "2026-03-20",
    uploadedBy: "2",
    uploadedByName: "Dr. Ahmad Fauzi",
  },
];

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

  const [anggota, setAnggota] = useState<Dosen[]>([]);
  const [searchAnggota, setSearchAnggota] = useState("");
  const [lampiran, setLampiran] = useState<Document[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      // Load existing data
      setFormData({
        namaKegiatan: "Mata Kuliah Pemrograman Web",
        jenisTridharma: "pengajaran",
        kategori: "Mengajar",
        tanggalMulai: new Date("2026-01-15"),
        tanggalSelesai: new Date("2026-05-30"),
        tahunAkademik: "2025/2026",
        semester: "ganjil",
        sumberDana: "DIPA POLBAN",
        biaya: "5000000",
      });
      setLampiran([mockDocuments[0], mockDocuments[1]]);
    }
  }, [isEdit]);

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

    if (isEdit) {
      toast.success("Kegiatan berhasil diperbarui.");
      navigate(`/activities/${id}`);
    } else {
      toast.success("Kegiatan berhasil dicatat.");
      navigate("/activities");
    }
  };

  const handleDelete = () => {
    toast.success(`Kegiatan "${formData.namaKegiatan}" berhasil dihapus.`);
    navigate("/activities");
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

  const filteredDosen = mockDosen.filter(
    (d) =>
      d.name.toLowerCase().includes(searchAnggota.toLowerCase()) &&
      !anggota.find((a) => a.id === d.id)
  );

  const getInitials = (name: string) => {
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
      <div className="space-y-6 max-w-4xl">
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
                    <SelectItem value="pengajaran">Pengajaran</SelectItem>
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
                        ? format(formData.tanggalMulai, "dd MMMM yyyy")
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
                        ? format(formData.tanggalSelesai, "dd MMMM yyyy")
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

        {/* Section 2: Dosen yang Terlibat */}
        <Card>
          <CardHeader>
            <CardTitle>Dosen yang Terlibat</CardTitle>
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
                  {user?.nidn && (
                    <p className="text-xs text-muted-foreground font-mono">
                      NIDN: {user.nidn}
                    </p>
                  )}
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
                  placeholder="Cari nama dosen..."
                  value={searchAnggota}
                  onChange={(e) => setSearchAnggota(e.target.value)}
                  className="pl-9"
                />
                {searchAnggota && filteredDosen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredDosen.map((dosen) => (
                      <button
                        key={dosen.id}
                        onClick={() => handleAddAnggota(dosen)}
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
                              NIDN: {dosen.nidn}
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

            {/* Added Members */}
            {anggota.length > 0 && (
              <div className="space-y-2">
                {anggota.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(dosen.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dosen.name}</p>
                        {dosen.nidn && (
                          <p className="text-xs text-muted-foreground font-mono">
                            NIDN: {dosen.nidn}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {dosen.programStudi}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Anggota</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAnggota(dosen.id)}
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

        {/* Section 3: Lampiran Bukti */}
        <Card>
          <CardHeader>
            <CardTitle>Lampiran Bukti Kegiatan</CardTitle>
            <CardDescription>
              Setiap dosen yang terlibat harus mengupload dokumen bukti
              masing-masing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dokumen per Dosen */}
            {lampiran.length > 0 ? (
              <div className="space-y-4">
                {/* Group by dosen */}
                {Array.from(new Set(lampiran.map((d) => d.uploadedBy))).map(
                  (dosenId) => {
                    const dosenDocs = lampiran.filter(
                      (d) => d.uploadedBy === dosenId
                    );
                    const dosenName = dosenDocs[0]?.uploadedByName || "Unknown";
                    const isCurrentUser = user?.name === dosenName;

                    return (
                      <div
                        key={dosenId}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(dosenName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{dosenName}</p>
                              <p className="text-xs text-muted-foreground">
                                {dosenDocs.length} dokumen
                              </p>
                            </div>
                          </div>
                          {isCurrentUser && (
                            <Badge className="bg-blue-500">Anda</Badge>
                          )}
                        </div>

                        <div className="space-y-2 pl-12">
                          {dosenDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {doc.name}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {doc.jenis}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {doc.tanggal}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/documents/${doc.id}/preview`, {
                                      state: {
                                        allowHighlight: true,
                                        breadcrumbs: [
                                          {
                                            label: "Beranda",
                                            path: "/dashboard",
                                          },
                                          {
                                            label: "Kegiatan Tridharma",
                                            path: "/activities",
                                          },
                                          {
                                            label: isEdit
                                              ? "Edit Kegiatan"
                                              : "Tambah Kegiatan Baru",
                                            path: isEdit
                                              ? `/activities/${id}/edit`
                                              : "/activities/new",
                                          },
                                          { label: doc.name },
                                        ],
                                      },
                                    })
                                  }
                                >
                                  <Highlighter className="w-4 h-4" />
                                </Button>
                                {isCurrentUser && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {isCurrentUser && (
                          <div className="pl-12">
                            <Button variant="outline" size="sm">
                              <Plus className="w-4 h-4 mr-2" />
                              Tambah Dokumen
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

                {/* Dosen yang belum upload */}
                {[user, ...anggota]
                  .filter((dosen): dosen is Dosen => dosen !== null)
                  .map((dosen) => (
                    <div
                      key={dosen.id}
                      className="border rounded-lg p-4 space-y-3 border-red-200 bg-red-50/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(dosen.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{dosen.name}</p>
                            <p className="text-xs text-red-600">
                              Belum mengupload dokumen
                            </p>
                          </div>
                        </div>
                        {user?.name === dosen.name && (
                          <Badge className="bg-blue-500">Anda</Badge>
                        )}
                      </div>

                      {user?.name === dosen.name && (
                        <div className="pl-12">
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Dokumen Bukti
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada dokumen bukti yang diupload</p>
                <p className="text-sm mt-1">
                  Setiap dosen yang terlibat harus mengupload dokumen bukti
                </p>
              </div>
            )}

            {/* Upload untuk user saat ini jika belum upload */}
            {user &&
              !lampiran.some((doc) => doc.uploadedByName === user.name) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    Pilih dari Dokumen Saya
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Unggah Dokumen Baru
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between sticky bottom-6 bg-background p-4 border rounded-lg shadow-lg">
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
            <Button onClick={handleSubmit}>Simpan Kegiatan</Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kegiatan <strong>{formData.namaKegiatan}</strong> beserta seluruh
              asosiasinya akan dihapus. Dokumen bukti yang terlampir tidak akan
              terhapus, tetapi asosiasi dengan kegiatan ini akan hilang.
              Tindakan ini dicatat permanen di blockchain.
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
