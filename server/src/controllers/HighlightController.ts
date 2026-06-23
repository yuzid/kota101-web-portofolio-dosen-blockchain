import { Request, Response } from 'express';
import { HighlightService } from '../services/HighlightService';
import { AuthRequest } from '../middleware/authMiddleware';

export class HighlightController {
  private highlightService: HighlightService;

  constructor(highlightService: HighlightService) {
    this.highlightService = highlightService;
  }

  getHighlights = async (req: AuthRequest, res: Response) => {
    try {
      const  kepemilikanId  = req.params.kepemilikanId as string;
      const { dokumenId } = req.query;

      if (kepemilikanId) {
        const highlights = await this.highlightService.getHighlightsByDocument(kepemilikanId);
        res.json({ status: 'success', data: highlights, kepemilikanId });
      } else if (dokumenId && req.user?.id) {
        const result = await this.highlightService.getHighlightsByDocumentAndDosen(
          dokumenId as string,
          req.user.id,
        );
        res.json({ 
          status: 'success', 
          data: result.highlights,
          kepemilikanId: result.kepemilikanId,
        });
      } else {
        res.status(400).json({ status: 'error', error: 'Missing kepemilikanId or dokumenId.' });
      }
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  syncHighlights = async (req: AuthRequest, res: Response) => {
    try {
      const  kepemilikanId  = req.params.kepemilikanId as string;
      const highlightsJson = req.body.highlights;
      const result = await this.highlightService.syncHighlights(kepemilikanId, highlightsJson);
      res.json({ status: 'success', message: 'Highlights synchronized successfully.', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  addHighlight = async (req: AuthRequest, res: Response) => {
    try {
      const  kepemilikanId  = req.params.kepemilikanId as string;
      const result = await this.highlightService.addHighlight(kepemilikanId, req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  updateHighlight = async (req: AuthRequest, res: Response) => {
    try {
      const  id  = req.params.id as string;
      const result = await this.highlightService.updateHighlight(id, req.body);
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  deleteHighlight = async (req: AuthRequest, res: Response) => {
    try {
      const  id  = req.params.id as string;
      await this.highlightService.deleteHighlight(id);
      res.json({ status: 'success', message: 'Highlight deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  };

  /**
   * Public handler for fetching highlights via a shared link context.
   * This does not require the user to be logged in.
   */
  getPublicHighlights = async (req: Request, res: Response) => {
    try {
      const  kepemilikanId  = req.params.kepemilikanId as string;
      if (!kepemilikanId) {
        res.status(400).json({ status: 'error', error: 'Missing kepemilikanId.' });
        return;
      }
      const highlights = await this.highlightService.getHighlightsByDocument(kepemilikanId);
      res.json({ status: 'success', data: highlights });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };
}
