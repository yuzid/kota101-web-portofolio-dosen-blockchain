import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { 
    id: string; 
    email: string; 
    role: string;
    name?: string;
    programStudi?: string | null;
    jurusan_id?: string | null;
    jabatan?: {
      is_kajur: boolean;
      is_kaprodi: boolean;
      jurusan_id: string | null;
      program_studi_id: string | null;
    };
  };
}

type AsyncHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncHandler) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Menyelaraskan nama menjadi verifyToken sesuai yang dipanggil di documentRoutes
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', error: 'Token tidak ditemukan.' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ status: 'error', error: 'Token tidak valid atau sudah expired.' });
  }
};

// Middleware fleksibel untuk mengecek base role maupun jabatan struktural aktif
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', error: 'Otentikasi diperlukan.' });
      return;
    }

    // Normalisasi role pengguna dan array allowedRoles ke lowercase
    const userRoleLower = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    // 1. Cek base role (admin, tata_usaha, dosen)
    if (normalizedAllowedRoles.includes(userRoleLower)) {
      next();
      return;
    }

    // 2. Cek jabatan struktural aktif
    const { jabatan } = req.user;
    if (normalizedAllowedRoles.includes('kajur') && jabatan?.is_kajur) {
      next();
      return;
    }

    if (normalizedAllowedRoles.includes('kaprodi') && jabatan?.is_kaprodi) {
      next();
      return;
    }

    res.status(403).json({ 
      status: 'error', 
      error: 'Akses ditolak. Anda tidak memiliki hak akses untuk operasi ini.' 
    });
  };
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err);
  res.status(500).json({ status: 'error', error: err.message || 'Terjadi kesalahan server.' });
};