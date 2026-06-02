// server/src/domain/Highlight.ts
export class Highlight {
  private idHighlight: string; // UUID
  private pageNumber: number;
  private highlightedText: string;
  private highlighted: boolean;

  constructor(idHighlight: string, pageNumber: number, highlightedText: string, highlighted: boolean) {
    this.idHighlight = idHighlight;
    this.pageNumber = pageNumber;
    this.highlightedText = highlightedText;
    this.highlighted = highlighted;
  }
}

export class HighlightRect {
  private x1: number;
  private x2: number;
  private y1: number;
  private y2: number;
  private width: number;
  private height: number;

  constructor(x1: number, x2: number, y1: number, y2: number, width: number, height: number) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.width = width;
    this.height = height;
  }
}
