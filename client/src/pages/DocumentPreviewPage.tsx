import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { MainLayout } from "../components/layout/MainLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

type IntegrityStatus = "valid" | "invalid" | "not_recorded";

interface DocumentPreview {
  id: string;
  name: string;
  jenis: string;
  sumber: string;
  tanggalUpload: string;
  contentType: string;
  size: number;
  databaseHash: string;
  contentHash: string;
  contentMatchesDatabase: boolean;
  blockchainIntegrity: {
    status: IntegrityStatus;
    blockchainHash: string | null;
    txId: string | null;
    activityId: string | null;
    blockHeight: number | null;
    confirmations: number;
    checkedAt: string;
  };
}

export function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentPreview | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [servedHash, setServedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const activityId = location.state?.activityId as string | undefined;
  const apiPrefix = user?.roles.includes("admin_tu")
    ? "/api/tatausaha/dokumen"
    : "/api/dosen/dokumen";

  useEffect(() => {
    if (!id) return;

    let objectUrl: string | null = null;
    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = activityId
          ? `?activityId=${encodeURIComponent(activityId)}`
          : "";
        const headers = { Authorization: `Bearer ${token}` };
        const [previewResponse, contentResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/preview${query}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/content`, { headers }),
        ]);

        const previewResult = await previewResponse.json();
        if (!previewResponse.ok || previewResult.status !== "success") {
          throw new Error(previewResult.error || "Gagal mengambil informasi dokumen");
        }
        if (!contentResponse.ok) {
          const contentResult = await contentResponse.json();
          throw new Error(contentResult.error || "Gagal mengambil file dokumen");
        }

        const blob = await contentResponse.blob();
        objectUrl = URL.createObjectURL(blob);
        setDocument(previewResult.data);
        setServedHash(contentResponse.headers.get("X-Content-SHA256"));
        setFileUrl(objectUrl);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat dokumen");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocument();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activityId, apiPrefix, id, token]);

  const integrity = useMemo(() => {
    if (!document) return null;

    const blockchainHash = document.blockchainIntegrity.blockchainHash;
    const exactServedHash = servedHash || document.contentHash;
    const status: IntegrityStatus = blockchainHash
      ? exactServedHash === blockchainHash
        ? "valid"
        : "invalid"
      : "not_recorded";

    return { ...document.blockchainIntegrity, status, exactServedHash };
  }, [document, servedHash]);

  const breadcrumbs = location.state?.breadcrumbs || [
    { label: "Beranda", path: "/dashboard" },
    { label: "Dokumen Saya", path: "/documents" },
    { label: document?.name || "Preview Dokumen" },
  ];

  const handleDownload = () => {
    if (!fileUrl || !document) return;
    const anchor = window.document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = document.name;
    anchor.click();
  };

  if (isLoading) {
    return (
      <MainLayout title="Preview Dokumen" breadcrumbs={breadcrumbs}>
        <div className="flex min-h-[420px] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat file dan memeriksa integritas...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !document || !fileUrl || !integrity) {
    return (
      <MainLayout title="Preview Dokumen" breadcrumbs={breadcrumbs}>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">{error || "Dokumen tidak dapat dimuat."}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isPdf = document.contentType === "application/pdf";

  return (
    <MainLayout title="Preview Dokumen" breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <X className="mr-2 h-4 w-4" />
              Tutup
            </Button>
            <div className="min-w-0">
              <p className="truncate font-medium">{document.name}</p>
              <p className="text-xs text-muted-foreground">
                {(document.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Unduh
          </Button>
        </div>

        <div
          className={`flex items-start gap-3 border p-4 ${
            integrity.status === "valid"
              ? "border-green-300 bg-green-50 text-green-900"
              : integrity.status === "invalid"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {integrity.status === "valid" ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">
                {integrity.status === "valid"
                  ? "Integritas dokumen terverifikasi"
                  : integrity.status === "invalid"
                    ? "Hash dokumen tidak sesuai dengan blockchain"
                    : "Dokumen belum tercatat pada blockchain"}
              </p>
              {integrity.status === "valid" && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Valid
                </Badge>
              )}
            </div>
            <p className="break-all font-mono text-xs">
              Hash file: {integrity.exactServedHash}
            </p>
            {integrity.txId && (
              <p className="break-all font-mono text-xs">
                TX: {integrity.txId} | Blok #{integrity.blockHeight ?? "-"} |{" "}
                {integrity.confirmations} konfirmasi
              </p>
            )}
          </div>
        </div>

        {!document.contentMatchesDatabase && (
          <div className="flex items-center gap-3 border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="h-5 w-5 shrink-0" />
            File di penyimpanan tidak sesuai dengan hash database.
          </div>
        )}

        {isPdf ? (
          <iframe
            title={document.name}
            src={fileUrl}
            className="h-[calc(100vh-280px)] min-h-[620px] w-full border bg-white"
          />
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 border bg-muted/20 text-center">
            <FileText className="h-14 w-14 text-muted-foreground" />
            <div>
              <p className="font-medium">{document.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Preview langsung tidak tersedia untuk DOCX.
              </p>
            </div>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Unduh Dokumen
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
