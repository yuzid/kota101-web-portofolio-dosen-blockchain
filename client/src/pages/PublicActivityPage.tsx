import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Clock,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  transformPublicActivity,
  getFileType,
  getOwnerDosenIds,
  type PublicActivity,
  type RawDocEntry,
} from "../lib/publicActivityTransform";
import { PublicPdfPreview } from "../components/public/PublicPdfPreview";

const API_URL = import.meta.env.VITE_API_URL;

const jenisColor: Record<string, string> = {
  pendidikan: "border-l-blue-500",
  penelitian: "border-l-green-500",
  pengabdian: "border-l-purple-500",
  tugas_tambahan: "border-l-orange-500",
};
const jenisBadge: Record<string, string> = {
  pendidikan: "bg-blue-100 text-blue-800 border-blue-200",
  penelitian: "bg-green-100 text-green-800 border-green-200",
  pengabdian: "bg-purple-100 text-purple-800 border-purple-200",
  tugas_tambahan: "bg-orange-100 text-orange-800 border-orange-200",
};
const jenisIcon: Record<string, React.ReactNode> = {
  pendidikan: <GraduationCap className="w-4 h-4" />,
  penelitian: <BookOpen className="w-4 h-4" />,
  pengabdian: <Users className="w-4 h-4" />,
  tugas_tambahan: <FileText className="w-4 h-4" />,
};

