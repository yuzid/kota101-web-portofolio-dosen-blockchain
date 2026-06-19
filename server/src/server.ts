import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import adminUserRoutes from './routes/admin/userRoutes';
import adminJabatanRoutes from './routes/admin/jabatan';
import adminAkademikRoutes from './routes/admin/akademik';
import { verifyToken, requireRole, errorHandler } from './middleware/authMiddleware';
import dosenDocumentRoutes from './routes/tatausaha/documentRoutes';
import dosenDocumentRoutesdosen from './routes/dosen/documentRoutes';
import dosenActivityRoutes from './routes/dosen/activityRoutes';
import highlightRoutes from './routes/dosen/highlightRoutes';
import publicRoutes from './routes/publicRoutes';
import akademikRoleRoutes from './routes/dosen/akademikRoleRoutes';


const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Public Routes (Unauthenticated) ──
app.use('/api/public', publicRoutes);

// ── Auth ──
app.use('/api/auth', authRoutes);

// ── Admin: User CRUD (dilindungi JWT + role admin) ──
// server.ts
app.use('/api/admin/users', verifyToken, requireRole(['admin', 'tata_usaha', 'dosen']), adminUserRoutes);
app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), adminJabatanRoutes);
app.use('/api/admin/akademik', verifyToken, requireRole(['admin', 'tata_usaha', 'dosen']), adminAkademikRoutes);

app.use('/api/tatausaha/dokumen', verifyToken, requireRole(['tata_usaha']), dosenDocumentRoutes);

app.use('/api/dosen/dokumen', verifyToken, requireRole(['dosen']), dosenDocumentRoutesdosen);
app.use('/api/dosen/kegiatan', verifyToken, requireRole(['dosen']), dosenActivityRoutes);
app.use('/api/dosen/highlights', verifyToken, requireRole(['dosen']), highlightRoutes);
app.use('/api/dosen/akademik-role', verifyToken, requireRole(['dosen']), akademikRoleRoutes);

// ── Status ──
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Server berjalan.', timestamp: new Date().toISOString() });
});

// ── Frontend static ──
const clientBuildPath = (() => {
  const dockerPath = path.join(__dirname, '../client/dist');
  if (fs.existsSync(dockerPath)) return dockerPath;
  return path.join(__dirname, '../../client/dist');
})();
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