import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  FileWarning,
  Highlighter,
  List,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Share2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { MainLayout } from "../components/layout/MainLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { HighlightOverlay } from "../components/document/HighlightOverlay";
import { HighlightMenu } from "../components/document/HighlightMenu";
import { 
  getHighlightsByDokumenId,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  syncHighlights,
} from "../services/highlightService";
import type { Highlight } from "../services/highlightService";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { format } from "date-fns";
import { cn, getAllJenisDokumen } from "@/lib/utils";
import { DocumentSharing } from "../components/document/DocumentSharing";
import { isHighlightMockMode } from "../services/highlightService";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

interface DragState {
  startX: number;
  startY: number;
  pageNumber: number;
  pageEl: HTMLElement;
}

interface PageInfo {
  pdfWidth: number;
  pdfHeight: number;
  rotate: number;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfos, setPageInfos] = useState<Record<number, PageInfo>>({});
  const [zoom, setZoom] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [kepemilikanId, setKepemilikanId] = useState<string | null>(null);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const [addMode, setAddMode] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewRect, setPreviewRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const [menuHighlight, setMenuHighlight] = useState<{
    highlight: Highlight;
    position: { x: number; y: number };
  } | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", jenis: "", tanggal: undefined as Date | undefined });
  const [saving, setSaving] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [hasFileChange, setHasFileChange] = useState(false);

  const [docxWarning, setDocxWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allowHighlight] = useState(() => {
    return (location.state as Record<string, unknown>)?.allowHighlight === true;
  });

  const isDocumentOwner = (location.state as Record<string, unknown>)?.isDocumentOwner !== false;

  const [historyStack, setHistoryStack] = useState<Highlight[][]>([]);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);

  const token = localStorage.getItem("token");
  const activityId = location.state?.activityId as string | undefined;
  const apiPrefix = user?.roles.includes("staf_tu")
    ? "/api/tatausaha/dokumen"
    : "/api/dosen/dokumen";
  const fromPendingRequest = (location.state as Record<string, unknown>)?.fromPendingRequest === true;
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmAccept = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${id}/terima`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen berhasil diterima.");
        navigate("/documents");
      } else {
        toast.error(result.error || "Gagal menerima dokumen.");
      }
    } catch {
      toast.error("Gagal menerima dokumen.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dosen/dokumen/${id}/tolak`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Dokumen ditolak.");
        navigate("/documents");
      } else {
        toast.error(result.error || "Gagal menolak dokumen.");
      }
    } catch {
      toast.error("Gagal menolak dokumen.");
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const renderWidth = useMemo(() => {
    if (containerWidth < 100) return 800;
    return Math.max(500, containerWidth - 2);
  }, [containerWidth]);

  // Only apply localStorage edits once to avoid infinite re-render loop
  const editAppliedRef = useRef(false);
  useEffect(() => {
    if (!document || editAppliedRef.current) return;
    const edits = JSON.parse(localStorage.getItem("dokumen_edits") || "{}");
    const edit = edits[document.id];
    if (edit) {
      editAppliedRef.current = true;
      setDocument({ ...document, name: edit.name, jenis: edit.jenis, tanggalUpload: edit.tanggal });
    }
  }, [document]);

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
          fetch(
            `${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/preview${query}`,
            { headers },
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/content`,
            { headers },
          ),
        ]);

        const previewResult = await previewResponse.json();
        if (!previewResponse.ok || previewResult.status !== "success") {
          throw new Error(
            previewResult.error || "Gagal mengambil informasi dokumen",
          );
        }
        if (!contentResponse.ok) {
          const contentResult = await contentResponse.json();
          throw new Error(
            contentResult.error || "Gagal mengambil file dokumen",
          );
        }

        const blob = await contentResponse.blob();
        objectUrl = URL.createObjectURL(blob);
        setDocument(previewResult.data);
        setServedHash(contentResponse.headers.get("X-Content-SHA256"));
        setFileUrl(objectUrl);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat dokumen",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocument();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activityId, apiPrefix, id, token]);

  const loadHighlights = useCallback(async () => {
    if (!id) return;
    setHighlightsLoading(true);
    setHighlightsError(null);
    try {
      const result = await getHighlightsByDokumenId(id);
      const myKepemilikanId = result.kepemilikanId;
      setHighlights(result.highlights);
      if (myKepemilikanId) {
        setKepemilikanId(myKepemilikanId);
      }
    } catch (err) {
      setHighlightsError(
        err instanceof Error ? err.message : "Gagal memuat highlight",
      );
    } finally {
      setHighlightsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (fileUrl) {
      void loadHighlights();
    }
  }, [fileUrl, loadHighlights]);

  const highlightsByPage = useMemo(() => {
    const map: Record<number, Highlight[]> = {};
    for (const hl of highlights) {
      if (!map[hl.page_number]) map[hl.page_number] = [];
      map[hl.page_number].push(hl);
    }
    return map;
  }, [highlights]);

  const currentPageInfo = currentPage ? pageInfos[currentPage] : null;
  const currentPageHighlights = currentPage ? highlightsByPage[currentPage] || [] : [];
  const pageHeightPx = currentPageInfo
    ? renderWidth * (currentPageInfo.pdfHeight / currentPageInfo.pdfWidth)
    : renderWidth * 1.4;

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
    { label: document?.name || "Detail Dokumen" },
  ];

  const handleDownload = () => {
    if (!fileUrl || !document) return;
    const anchor = window.document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = document.name;
    anchor.click();
  };

  const handleDocumentLoad = ({ numPages: np }: PDFDocumentProxy) => {
    setNumPages(np);
  };

  const handlePageLoad = (pageNumber: number, page: any) => {
    try {
      const viewport = page.getViewport({ scale: 1 });
      setPageInfos((prev) => ({
        ...prev,
        [pageNumber]: {
          pdfWidth: viewport.width,
          pdfHeight: viewport.height,
          rotate: page.rotate || 0,
        },
      }));
    } catch {
      // Silently skip failed pages
    }
  };

  const handleMouseDown = (e: React.MouseEvent, pageNumber: number) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragState({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      pageNumber,
      pageEl: target,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const rect = dragState.pageEl.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(dragState.startX, currentX);
    const y = Math.min(dragState.startY, currentY);
    const w = Math.abs(currentX - dragState.startX);
    const h = Math.abs(currentY - dragState.startY);

    if (w < 3 && h < 3) {
      setPreviewRect(null);
      return;
    }
    setPreviewRect({ x, y, w, h });
  };

  const handleMouseUp = async () => {
    if (!dragState || !previewRect || !kepemilikanId) {
      setDragState(null);
      setPreviewRect(null);
      return;
    }
    pushHistory();

    const pageInfo = pageInfos[dragState.pageNumber];
    if (!pageInfo) {
      setDragState(null);
      setPreviewRect(null);
      return;
    }

    const scale = renderWidth / pageInfo.pdfWidth;
    const pdfX = previewRect.x / scale;
    const pdfY = previewRect.y / scale;
    const pdfW = previewRect.w / scale;
    const pdfH = previewRect.h / scale;

    setDragState(null);
    setPreviewRect(null);

    if (pdfW < 5 || pdfH < 3) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newHighlight: Highlight = {
      id: tempId,
      page_number: dragState.pageNumber,
      highlighted_text: "",
      highlight_rect: [
        {
          x1: pdfX,
          x2: pdfX + pdfW,
          y1: pdfY,
          y2: pdfY + pdfH,
          width: pdfW,
          height: pdfH,
          boundary_rect: false,
        },
      ],
    };
    setHighlights((prev) => [...prev, newHighlight]);
  };

  const handleUpdateHighlight = async (highlightId: string, text: string) => {
    pushHistory();
    setHighlights((prev) =>
      prev.map((hl) =>
        hl.id === highlightId ? { ...hl, highlighted_text: text } : hl,
      ),
    );
    
    // Save to backend
    try {
      if (!highlightId.startsWith("temp-")) {
        await updateHighlight(highlightId, { highlighted_text: text });
        toast.success("Highlight berhasil diperbarui");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui highlight");
      setHighlights((prev) =>
        prev.map((hl) =>
          hl.id === highlightId ? { ...hl, highlighted_text: "" } : hl,
        ),
      );
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    pushHistory();
    const deletedHighlight = highlights.find((hl) => hl.id === highlightId);
    setHighlights((prev) => prev.filter((hl) => hl.id !== highlightId));
    
    // Delete from backend
    try {
      if (!highlightId.startsWith("temp-")) {
        await deleteHighlight(highlightId);
        toast.success("Highlight berhasil dihapus");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus highlight");
      if (deletedHighlight) {
        setHighlights((prev) => [...prev, deletedHighlight]);
      }
    }
  };

  const pushHistory = useCallback(() => {
    setHistoryStack((prev) => [...prev, [...highlights]]);
  }, [highlights]);

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setHighlights(previous);
  };

  const toggleAddMode = async () => {
    if (!kepemilikanId) return;
    if (addMode) {
      // Save highlights to backend when exiting add mode
      try {
        const syncData = highlights.map(h => ({
          page_number: h.page_number,
          highlighted_text: h.highlighted_text,
          highlight_rect: h.highlight_rect,
        }));
        await syncHighlights(kepemilikanId, syncData);
        toast.success("Highlight berhasil disimpan");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan highlight");
      }
    }
    setAddMode((prev) => !prev);
    setMenuHighlight(null);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${apiPrefix}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok || result.status === "error") throw new Error(result.error);
      toast.success("Dokumen berhasil dihapus.");
      navigate("/documents");
    } catch {
      toast.error("Gagal menghapus dokumen.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEdit = () => {
    if (!document) return;
    setEditForm({
      name: document.name,
      jenis: document.jenis,
      tanggal: document.tanggalUpload ? new Date(document.tanggalUpload) : undefined,
    });
    setShowEditDialog(true);
  };

  const handleDeleteAllHighlights = async () => {
    if (!kepemilikanId) return;
    pushHistory();
    setHighlights([]);
    
    // Sync empty array to backend
    try {
      await syncHighlights(kepemilikanId, []);
      toast.success("Semua highlight berhasil dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus semua highlight");
    }
  };

  const handleNavigateToPage = (pageNumber: number) => {
    if (numPages && pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
    }
  };

  const saveEdit = async () => {
    if (!document || !editForm.name || !editForm.jenis || !editForm.tanggal) {
      toast.error("Mohon lengkapi semua field.");
      return;
    }
    setSaving(true);
    try {
      // 1. Update metadata in backend
      const metadataRes = await fetch(`${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/metadata`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama: editForm.name,
          jenis_dokumen: editForm.jenis,
          tanggal_upload: editForm.tanggal.toISOString(),
        }),
      });
      const metadataResult = await metadataRes.json();
      if (!metadataRes.ok || metadataResult.status === "error") {
        throw new Error(metadataResult.error || "Gagal memperbarui metadata dokumen");
      }

      setDocument({ ...document, name: editForm.name, jenis: editForm.jenis, tanggalUpload: editForm.tanggal.toISOString() });

      // 2. Replace file if changed
      if (hasFileChange && newFile) {
        const formData = new FormData();
        formData.append("file", newFile);
        const res = await fetch(`${import.meta.env.VITE_API_URL}${apiPrefix}/${id}/replace-file`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await res.json();
        if (!res.ok || result.status === "error") throw new Error(result.error);
        setHasFileChange(false);
        setNewFile(null);
      }

      setShowEditDialog(false);
      toast.success("Dokumen berhasil diperbarui.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Detail Dokumen" breadcrumbs={breadcrumbs}>
        <div className="flex min-h-[420px] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat file dan memeriksa integritas...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !document || !fileUrl || !integrity) {
    return (
      <MainLayout title="Detail Dokumen" breadcrumbs={breadcrumbs}>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">
            {error || "Dokumen tidak dapat dimuat."}
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isPdf = document.contentType === "application/pdf";

  return (
    <MainLayout title="Detail Dokumen" breadcrumbs={breadcrumbs}>
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
          <div className="flex items-center gap-2">
            {isDocumentOwner && (
              <Button
                variant={addMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!isPdf) {
                    toast.error("Highlight hanya tersedia untuk file PDF. File DOCX belum mendukung fitur highlight.");
                    return;
                  }
                  toggleAddMode();
                }}
                disabled={isPdf && !kepemilikanId}
                title={
                  !isPdf
                    ? "Highlight hanya tersedia untuk file PDF"
                    : !kepemilikanId
                      ? "Backend gap: kepemilikanId tidak tersedia"
                      : addMode
                        ? "Keluar mode highlight"
                        : "Mode highlight"
                }
              >
                <Highlighter className="mr-2 h-4 w-4" />
                {addMode ? "Simpan Highlight" : "Tambah Highlight"}
              </Button>
            )}
            {isDocumentOwner && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {isDocumentOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            )}
            {isDocumentOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Bagikan
              </Button>
            )}
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Unduh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Jenis Dokumen</p>
            <p className="font-medium">{document.jenis}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sumber</p>
            <p className="font-medium">{document.sumber}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tanggal Upload</p>
            <p className="font-medium">
              {document.tanggalUpload
                ? format(new Date(document.tanggalUpload), "dd MMMM yyyy")
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Format</p>
            <p className="font-medium">{document.contentType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ukuran</p>
            <p className="font-medium">
              {(document.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Hash Database</p>
            <p className="font-mono text-xs break-all">
              {document.databaseHash || "-"}
            </p>
          </div>
        </div>

        {fromPendingRequest && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Dokumen dari Tata Usaha</p>
                <p className="text-sm text-blue-700 mt-1">
                  Dokumen ini perlu dikonfirmasi sebelum dapat digunakan dalam portofolio Anda.
                </p>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmAccept}
                  disabled={isConfirming}
                >
                  <Check className="w-4 h-4 mr-1" /> Terima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleConfirmReject}
                  disabled={isConfirming}
                >
                  <X className="w-4 h-4 mr-1" /> Tolak
                </Button>
              </div>
            </div>
          </div>
        )}

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
          <div
            ref={containerRef}
            className={`relative mx-auto max-w-full transition-all duration-200 ${
              addMode
                ? "ring-2 ring-yellow-400 ring-offset-2 rounded-lg bg-yellow-50/30"
                : ""
            }`}
          >
            {!kepemilikanId && allowHighlight && (
              <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Mode highlight tidak tersedia karena kepemilikan dokumen belum
                dapat diidentifikasi. Backend perlu diperbarui agar
                mengembalikan kepemilikanId.
              </div>
            )}

            {addMode && (
              <div className="mb-3 flex items-center gap-2 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                <Highlighter className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Mode Highlight aktif.</strong> Seret mouse di halaman PDF untuk membuat highlight
                  baru. Klik highlight yang ada untuk mengedit atau menghapusnya.
                </span>
              </div>
            )}

            {highlightsError && (
              <div className="mb-3 flex items-center gap-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {highlightsError}
              </div>
            )}

            {highlightsLoading && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat highlight...
              </div>
            )}

            <div className="mb-3 flex items-center justify-center gap-3">
              {numPages && numPages > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    &larr; Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                    {currentPage} / {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  >
                    Selanjutnya &rarr;
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.25}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue>{Math.round(zoom * 100)}%</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ZOOM_LEVELS.map((z) => (
                    <SelectItem key={z} value={String(z)}>
                      {Math.round(z * 100)}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Document
              file={fileUrl}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={(err) =>
                setPdfError(err.message || "Gagal memuat PDF")
              }
              loading={
                <div className="flex min-h-[420px] items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Memuat PDF...</span>
                </div>
              }
              error={
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-destructive">
                    {pdfError || "Gagal memuat PDF"}
                  </p>
                </div>
              }
              className="flex flex-col items-center"
            >
              {numPages && currentPage && (
                  <div key={currentPage} id={`pdf-page-${currentPage}`} className="relative">
                  <div
                    className={`relative overflow-hidden rounded border bg-white shadow-sm ${
                      addMode ? "cursor-crosshair" : ""
                    }`}
                  >
                    <Page
                      pageNumber={currentPage}
                      width={Math.round(renderWidth * zoom)}
                      rotate={currentPageInfo?.rotate}
                      onLoadSuccess={(page) =>
                        handlePageLoad(currentPage, page)
                      }
                      onRenderError={() => {}}
                      loading={
                        <div
                          style={{
                            width: renderWidth,
                            height: pageHeightPx,
                          }}
                          className="flex items-center justify-center bg-gray-50"
                        >
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      }
                    />

                    {currentPageInfo && (
                      <HighlightOverlay
                        pageWidth={Math.round(renderWidth * zoom)}
                        pageHeight={Math.round(pageHeightPx * zoom)}
                        pdfWidth={currentPageInfo.pdfWidth}
                        pdfHeight={currentPageInfo.pdfHeight}
                        highlights={currentPageHighlights}
                        addMode={addMode}
                        dragRect={
                          dragState?.pageNumber === currentPage
                            ? previewRect
                            : null
                        }
                        onMouseDown={(e) =>
                          handleMouseDown(e, currentPage)
                        }
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onHighlightClick={(hlId, e) => {
                          const hl = highlights.find(
                            (h) => h.id === hlId,
                          );
                          if (hl) {
                            setMenuHighlight({
                              highlight: hl,
                              position: {
                                x: e.clientX,
                                y: e.clientY,
                              },
                            });
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-center py-1 text-xs text-muted-foreground">
                    Halaman {currentPage} dari {numPages}
                    {currentPageHighlights.length > 0 &&
                      ` • ${currentPageHighlights.length} highlight`}
                  </div>
                </div>
              )}

            </Document>

            {menuHighlight && (
              <HighlightMenu
                highlight={menuHighlight.highlight}
                position={menuHighlight.position}
                onEdit={handleUpdateHighlight}
                onDelete={handleDeleteHighlight}
                onClose={() => setMenuHighlight(null)}
              />
            )}

            {addMode && highlights.length > 0 && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-900">
                    <List className="h-4 w-4" />
                    Daftar Highlight ({highlights.length})
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={historyStack.length === 0}
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-yellow-800 hover:bg-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Batalkan perubahan terakhir"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Undo
                    </button>
                    {highlights.length > 1 && (
                      <button
                        onClick={handleDeleteAllHighlights}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus Semua
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="group flex items-center gap-2 rounded-md border border-yellow-200 bg-white px-2.5 py-1.5 text-xs shadow-sm"
                    >
                      <button
                        onClick={() => handleNavigateToPage(hl.page_number)}
                        className="text-yellow-700 hover:text-yellow-900 hover:underline"
                      >
                        Hal. {hl.page_number}
                      </button>
                      {hl.highlighted_text && (
                        <span className="max-w-[120px] truncate text-gray-500">
                          {hl.highlighted_text}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteHighlight(hl.id)}
                        className="ml-1 rounded p-0.5 text-gray-400 opacity-0 hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 transition-opacity"
                        title="Hapus highlight ini"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 border bg-muted/20 text-center">
            <FileText className="h-14 w-14 text-muted-foreground" />
            <div>
              <p className="font-medium">{document.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Preview langsung tidak tersedia untuk DOCX.
              </p>
              <p className="mt-1 text-xs text-yellow-600">
                Fitur highlight hanya tersedia untuk file PDF.
              </p>
            </div>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Unduh Dokumen
            </Button>
          </div>
        )}

      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setNewFile(null);
          setHasFileChange(false);
        }
        setShowEditDialog(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Dokumen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Dokumen</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nama dokumen" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Dokumen</Label>
              <Select value={editForm.jenis} onValueChange={(v) => setEditForm({ ...editForm, jenis: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                <SelectContent>
                  {getAllJenisDokumen().map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Dokumen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editForm.tanggal && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.tanggal ? format(editForm.tanggal, "dd MMMM yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editForm.tanggal} onSelect={(d) => setEditForm({ ...editForm, tanggal: d })} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Ganti File (opsional)</Label>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={() => {
                const file = fileInputRef.current?.files?.[0];
                if (!file) return;
                if (file.size > 20 * 1024 * 1024) {
                  toast.error("Ukuran file terlalu besar. Maksimal 20MB!");
                  return;
                }
                setDocxWarning(file.name.endsWith('.docx') ? 'File yang dipilih tipenya DOCX. Preview hanya tersedia untuk file PDF.' : null);
                setNewFile(file);
                setHasFileChange(true);
              }} />
              {!hasFileChange ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-muted-foreground hover:border-gray-400 hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate">{document?.name}</span>
                  <span className="shrink-0 text-xs">
                    {(document.size / 1024).toFixed(1)} KB
                  </span>
                  <span className="ml-2 shrink-0 rounded border bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
                    Ganti
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <FileWarning className="h-5 w-5 shrink-0 text-amber-600" />
                  <span className="flex-1 truncate">{newFile?.name}</span>
                  <span className="shrink-0 text-xs text-amber-600">
                    {(newFile!.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setNewFile(null); setHasFileChange(false); }}
                    className="shrink-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {docxWarning && (
              <div className="flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{docxWarning}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {document && (
        <DocumentSharing
          documentId={document.id}
          documentName={document.name}
          hideButton
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen <strong>{document?.name}</strong> akan dihapus dari portofolio Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
