import express, { Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import adminUserRoutes from './routes/admin/userRoutes';
import adminJabatanRoutes from './routes/admin/jabatan';
import adminAkademikRoutes from './routes/admin/akademik';
import { verifyToken, requireRole, errorHandler } from './middleware/authMiddleware';
import dosenDocumentRoutes from './routes/tatausaha/documentRoutes';
import dosenDocumentRoutesdosen from './routes/dosen/documentRoutes';


const app = express();
app.use(express.json());

// ── Auth ──
app.use('/api/auth', authRoutes);

// ── Admin: User CRUD (dilindungi JWT + role admin) ──
// server.ts
app.use('/api/admin/users', verifyToken, requireRole(['admin', 'tata_usaha']), adminUserRoutes);
app.use('/api/admin/jabatan', verifyToken, requireRole(['admin']), adminJabatanRoutes);
app.use('/api/admin/akademik', verifyToken, requireRole(['admin']), adminAkademikRoutes);

app.use('/api/tatausaha/dokumen', verifyToken, requireRole(['tata_usaha']), dosenDocumentRoutes);

app.use('/api/dosen/dokumen', verifyToken, requireRole(['dosen']), dosenDocumentRoutesdosen);

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