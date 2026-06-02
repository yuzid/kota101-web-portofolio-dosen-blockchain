// server/src/domain/LampiranDokumenBukti.ts
import { Highlight } from './Highlight';

export class LampiranDokumenBukti {
  private idHighlightFile: string; // UUID

  constructor(idHighlightFile: string) {
    this.idHighlightFile = idHighlightFile;
  }

  public highlight(listHighlight: Highlight[]): void {
    // Logic to apply highlights
  }

  public isHighlighted(): boolean {
    return !!this.idHighlightFile;
  }
}
