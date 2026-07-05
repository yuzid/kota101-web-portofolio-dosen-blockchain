import { Response } from 'express';
import { AdminUserService } from '../services/AdminUserService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AdminUserController {
  private adminUserService: AdminUserService;

  constructor(adminUserService: AdminUserService) {
    this.adminUserService = adminUserService;
  }

  getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.query;
      const currentUser = req.user;

      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const users = await this.adminUserService.getAllUsers(currentUser, role as string);
      res.json({ status: 'success', data: users });
    } catch (error: any) {
      res.status(403).json({ status: 'error', error: error.message });
    }
  };

  getUserById = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const currentUser = req.user;

      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const user = await this.adminUserService.getUserById(id, currentUser);
      res.json({ status: 'success', data: user });
    } catch (error: any) {
      const status = error.message === 'User tidak ditemukan.' ? 404 : 403;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  createUser = async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const user = await this.adminUserService.createUser(req.body, currentUser);
      res.status(201).json({ status: 'success', data: user });
    } catch (error: any) {
      const status = error.message.includes('Akses ditolak') ? 403 : 
                     error.message.includes('sudah terdaftar') ? 409 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const user = await this.adminUserService.updateUser(id, req.body, currentUser);
      res.json({ status: 'success', data: user });
    } catch (error: any) {
      const status = error.message === 'User tidak ditemukan.' ? 404 :
                     error.message.includes('digunakan user lain') ? 409 : 403;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      const deletedUser = await this.adminUserService.deleteUser(id, currentUser);
      res.json({ status: 'success', message: `User ${deletedUser.email} berhasil dihapus.` });
    } catch (error: any) {
      const status = error.message === 'User tidak ditemukan.' ? 404 : 403;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const currentUser = req.user;

      if (!currentUser) {
        res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
        return;
      }

      if (!status) {
        res.status(400).json({ status: 'error', error: 'Status wajib diisi.' });
        return;
      }

      const user = await this.adminUserService.updateUserStatus(id, status, currentUser);
      res.json({ status: 'success', data: user });
    } catch (error: any) {
      const status = error.message === 'User tidak ditemukan.' ? 404 : 
                     error.message.includes('Akses ditolak') ? 403 : 400;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };
}
