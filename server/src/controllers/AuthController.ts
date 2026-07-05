import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: 'error', error: 'Email dan password wajib diisi.' });
      return;
    }

    try {
      const authData = await this.authService.login(email, password);
      if (!authData) {
        res.status(401).json({ status: 'error', error: 'Email atau password salah.' });
        return;
      }

      res.status(200).json({ status: 'success', data: authData });
    } catch (error: any) {
      const status = error.message.includes('dinonaktifkan') ? 403 : 500;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };

  googleLogin = async (req: AuthRequest, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ status: 'error', error: 'ID Token wajib dikirimkan.' });
      return;
    }

    try {
      const authData = await this.authService.googleLogin(idToken);
      res.status(200).json({ status: 'success', data: authData });
    } catch (error: any) {
      const status = (error.message.includes('belum terdaftar') || error.message.includes('dinonaktifkan')) ? 403 : 401;
      res.status(status).json({ status: 'error', error: error.message });
    }
  };
}