export function PublicActivityPage() {
  const { id } = useParams();
  const location = useLocation();
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDokumenMode = location.pathname.endsWith("/dokumen");

  useEffect(() => {
    if (id) fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/public/kegiatan/${id}`);
      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }
      if (!response.ok) {
        throw new Error("SERVER_ERROR");
      }
      const result = await response.json();
      if (result.status !== "success" || !result.data) {
        throw new Error(result.error || "Kegiatan tidak ditemukan");
      }
      const { activity: transformed, docEntries } = transformPublicActivity(result.data);

      if (docEntries.length > 0) {
        const docResults = await Promise.allSettled(
          docEntries.map((doc: RawDocEntry) =>
            fetch(`${API_URL}/api/public/dokumen/${doc.id}`)
              .then((r) => r.json())
              .then((r) => (r.status === "success" ? r.data : null))
          )
        );

        if (transformed.jenisBukti === "BERSAMA") {
          docResults.forEach((result) => {
            if (result.status !== "fulfilled" || !result.value) return;
            const detail = result.value;
            const sharedDoc = transformed.dokumenBersama.find(
              (d) => d.id === detail.id
            );
            if (sharedDoc) {
              if (detail.file_path) sharedDoc.filePath = detail.file_path;
              if (detail.hash_file) sharedDoc.hashFile = detail.hash_file;
            }
          });
        } else {
          docResults.forEach((result) => {
            if (result.status !== "fulfilled" || !result.value) return;
            const detail = result.value;
            const ownerIds = getOwnerDosenIds(detail);
            transformed.dosenTerlibat.forEach((dosen) => {
              if (ownerIds.includes(dosen.id)) {
                const existing = dosen.dokumen.find(
                  (d) => d.id === detail.id
                );
                if (!existing) {
                  dosen.dokumen.push({
                    id: detail.id,
                    name: detail.nama || "Tanpa Nama",
                    jenis: detail.jenis_dokumen || "-",
                    tanggalUpload: detail.tanggal_upload || "",
                    hashFile: detail.hash_file || "",
                    filePath: detail.file_path || "",
                  });
                } else {
                  if (detail.file_path) existing.filePath = detail.file_path;
                  if (detail.hash_file) existing.hashFile = detail.hash_file;
                }
              }
            });
          });
        }
      }

      setActivity(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data kegiatan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const statusBadge = (status: string) => {
    switch (status) {
      case "DITERIMA":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" /> Diterima
          </Badge>
        );
      case "DITOLAK":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Memuat data kegiatan...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    const is404 = error === "NOT_FOUND";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {is404 ? "Kegiatan Tidak Ditemukan" : "Gagal Memuat Data"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {is404
                ? "Kegiatan yang Anda cari tidak tersedia atau telah dihapus."
                : "Terjadi kesalahan saat memuat data. Silakan coba lagi nanti."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jType = activity.jenisTridharma?.toLowerCase() || "";

  if (isDokumenMode) {
    return renderDokumenMode(activity, jType, getInitials, statusBadge);
  }

  return renderFullMode(activity, jType, getInitials, statusBadge);
}

function renderFullMode(
  activity: PublicActivity,
  jType: string,
  getInitials: (name: string) => string,
  statusBadge: (status: string) => React.ReactNode
) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Detail Kegiatan Tridharma
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informasi publik kegiatan dosen
          </p>
        </div>

        <Card
          className={`overflow-hidden border-l-4 ${
            jenisColor[jType] || "border-l-gray-300"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={jenisBadge[jType] || ""}>
                    {jenisIcon[jType]}{" "}
                    <span className="ml-1 capitalize">
                      {activity.jenisTridharma?.replace("_", " ") || "-"}
                    </span>
                  </Badge>
                  <Badge variant="secondary">{activity.kategori}</Badge>
                  {activity.statusKelengkapan === "lengkap" ? (
                    <Badge className="bg-green-500 text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Dokumen Lengkap
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" /> Dokumen Tidak
                      Lengkap
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {activity.namaKegiatan}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Informasi Kegiatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Tanggal Mulai"
                value={formatDate(activity.tanggalMulai)}
              />
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Tanggal Selesai"
                value={formatDate(activity.tanggalSelesai)}
              />
              <InfoItem
                icon={<GraduationCap className="w-4 h-4" />}
                label="Tahun Akademik"
                value={activity.tahunAkademik}
              />
              <InfoItem
                icon={<BookOpen className="w-4 h-4" />}
                label="Semester"
                value={activity.semester}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Dosen Terlibat
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {activity.dosenTerlibat.length} dosen
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.dosenTerlibat.map((dosen) => (
              <div
                key={dosen.id}
                className="border rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
                      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                        {getInitials(dosen.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {dosen.name}
                        </span>
                        {dosen.peran === "KETUA" && (
                          <Badge className="bg-purple-500 text-xs h-5">
                            {dosen.peran}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        NIDN: {dosen.nidn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(dosen.status)}
                  </div>
                </div>

                {dosen.dokumen.length > 0 && (
                  <div className="p-4 space-y-4">
                    {dosen.dokumen.map((doc) => (
                      <DocPreviewBlock
                        key={doc.id}
                        doc={doc}
                        label={doc.name}
                      />
                    ))}
                  </div>
                )}

                {activity.jenisBukti !== "BERSAMA" && dosen.dokumen.length === 0 && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground italic">
                      Belum ada dokumen bukti
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {activity.jenisBukti === "BERSAMA" && activity.dokumenBersama.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Dokumen Bersama
                <Badge variant="secondary" className="text-xs">
                  {activity.dokumenBersama.length} file
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.dokumenBersama.map((doc) => (
                <DocPreviewBlock
                  key={doc.id}
                  doc={doc}
                  label={doc.name}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Total Dosen Terlibat"
            value={activity.dosenTerlibat.length.toString()}
            bg="bg-blue-50 border-blue-200"
          />
          <SummaryCard
            icon={<FileText className="w-5 h-5 text-green-600" />}
            label={
              activity.jenisBukti === "BERSAMA"
                ? "Total Dokumen Bersama"
                : "Total Dokumen Bukti"
            }
            value={
              activity.jenisBukti === "BERSAMA"
                ? activity.dokumenBersama.length.toString()
                : activity.dosenTerlibat
                    .reduce((s, d) => s + d.dokumen.length, 0)
                    .toString()
            }
            bg="bg-green-50 border-green-200"
          />
          <SummaryCard
            icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
            label={
              activity.jenisBukti === "BERSAMA"
                ? "Status Dokumen"
                : "Dosen Belum Upload"
            }
            value={
              activity.jenisBukti === "BERSAMA"
                ? activity.dokumenBersama.length > 0
                  ? "Ada"
                  : "Kosong"
                : activity.dosenTerlibat
                    .filter(
                      (d) => d.dokumen.length === 0 && d.status === "DITERIMA"
                    )
                    .length.toString()
            }
            bg="bg-amber-50 border-amber-200"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">
          Data ini bersifat publik dan dapat dibagikan. Terakhir diperbarui
          melalui sistem blockchain.
        </p>
      </div>
    </div>
  );
}

function renderDokumenMode(
  activity: PublicActivity,
  _jType: string,
  _getInitials: (name: string) => string,
  _statusBadge: (status: string) => React.ReactNode
) {
  const allDocs =
    activity.jenisBukti === "BERSAMA"
      ? activity.dokumenBersama
      : activity.dosenTerlibat.flatMap((d) => d.dokumen);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">
            Dokumen Bukti Kegiatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activity.namaKegiatan}
          </p>
        </div>

        {activity.jenisBukti === "BERSAMA" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Dokumen Bersama
                  <Badge variant="secondary" className="text-xs">
                    {activity.dokumenBersama.length} file
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activity.dokumenBersama.map((doc) => (
                  <div key={doc.id} className="space-y-3">
                    <DocPreviewBlock doc={doc} label={doc.name} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {activity.dosenTerlibat.map((dosen) => (
              <Card key={dosen.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {dosen.name}
                    <Badge variant="outline" className="text-xs">
                      NIDN: {dosen.nidn}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dosen.dokumen.length > 0 ? (
                    dosen.dokumen.map((doc) => (
                      <DocPreviewBlock
                        key={doc.id}
                        doc={doc}
                        label={doc.name}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Belum ada dokumen bukti
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Blockchain status summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              Verifikasi Blockchain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allDocs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada dokumen yang tercatat
                </p>
              )}
              {allDocs.map((doc) => {
                const verified = doc.hashFile && doc.hashFile !== "-";
                return (
                  <div
                    key={doc.id}
                    className={`rounded-lg border-2 p-4 ${
                      verified
                        ? "border-green-200 bg-green-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {verified ? (
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className={`text-sm font-semibold mt-1 ${
                          verified ? "text-green-700" : "text-yellow-700"
                        }`}>
                          {verified
                            ? "Terdokumentasi di Blockchain"
                            : "Belum Tercatat di Blockchain"}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          verified ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {verified
                            ? "Dokumen ini telah diverifikasi dan dicatat pada jaringan blockchain."
                            : "Dokumen ini belum dicatat pada jaringan blockchain."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-4">
          Dokumen ini bersifat publik dan dapat dibagikan.
        </p>
      </div>
    </div>
  );
}

function DocPreviewBlock({
  doc,
  label,
}: {
  doc: { id: string; name: string; filePath: string; hashFile: string };
  label: string;
}) {
  const fileType = getFileType(doc.filePath);

  if (!doc.filePath) {
    return (
      <div className="border rounded-lg p-4 bg-muted/10">
        <p className="font-medium text-sm mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">
          Pratinjau tidak tersedia
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/20 border-b">
        <p className="font-medium text-sm truncate flex-1">{label}</p>
        <Badge
          variant="outline"
          className="text-[10px] ml-2 shrink-0"
        >
          {fileType === "pdf"
            ? "PDF"
            : fileType === "image"
              ? "Gambar"
              : "Dokumen"}
        </Badge>
      </div>
      <div className="bg-white">
        {fileType === "pdf" && (
          <PublicPdfPreview
            fileUrl={doc.filePath}
            documentId={doc.id}
          />
        )}
        {fileType === "image" && (
          <div className="p-4 flex justify-center">
            <img
              src={doc.filePath}
              alt={label}
              className="max-w-full max-h-[600px] object-contain rounded"
            />
          </div>
        )}
        {fileType === "other" && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Pratinjau tidak tersedia untuk format ini</p>
            <a
              href={doc.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Buka Dokumen
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="p-2 rounded-lg bg-background border shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium capitalize mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}
