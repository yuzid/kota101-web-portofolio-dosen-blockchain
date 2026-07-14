import { HighlightRepository } from '../repositories/HighlightRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { ActivityService } from './ActivityService';

export class HighlightService {
  private highlightRepository: HighlightRepository;
  private activityService: ActivityService;

  constructor(
    highlightRepository: HighlightRepository,
    activityService = new ActivityService(new ActivityRepository()),
  ) {
    this.highlightRepository = highlightRepository;
    this.activityService = activityService;
  }

  private async publishHighlightChange(dokumenId: string | null) {
    if (!dokumenId) return [];
    return await this.activityService.publishDocumentChangeSnapshots(dokumenId, 'DOKUMEN_HIGHLIGHTS_SYNCED');
  }

  async getHighlightsByDocument(kepemilikanId: string) {
    return await this.highlightRepository.findByKepemilikanId(kepemilikanId);
  }

  async getHighlightsByDocumentAndDosen(dokumenId: string, dosenId: string) {
    const kepemilikanId = await this.highlightRepository.findKepemilikanId(dosenId, dokumenId) || null;
    // Fix: filter per kepemilikan dosen, bukan return semua highlight dokumen
    const highlights = kepemilikanId
      ? await this.highlightRepository.findByKepemilikanId(kepemilikanId)
      : [];
    return { highlights, kepemilikanId };
  }

  /**
   * Sync highlights for a specific document ownership.
   * This will replace existing highlights with the ones provided in the JSON array.
   * @param kepemilikanId - The kepemilikan dokumen ID
   * @param highlightsJson - The array of highlights to sync
   * @param dosenId - The dosen ID to verify ownership
   */
  async syncHighlights(kepemilikanId: string, highlightsJson: any[], dosenId?: string) {
    // Verify ownership if dosenId is provided
    if (dosenId) {
      const isOwner = await this.highlightRepository.verifyKepemilikanOwnership(kepemilikanId, dosenId);
      if (!isOwner) {
        throw new Error('Anda tidak memiliki akses untuk mengubah highlight dokumen ini. Hanya pemilik dokumen yang dapat mengubah highlight.');
      }
    }

    if (!Array.isArray(highlightsJson)) {
      throw new Error('Highlights must be an array.');
    }

    const dokumenId = await this.highlightRepository.findDocumentIdByKepemilikanId(kepemilikanId);

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

    await this.publishHighlightChange(dokumenId);
    return createdHighlights;
  }

  /**
   * Add a new highlight to a document.
   * @param kepemilikanId - The kepemilikan dokumen ID
   * @param highlightData - The highlight data
   * @param dosenId - The dosen ID to verify ownership
   */
  async addHighlight(kepemilikanId: string, highlightData: any, dosenId?: string) {
    // Verify ownership if dosenId is provided
    if (dosenId) {
      const isOwner = await this.highlightRepository.verifyKepemilikanOwnership(kepemilikanId, dosenId);
      if (!isOwner) {
        throw new Error('Anda tidak memiliki akses untuk menambah highlight dokumen ini. Hanya pemilik dokumen yang dapat menambah highlight.');
      }
    }

    // Validate highlight_rect: wajib ada, berupa array, dan tidak kosong
    if (
      !highlightData.highlight_rect ||
      !Array.isArray(highlightData.highlight_rect) ||
      highlightData.highlight_rect.length === 0
    ) {
      throw new Error('highlight_rect wajib diisi dan tidak boleh kosong.');
    }

    const created = await this.highlightRepository.create({
      kepemilikan_id: kepemilikanId,
      ...highlightData
    });
    const dokumenId = await this.highlightRepository.findDocumentIdByKepemilikanId(kepemilikanId);
    await this.publishHighlightChange(dokumenId);
    return created;
  }

  /**
   * Update an existing highlight.
   * @param id - The highlight ID
   * @param highlightData - The updated highlight data
   * @param dosenId - The dosen ID to verify ownership
   */
  async updateHighlight(id: string, highlightData: any, dosenId?: string) {
    const existing = await this.highlightRepository.findById(id);
    if (!existing) throw new Error('Highlight tidak ditemukan.');

    // Verify ownership if dosenId is provided
    if (dosenId) {
      const isOwner = await this.highlightRepository.verifyOwnership(id, dosenId);
      if (!isOwner) {
        throw new Error('Anda tidak memiliki akses untuk mengubah highlight dokumen ini. Hanya pemilik dokumen yang dapat mengubah highlight.');
      }
    }

    const updated = await this.highlightRepository.update(id, highlightData);
    const dokumenId = await this.highlightRepository.findDocumentIdByHighlightId(id);
    await this.publishHighlightChange(dokumenId);
    return updated;
  }

  /**
   * Delete a highlight.
   * @param id - The highlight ID
   * @param dosenId - The dosen ID to verify ownership
   */
  async deleteHighlight(id: string, dosenId?: string) {
    const existing = await this.highlightRepository.findById(id);
    if (!existing) throw new Error('Highlight tidak ditemukan.');

    // Verify ownership if dosenId is provided
    if (dosenId) {
      const isOwner = await this.highlightRepository.verifyOwnership(id, dosenId);
      if (!isOwner) {
        throw new Error('Anda tidak memiliki akses untuk menghapus highlight dokumen ini. Hanya pemilik dokumen yang dapat menghapus highlight.');
      }
    }

    const dokumenId = await this.highlightRepository.findDocumentIdByHighlightId(id);
    const deleted = await this.highlightRepository.delete(id);
    await this.publishHighlightChange(dokumenId);
    return deleted;
  }
}
