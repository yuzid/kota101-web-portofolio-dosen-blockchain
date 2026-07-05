import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { RippleButton } from "../components/ui/ripple-button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  ExternalLink,
  Save,
  Trash2,
  X,
  FileWarning,
  Eye,
  Calendar,
  Search,
  ListFilter,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { getAllJenisDokumen } from "@/lib/utils";

interface Dosen {
  id: string;
  nama: string;
  nip: string;
  program_studi?: { id: string; nama_prodi: string };
}

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

  const [allDosen, setAllDosen] = useState<Dosen[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [initialRecipientIds, setInitialRecipientIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedProdiId, setSelectedProdiId] = useState<string>("all");
  const [showNewJenisInput, setShowNewJenisInput] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");

  const uniqueProdis = useMemo(
    () => Array.from(new Map(allDosen.filter(d => d.program_studi).map(d => [d.program_studi!.id, d.program_studi])).values()),
    [allDosen]
  );

  const filteredDosen = useMemo(() => {
    let list = allDosen;
    if (selectedProdiId !== "all") {
      list = list.filter(d => d.program_studi?.id === selectedProdiId);
    }
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase();
      list = list.filter(d => d.nama.toLowerCase().includes(q) || d.nip.includes(q));
    }
    return list.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [allDosen, selectedProdiId, recipientSearch]);

  const toggleRecipient = (dosenId: string) => {
    setSelectedRecipientIds(prev =>
      prev.includes(dosenId) ? prev.filter(id => id !== dosenId) : [...prev, dosenId]
    );
  };

  const [formData, setFormData] = useState({
    nama: "",
    jenis_dokumen: "",
    tanggal_upload: "",
  });
  const [existingFile, setExistingFile] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [hasFileChange, setHasFileChange] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (id) fetchDokumen();
    else setLoading(false);
  }, [id]);

  const fetchDokumen = async () => {
    try {
      const [resDosen, resDoc] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/detail`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
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
      const result = await resDoc.json();
      if (result.status === "success") {
        const d = result.data;
        setFormData({
          nama: d.nama,
          jenis_dokumen: d.jenis_dokumen,
          tanggal_upload: d.tanggal_upload?.split("T")[0] || "",
        });
        setExistingFile(d.file_path);
        const existing = (d.distribusi || []).map((item: any) => item.dosen_id);
        setSelectedRecipientIds(existing);
        setInitialRecipientIds(existing);
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
      // 1. Save metadata
      const metaPayload = { nama: formData.nama, jenis_dokumen: formData.jenis_dokumen, tanggal_upload: formData.tanggal_upload };
      const metaRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/metadata`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(metaPayload),
      });
      const metaResult = await metaRes.json();
      if (metaResult.status !== "success") throw new Error(metaResult.error || "Gagal menyimpan metadata.");

      // 2. Save file change
      if (hasFileChange && newFile) {
        const formDataFile = new FormData();
        formDataFile.append("file", newFile);
        const fileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/replace-file`, {
          method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formDataFile,
        });
        const fileResult = await fileRes.json();
        if (fileResult.status !== "success") throw new Error(fileResult.error || "Gagal mengganti file.");
      }

      // 3. Sync recipients
      const toRemove = initialRecipientIds.filter(id => !selectedRecipientIds.includes(id));
      const toAdd = selectedRecipientIds.filter(id => !initialRecipientIds.includes(id));

      if (toRemove.length > 0) {
        // Fetch distribusi IDs for recipients to remove
        const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/detail`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detailResult = await detailRes.json();
        if (detailResult.status === "success") {
          const distribusiList: { id: string; dosen_id: string }[] = detailResult.data.distribusi || [];
          for (const item of distribusiList) {
            if (toRemove.includes(item.dosen_id)) {
              await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribusi/${item.id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
              });
            }
          }
        }
      }

      if (toAdd.length > 0) {
        const addRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/distribute`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ dokumen_id: id, dosen_penerima_ids: toAdd }),
        });
        const addResult = await addRes.json();
        if (addResult.status !== "success") throw new Error(addResult.error || "Gagal menambahkan penerima.");
      }

      toast.success("Dokumen berhasil diperbarui.");
      navigate(`/document-distribution/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const removeNewFile = () => {
    setNewFile(null);
    setHasFileChange(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <MainLayout title="Edit Dokumen" breadcrumbs={[{ label: "Edit Dokumen" }]}>
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6 max-w-3xl mx-auto"
      >
        {/* ── Back ── */}
        <Button variant="ghost" onClick={() => navigate(id ? `/document-distribution/${id}` : "/document-distribution")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>

        {/* ── Form Card ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Edit Dokumen</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Perbarui informasi dan file dokumen yang akan didistribusikan.
            </p>
            <Separator className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ── Nama Dokumen ── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Nama Dokumen <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama dokumen"
                  maxLength={100}
                  className="border-gray-300 focus-visible:ring-primary/50 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                  {formData.nama.length}/100
                </span>
              </div>
            </div>

            {/* ── Jenis Dokumen ── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Jenis Dokumen <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.jenis_dokumen}
                onValueChange={(val) => {
                  if (val === '__TAMBAH__') {
                    setShowNewJenisInput(true);
                    setNewJenisName("");
                    return;
                  }
                  setShowNewJenisInput(false);
                  setFormData({ ...formData, jenis_dokumen: val });
                }}
              >
                <SelectTrigger className="border-gray-300 focus-visible:ring-primary/50">
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  {getAllJenisDokumen().map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                  <SelectItem value="__TAMBAH__">+ Tambah Jenis Baru...</SelectItem>
                </SelectContent>
              </Select>
              {showNewJenisInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Nama jenis dokumen baru..."
                    value={newJenisName}
                    onChange={(e) => setNewJenisName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={async () => {
                    if (newJenisName.trim()) {
                      const formatted = newJenisName.trim().toUpperCase().replace(/\s+/g, '_');
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tatausaha/jenis-dokumen`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ nama: formatted })
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                          const { fetchAndCacheJenisDokumen } = await import("@/lib/utils");
                          await fetchAndCacheJenisDokumen();
                          setFormData({ ...formData, jenis_dokumen: formatted });
                          setShowNewJenisInput(false);
                          setNewJenisName("");
                          toast.success(`Jenis "${newJenisName.trim()}" berhasil ditambahkan.`);
                        } else {
                          toast.error(result.error || 'Gagal menambahkan jenis dokumen');
                        }
                      } catch {
                        toast.error('Gagal menghubungi server');
                      }
                    }
                  }}>Tambah</Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Pilih kategori yang sesuai dengan jenis dokumen.</p>
            </div>

            {/* ── Tanggal Upload ── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Tanggal Upload <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.tanggal_upload}
                onChange={(e) => setFormData({ ...formData, tanggal_upload: e.target.value })}
                className="border-gray-300 focus-visible:ring-primary/50 w-full sm:w-64"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Pilih tanggal upload dokumen
              </p>
            </div>

            {/* ── Separator ── */}
            <Separator />

            {/* ── Section: File Dokumen ── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">File Dokumen</Label>

              {/* Existing file */}
              {existingFile && !hasFileChange && (
                <div className="flex items-center gap-4 p-4 border rounded-xl bg-gray-50/70 border-gray-200">
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 shrink-0">
                     <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formData.nama || "File"}.{existingFile.split('.').pop()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dokumen saat ini</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs h-8">
                      <a href={`${import.meta.env.VITE_API_URL}/api/tatausaha/dokumen/${id}/preview`} target="_blank" rel="noreferrer">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Lihat File
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* New file preview */}
              {hasFileChange && newFile && (
                <div className="flex items-center gap-4 p-4 border rounded-xl bg-amber-50/70 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800">
                   <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 shrink-0">
                    <FileWarning className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{newFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      File baru — {(newFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeNewFile} className="shrink-0 text-red-500 hover:text-red-700 h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload dropzone */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ganti File</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-muted border border-border mx-auto mb-3 w-fit group-hover:bg-primary/5 group-hover:border-primary/30 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop file di sini, atau <span className="text-primary underline underline-offset-2">klik untuk memilih</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">Format yang didukung: PDF. Ukuran maksimal: 20MB</p>
                </div>
              </div>
            </div>

            {/* ── Separator ── */}
            <Separator />

            {/* ── Pilih Penerima ── */}
            <div className="border rounded-xl overflow-hidden">
              {/* ── Header ── */}
              <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Pilih penerima</h3>
                  <p className="text-[11px] text-muted-foreground">Pilih dosen yang akan menerima dokumen ini</p>
                </div>
              </div>

              {/* ── Filter Controls ── */}
              <div className="px-4 pt-3 pb-2 border-b">
                <div className="grid grid-cols-[55fr_45fr] gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Cari dosen..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Select value={selectedProdiId} onValueChange={setSelectedProdiId}>
                      <SelectTrigger className="bg-background h-9 text-sm w-full min-w-0">
                        <SelectValue placeholder="Filter Prodi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Program Studi</SelectItem>
                        {uniqueProdis.map((prodi) => (
                          <SelectItem key={prodi.id} value={prodi.id}>{prodi.nama_prodi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Selected Chips ── */}
              {selectedRecipientIds.length > 0 && (
                <div className="px-4 py-2 border-b bg-blue-50/30 dark:bg-blue-950/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-blue-700">{selectedRecipientIds.length} dosen dipilih</span>
                    <button onClick={() => setSelectedRecipientIds([])} className="text-[11px] text-blue-600 hover:underline">Hapus semua</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedRecipientIds.map((id) => {
                      const d = allDosen.find(d => d.id === id);
                      return d ? (
                        <Badge key={id} variant="secondary" className="cursor-pointer gap-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" onClick={() => toggleRecipient(id)}>
                          {d.nama}<X className="w-3 h-3" />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* ── Daftar Dosen ── */}
              <div className="max-h-[220px] overflow-y-auto bg-background">
                {filteredDosen.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {recipientSearch ? "Tidak ada dosen yang cocok." : "Tidak ada dosen di prodi ini."}
                  </p>
                ) : filteredDosen.map((dosen) => {
                  const isSelected = selectedRecipientIds.includes(dosen.id);
                  return (
                    <div
                      key={dosen.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-border last:border-b-0 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"}`}
                      onClick={() => toggleRecipient(dosen.id)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dosen.nama}</p>
                        <p className="text-[11px] text-muted-foreground">
                          NIP: {dosen.nip}
                          {selectedProdiId === "all" && dosen.program_studi ? ` · ${dosen.program_studi.nama_prodi}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-background pt-4 pb-2 border-t">
          <Button variant="outline" onClick={() => navigate(id ? `/document-distribution/${id}` : "/document-distribution")}>
            Batal
          </Button>
          <RippleButton onClick={handleSubmit} disabled={saving} className="min-w-[150px]">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>
            )}
          </RippleButton>
        </div>
      </motion.div>

      <ConfirmDialog
        open={showReplaceConfirm}
        onOpenChange={setShowReplaceConfirm}
        title="Ganti File Dokumen?"
        description="Anda akan mengganti file dokumen saat ini dengan versi baru. Lanjutkan?"
        confirmLabel="Ya, Ganti File"
        variant="warning"
        onConfirm={confirmReplaceFile}
      />

      <ConfirmDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Simpan Perubahan?"
        description="Apakah Anda yakin ingin menyimpan perubahan pada dokumen ini?"
        confirmLabel="Simpan Perubahan"
        onConfirm={confirmSubmit}
      />
    </MainLayout>
  );
}
