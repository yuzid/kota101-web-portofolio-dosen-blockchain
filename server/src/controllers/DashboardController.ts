import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getStafTuDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', error: 'Unauthorized' });
      return;
    }
    const data = await this.dashboardService.getStafTuDashboard(userId);
    res.json({ status: 'success', data });
  };

  getAdminDashboard = async (req: AuthRequest, res: Response) => {
    const data = await this.dashboardService.getAdminDashboard();
    res.json({ status: 'success', data });
  };

  getDosenDashboard = async (req: AuthRequest, res: Response) => {
    const dosenId = req.user?.id;
    if (!dosenId) {
      res.status(401).json({ status: 'error', error: 'Unauthorized' });
      return;
    }
    const data = await this.dashboardService.getDosenDashboard(dosenId);
    res.json({ status: 'success', data });
  };

  getKaprodiDashboard = async (req: AuthRequest, res: Response) => {
    const jabatan = req.user?.jabatan;
    if (!jabatan?.program_studi_id) {
      res.status(403).json({ status: 'error', error: 'Anda tidak memiliki jabatan Kaprodi aktif' });
      return;
    }
    const data = await this.dashboardService.getKaprodiDashboard(jabatan.program_studi_id);
    res.json({ status: 'success', data });
  };

  getKajurDashboard = async (req: AuthRequest, res: Response) => {
    const jabatan = req.user?.jabatan;
    if (!jabatan?.jurusan_id) {
      res.status(403).json({ status: 'error', error: 'Anda tidak memiliki jabatan Kajur aktif' });
      return;
    }
    const data = await this.dashboardService.getKajurDashboard(jabatan.jurusan_id);
    res.json({ status: 'success', data });
  };
}
