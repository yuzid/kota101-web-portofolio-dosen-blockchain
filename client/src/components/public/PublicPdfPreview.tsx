import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Loader2, AlertCircle, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { HighlightOverlay } from "../document/HighlightOverlay";

import type { Highlight } from "../../services/highlightService";

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PageInfo {
  pdfWidth: number;
  pdfHeight: number;
  rotate: number;
}

interface PublicPdfPreviewProps {
  fileUrl: string;
  kepemilikanId?: string;
}

export function PublicPdfPreview({ fileUrl, kepemilikanId }: PublicPdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfos, setPageInfos] = useState<Record<number, PageInfo>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [zoom, setZoom] = useState(1);

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

  useEffect(() => {
    let active = true;
    const loadPublicHighlights = async () => {
      if (!kepemilikanId) {
        if (active) setHighlights([]);
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/public/highlights/${kepemilikanId}`);
        const result = await response.json();
        if (response.ok && result.status === "success" && active) {
          setHighlights(result.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat highlight publik:", err);
      }
    };
    void loadPublicHighlights();
    return () => {
      active = false;
    };
  }, [kepemilikanId]);

  const renderWidth = useMemo(() => {
    if (containerWidth < 100) return 800;
    return Math.max(500, containerWidth - 2);
  }, [containerWidth]);

  const currentPageInfo = currentPage ? pageInfos[currentPage] : null;
  const pageHeightPx = currentPageInfo
    ? renderWidth * (currentPageInfo.pdfHeight / currentPageInfo.pdfWidth)
    : renderWidth * 1.4;

  const highlightsByPage = useMemo(() => {
    const map: Record<number, Highlight[]> = {};
    for (const hl of highlights) {
      if (!map[hl.page_number]) map[hl.page_number] = [];
      map[hl.page_number].push(hl);
    }
    return map;
  }, [highlights]);

  const currentPageHighlights = currentPage
    ? highlightsByPage[currentPage] || []
    : [];

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

  return (
    <div ref={containerRef}>
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
          console.error("PDF load error:", err.message || "Gagal memuat PDF")
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
            <p className="text-sm text-destructive">Gagal memuat PDF</p>
          </div>
        }
        className="flex flex-col items-center"
      >
        {numPages && currentPage && (
          <div key={currentPage} className="relative">
            <div className="relative overflow-hidden rounded border bg-white shadow-sm">
              <Page
                pageNumber={currentPage}
                width={Math.round(renderWidth * zoom)}
                rotate={currentPageInfo?.rotate}
                onLoadSuccess={(page) => handlePageLoad(currentPage, page)}
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
                  addMode={false}
                  dragRect={null}
                  onMouseDown={() => {}}
                  onMouseMove={() => {}}
                  onMouseUp={() => {}}
                  onHighlightClick={() => {}}
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
    </div>
  );
}
