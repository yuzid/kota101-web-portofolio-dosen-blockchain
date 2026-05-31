import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import {
  X, Highlighter, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Save, Undo, Eraser
} from 'lucide-react';
import { toast } from 'sonner';

interface Highlight {
  id: string;
  page: number;
  position: { x: number; y: number; width: number; height: number };
  text: string;
}

interface SelectionPopup {
  show: boolean;
  x: number;
  y: number;
}

export function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);

  // Check if this is highlight mode from URL params or location state
  const allowHighlight = location.state?.allowHighlight || false;
  const [isHighlightMode, setIsHighlightMode] = useState(allowHighlight);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<Highlight[][]>([]);
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup>({ show: false, x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState<{
    text: string;
    rect: DOMRect;
  } | null>(null);

  // All preview is read-only by default, unless explicitly allowed to highlight
  const isReadOnly = !allowHighlight;

  const mockDocument = {
    id: '1',
    name: 'SK Mengajar Semester Ganjil 2025.pdf',
    totalPages: 5,
    asal: 'tu' as const,
  };

  // Dynamic breadcrumbs based on where user came from
  const breadcrumbs = location.state?.breadcrumbs || [
    { label: 'Beranda', path: '/dashboard' },
    { label: 'Dokumen Saya', path: '/documents' },
    { label: mockDocument.name },
  ];

  const handleSaveHighlights = () => {
    toast.success('Highlight berhasil disimpan!');
    setIsHighlightMode(false);
  };

  const handleCancelHighlight = () => {
    setIsHighlightMode(false);
    setSelectionPopup({ show: false, x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setHighlights(previousState);
      setHistory(history.slice(0, -1));
      toast.success('Undo berhasil');
    }
  };

  const handleClearAll = () => {
    setHistory([...history, highlights]);
    setHighlights([]);
    toast.success('Semua highlight dihapus');
  };

  const handleTextSelection = () => {
    if (!isHighlightMode) {
      setSelectionPopup({ show: false, x: 0, y: 0 });
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && documentRef.current) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        const docRect = documentRef.current.getBoundingClientRect();

        setCurrentSelection({
          text: selectedText,
          rect: rect,
        });

        setSelectionPopup({
          show: true,
          x: rect.left + rect.width / 2 - docRect.left,
          y: rect.top - docRect.top - 45,
        });
      }
    } else {
      setSelectionPopup({ show: false, x: 0, y: 0 });
    }
  };

  const handleCreateHighlight = () => {
    if (!currentSelection || !documentRef.current) return;

    const docRect = documentRef.current.getBoundingClientRect();
    const selectionRect = currentSelection.rect;

    const newHighlight: Highlight = {
      id: String(Date.now()),
      page: currentPage,
      position: {
        x: ((selectionRect.left - docRect.left) / zoom) * 100,
        y: ((selectionRect.top - docRect.top) / zoom) * 100,
        width: (selectionRect.width / zoom) * 100,
        height: (selectionRect.height / zoom) * 100,
      },
      text: currentSelection.text,
    };

    setHistory([...history, highlights]);
    setHighlights([...highlights, newHighlight]);
    setSelectionPopup({ show: false, x: 0, y: 0 });
    setCurrentSelection(null);

    // Clear selection
    window.getSelection()?.removeAllRanges();

    toast.success('Teks berhasil di-highlight');
  };

  const handleDeleteHighlight = (highlightId: string) => {
    setHistory([...history, highlights]);
    setHighlights(highlights.filter(h => h.id !== highlightId));
  };

  return (
    <MainLayout
      title="Preview Dokumen"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex justify-between items-center">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium truncate max-w-md">{mockDocument.name}</span>
            </div>

            {/* Right Section - Highlight Tools */}
            <div className="flex items-center gap-2">
              {!isReadOnly && !isHighlightMode ? (
                <Button onClick={() => setIsHighlightMode(true)} variant="default">
                  <Highlighter className="w-4 h-4 mr-2" />
                  Aktifkan Highlight
                </Button>
              ) : isHighlightMode ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
                    <Highlighter className="w-4 h-4" />
                    <span className="text-sm font-medium">Mode Highlight</span>
                  </div>

                  <div className="h-6 w-px bg-border" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={highlights.length === 0}
                    title="Hapus Semua Highlight"
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>

                  <div className="h-6 w-px bg-border" />

                  <Button variant="outline" size="sm" onClick={handleCancelHighlight}>
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleSaveHighlights}>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {isReadOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Mode Preview:</strong> Anda hanya dapat melihat dokumen dan highlight yang ada. Highlight hanya dapat ditambahkan saat upload dokumen atau update kegiatan.
          </div>
        )}

        {/* Viewer Area */}
        <div className="border rounded-lg bg-muted/30 p-6">
          {/* Navigation & Zoom */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Halaman {currentPage} / {mockDocument.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === mockDocument.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Document Canvas */}
          <div className="flex justify-center">
            <div
              ref={documentRef}
              className="bg-white border rounded-lg shadow-lg relative overflow-hidden"
              style={{
                width: `${(595 * zoom) / 100}px`,
                height: `${(842 * zoom) / 100}px`,
                cursor: isHighlightMode ? 'text' : 'default',
              }}
              onMouseUp={handleTextSelection}
            >
              {/* Selection Popup */}
              {selectionPopup.show && isHighlightMode && (
                <div
                  className="absolute z-50"
                  style={{
                    left: `${selectionPopup.x}px`,
                    top: `${selectionPopup.y}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Button
                    size="sm"
                    onClick={handleCreateHighlight}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                  >
                    <Highlighter className="w-3 h-3 mr-1" />
                    Highlight
                  </Button>
                </div>
              )}
              {/* Mock PDF Content */}
              <div className="p-8 text-sm leading-relaxed" style={{ userSelect: isHighlightMode ? 'text' : 'none' }}>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold mb-2">SURAT KEPUTUSAN</h1>
                  <p className="text-xs">No: 123/SK/DIR/2025</p>
                </div>

                <p className="mb-3">
                  <strong>TENTANG</strong>
                </p>
                <p className="mb-4">
                  Penetapan Dosen Pengampu Mata Kuliah Semester Ganjil Tahun Akademik 2025/2026
                </p>

                <p className="mb-3">
                  <strong>DIREKTUR POLITEKNIK NEGERI BANDUNG</strong>
                </p>

                <p className="mb-4">Menimbang bahwa untuk kelancaran proses pembelajaran...</p>

                <p className="mb-3">
                  <strong>MEMUTUSKAN:</strong>
                </p>

                <p className="mb-2">Menetapkan:</p>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>
                    <strong>Dr. John Doe</strong>, NIDN: 0412108901 sebagai dosen pengampu
                    Mata Kuliah Pemrograman Web
                  </li>
                  <li>
                    <strong>Dr. Ahmad Fauzi</strong>, NIDN: 0420059102 sebagai dosen pengampu
                    Mata Kuliah Basis Data
                  </li>
                  <li>
                    <strong>Dr. Siti Nurhaliza</strong>, NIDN: 0405067801 sebagai dosen pengampu
                    Mata Kuliah Algoritma dan Pemrograman
                  </li>
                </ol>

                {isHighlightMode && (
                  <div className="mt-8 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Cara pakai:</strong> Blok/select teks dengan mouse, lalu klik tombol "Highlight" yang muncul
                  </div>
                )}
              </div>

              {/* Render Highlights */}
              {highlights
                .filter(h => h.page === currentPage)
                .map((highlight) => (
                  <div
                    key={highlight.id}
                    className="absolute bg-yellow-300/40 border-2 border-yellow-400 group hover:bg-yellow-300/60 transition-colors"
                    style={{
                      left: `${(highlight.position.x * zoom) / 100}px`,
                      top: `${(highlight.position.y * zoom) / 100}px`,
                      width: `${(highlight.position.width * zoom) / 100}px`,
                      height: `${(highlight.position.height * zoom) / 100}px`,
                    }}
                  >
                    {isHighlightMode && !isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHighlight(highlight.id);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Hapus highlight"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Highlight Summary */}
          {highlights.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Highlighter className="w-4 h-4 text-yellow-600" />
              <span>{highlights.length} bagian di-highlight</span>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
