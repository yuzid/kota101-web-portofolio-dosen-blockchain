import express, { Request, Response } from 'express';
import * as crypto from 'crypto';
import path from 'path';

const app = express();
app.use(express.json());

// --- 1. JALUR API (Harus di atas) ---
app.get('/api/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend server monolitik berjalan!',
    timestamp: new Date().toISOString(),
    server: 'Node.js + Express + TypeScript'
  });
});

interface DocumentPayload {
  title: string;
  lecturerName: string;
  documentType?: string;
}

app.post('/api/document/upload', (req: Request<{}, {}, DocumentPayload>, res: Response) => {
  const { title, lecturerName, documentType } = req.body;
  if (!title || !lecturerName) {
    return res.status(400).json({ error: "Judul dan Nama Dosen wajib diisi." });
  }
  const hashSHA256 = crypto.createHash('sha256').update(title).digest('hex');
  res.status(201).json({
    message: "Backend TypeScript berhasil memproses dokumen!",
    data: { title, lecturerName, documentType, hashSHA256 }
  });
});

// --- 2. JALUR FRONTEND (File Statis dari React/Vite) ---
// Lokasi folder build client relatif dari file compiled server/dist/server.js
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route untuk menangani client-side routing (React Router)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Monolith Server berjalan secara publik di port ${PORT}`);
});