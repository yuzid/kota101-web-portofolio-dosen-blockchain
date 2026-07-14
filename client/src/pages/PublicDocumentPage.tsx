import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { PageTransition } from "../components/ui/page-transition";
import { EmptyState } from "../components/ui/empty-state";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  User,
  Loader2,
  ExternalLink,
  FileType,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getFileType } from "../lib/publicActivityTransform";
import { PublicPdfPreview } from "../components/public/PublicPdfPreview";

const API_URL = import.meta.env.VITE_API_URL;

export function PublicDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/public/dokumen/${id}`);
      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }
      if (!response.ok) {
        throw new Error("SERVER_ERROR");
      }
      const result = await response.json();
      if (result.status !== "success" || !result.data) {
        throw new Error(result.error || "Dokumen tidak ditemukan");
      }
      setDoc(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat dokumen"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    const is404 = error === "NOT_FOUND";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <EmptyState
          icon={<AlertTriangle className="w-10 h-10 text-destructive" />}
          title={is404 ? "Dokumen Tidak Ditemukan" : "Gagal Memuat Data"}
          description={is404
            ? "Dokumen yang Anda cari tidak tersedia atau telah dihapus."
            : "Terjadi kesalahan saat memuat data. Silakan coba lagi nanti."}
          action={
            <Button variant="outline" onClick={() => navigate('/')}>
              Kembali ke Beranda
            </Button>
          }
        />
      </div>
    );
  }

  const docType = doc.jenis_dokumen?.toLowerCase() || "";
  const fileType = getFileType(doc.file_path || "");
  const verified = doc.hash_file && doc.hash_file !== "-";
  const owners = doc.kepemilikan || [];
  const kegiatanList = doc.lampiran_bukti
    ?.filter((lb: any) => lb.kegiatan)
    .map((lb: any) => lb.kegiatan) || [];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
       {/* Header */}
       <div className="border-b bg-card">
         <div className="max-w-4xl mx-auto px-4 py-4">
           <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* ── Metadata Header ── */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="capitalize">
              {docType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <FileType className="w-3 h-3 mr-1" />
              {fileType === "pdf"
                ? "PDF"
                : fileType === "image"
                  ? "Gambar"
                  : "Dokumen"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {doc.nama || "Tanpa Nama"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {doc.tanggal_upload
                ? format(new Date(doc.tanggal_upload), "dd MMMM yyyy", {
                    locale: localeId,
                  })
                : "-"}
            </span>
          </div>
        </div>

        {/* ── Blockchain Status ── */}
        <div
          className={`rounded-xl border-2 p-5 ${
             verified
               ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
               : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950"
           }`}
         >
           <div className="flex items-start gap-4">
             <div className={`p-2 rounded-full ${verified ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900"}`}>
               {verified ? (
                 <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
               ) : (
                 <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
               )}
             </div>
             <div>
               <p className={`text-base font-semibold ${verified ? "text-green-800 dark:text-green-300" : "text-yellow-800 dark:text-yellow-300"}`}>
                 {verified
                   ? "Terdokumentasi di Blockchain"
                   : "Belum Tercatat di Blockchain"}
               </p>
               <p className={`text-sm mt-1 ${verified ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                 {verified
                   ? "Dokumen ini telah diverifikasi dan dicatat pada jaringan blockchain."
                   : "Dokumen ini belum dicatat pada jaringan blockchain."}
               </p>
            </div>
          </div>
        </div>

        {/* ── Owner Info ── */}
        {owners.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pemilik Dokumen</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {owners.map((k: any) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border text-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                    {(k.dosen?.nama || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{k.dosen?.nama || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      NIDN: {k.dosen?.nidn || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Kegiatan Terkait ── */}
        {kegiatanList.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Kegiatan Terkait ({kegiatanList.length})</span>
            </div>
            <div className="space-y-2">
              {kegiatanList.map((k: any) => (
                <div
                  key={k.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{k.nama_kegiatan}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {k.kategori_tridharma && (
                        <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                          {k.kategori_tridharma.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {k.tanggal_mulai && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(k.tanggal_mulai), "dd MMM yyyy", { locale: localeId })}
                          {k.tanggal_selesai && (
                            <> – {format(new Date(k.tanggal_selesai), "dd MMM yyyy", { locale: localeId })}</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Document Preview ── */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pratinjau Dokumen</span>
            </div>
          </div>
          {doc.file_path ? (
            <>
              {fileType === "pdf" && (
                <PublicPdfPreview
                  fileUrl={`${API_URL}/api/public/dokumen/${doc.id}/content`}
                  kepemilikanId={owners[0]?.id}
                />
              )}
              {fileType === "image" && (
                <div className="p-6 flex justify-center bg-muted">
                  <img
                    src={`${API_URL}/api/public/dokumen/${doc.id}/content`}
                    alt={doc.nama}
                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
              {fileType === "other" && (
                <div className="py-16 px-6 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Pratinjau tidak tersedia untuk format ini
                  </p>
                  <a
                    href={`${API_URL}/api/public/dokumen/${doc.id}/content`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buka Dokumen
                    </Button>
                  </a>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="File Dokumen Tidak Tersedia"
              description="Dokumen ini tidak memiliki file yang dapat ditampilkan."
            />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-6">
          Dokumen ini bersifat publik dan dapat dibagikan.
        </p>
      </div>
    </div>
    </PageTransition>
   );
}
