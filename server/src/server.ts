import express, { Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import adminUserRoutes from './routes/admin/userRoutes';
import adminJabatanRoutes from './routes/admin/jabatan';
import adminAkademikRoutes from './routes/admin/akademik';
import { authenticate, requireAdmin, errorHandler } from './middleware/authMiddleware';

const app = express();
app.use(express.json());

// ── Auth ──
app.use('/api/auth', authRoutes);

// ── Admin: User CRUD (dilindungi JWT + role ADMIN) ──
app.use('/api/admin/users', authenticate, requireAdmin, adminUserRoutes);
app.use('/api/admin/jabatan', authenticate, requireAdmin, adminJabatanRoutes);
app.use('/api/admin/akademik', authenticate, requireAdmin, adminAkademikRoutes);

// ── Status ──
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Server berjalan.', timestamp: new Date().toISOString() });
});

// ── Frontend static ──
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.all(/^\/(?!api).*/, (req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ── Global error handler (harus paling bawah) ──
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});