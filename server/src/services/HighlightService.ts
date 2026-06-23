import { HighlightRepository } from '../repositories/HighlightRepository';

export class HighlightService {
  private highlightRepository: HighlightRepository;

  constructor(highlightRepository: HighlightRepository) {
    this.highlightRepository = highlightRepository;
  }

  async getHighlightsByDocument(kepemilikanId: string) {
    return await this.highlightRepository.findByKepemilikanId(kepemilikanId);
  }

  async getHighlightsByDocumentAndDosen(dokumenId: string, dosenId: string) {
    const kepemilikanId = await this.highlightRepository.findKepemilikanId(dosenId, dokumenId);
    if (!kepemilikanId) {
      return { highlights: [], kepemilikanId: null };
    }
    const highlights = await this.highlightRepository.findByKepemilikanId(kepemilikanId);
    return { highlights, kepemilikanId };
  }

  /**
   * Sync highlights for a specific document ownership.
   * This will replace existing highlights with the ones provided in the JSON array.
   */
  async syncHighlights(kepemilikanId: string, highlightsJson: any[]) {
    if (!Array.isArray(highlightsJson)) {
      throw new Error('Highlights must be an array.');
    }

    // Process synchronization in a way that minimizes disruption if needed,
    // but a simple "delete and recreate" is often what's expected for a full sync.
    await this.highlightRepository.deleteByKepemilikanId(kepemilikanId);

    const createdHighlights = [];
    for (const item of highlightsJson) {
      const created = await this.highlightRepository.create({
        kepemilikan_id: kepemilikanId,
        page_number: item.page_number,
        highlighted_text: item.highlighted_text,
        highlight_rect: item.highlight_rect.map((rect: any) => ({
          x1: rect.x1,
          x2: rect.x2,
          y1: rect.y1,
          y2: rect.y2,
          width: rect.width,
          height: rect.height,
          boundary_rect: rect.boundary_rect || false,
        })),
      });
      createdHighlights.push(created);
    }

    return createdHighlights;
  }

  async addHighlight(kepemilikanId: string, highlightData: any) {
    return await this.highlightRepository.create({
      kepemilikan_id: kepemilikanId,
      ...highlightData
    });
  }

  async updateHighlight(id: string, highlightData: any) {
    const existing = await this.highlightRepository.findById(id);
    if (!existing) throw new Error('Highlight not found.');
    return await this.highlightRepository.update(id, highlightData);
  }

  async deleteHighlight(id: string) {
    const existing = await this.highlightRepository.findById(id);
    if (!existing) throw new Error('Highlight not found.');
    return await this.highlightRepository.delete(id);
  }
}
