import { useMemo } from "react";
import type { Highlight } from "../../services/highlightService";

interface DragRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HighlightOverlayProps {
  pageWidth: number;
  pageHeight: number;
  pdfWidth: number;
  pdfHeight: number;
  highlights: Highlight[];
  addMode: boolean;
  dragRect: DragRect | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onHighlightClick: (highlightId: string, e: React.MouseEvent) => void;
}

export function HighlightOverlay({
  pageWidth,
  pageHeight,
  pdfWidth,
  pdfHeight,
  highlights,
  addMode,
  dragRect,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onHighlightClick,
}: HighlightOverlayProps) {
  const scale = useMemo(() => {
    if (pdfWidth === 0) return 1;
    return pageWidth / pdfWidth;
  }, [pageWidth, pdfWidth]);

  const pageStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      top: 0,
      left: 0,
      width: pageWidth,
      height: pageHeight,
      cursor: addMode ? "crosshair" : undefined,
      zIndex: 10,
      pointerEvents: addMode ? "auto" : "none",
    }),
    [pageWidth, pageHeight, addMode],
  );

  const dragStyle: React.CSSProperties | null = useMemo(() => {
    if (!dragRect) return null;
    return {
      position: "absolute",
      left: dragRect.x,
      top: dragRect.y,
      width: dragRect.w,
      height: dragRect.h,
      backgroundColor: "rgba(255, 200, 0, 0.4)",
      pointerEvents: "none",
    };
  }, [dragRect]);

  return (
    <div
      style={pageStyle}
      onMouseDown={addMode ? onMouseDown : undefined}
      onMouseMove={addMode ? onMouseMove : undefined}
      onMouseUp={addMode ? onMouseUp : undefined}
      onMouseLeave={addMode ? onMouseUp : undefined}
    >
      {highlights.map((hl) =>
        hl.highlight_rect.map((rect, ri) => {
          if (rect.boundary_rect) return null;
          return (
              <div
                key={`${hl.id}-${ri}`}
                style={{
                  position: "absolute",
                  left: rect.x1 * scale,
                  top: rect.y1 * scale,
                  width: rect.width * scale,
                  height: rect.height * scale,
                  backgroundColor: "rgba(255, 230, 0, 0.55)",
                  cursor: addMode ? "pointer" : undefined,
                  borderRadius: 2,
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) => {
                  if (addMode) {
                    e.stopPropagation();
                    onHighlightClick(hl.id, e);
                  }
                }}
              />
          );
        }),
      )}

      {dragStyle && <div style={dragStyle} />}
    </div>
  );
}
