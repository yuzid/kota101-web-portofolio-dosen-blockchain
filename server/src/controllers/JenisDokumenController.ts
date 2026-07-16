import { Request, Response } from 'express';

const DEFAULT_JENIS_DOKUMEN = [
  'SURAT_KEPUTUSAN',
  'SURAT_TUGAS',
  'LEMBAR_PENGESAHAN',
  'KONTRAK_PENELITIAN',
  'SERTIFIKAT',
  'FOTO',
  'LAPORAN',
  'BUKTI_PENDUKUNG_LAIN',
];

export class JenisDokumenController {
  getAll = async (_req: Request, res: Response) => {
    try {
      res.status(200).json({ status: 'success', data: DEFAULT_JENIS_DOKUMEN });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { nama } = req.body;
      if (!nama || !String(nama).trim()) {
        res.status(400).json({ status: 'error', error: 'Nama jenis dokumen wajib diisi.' });
        return;
      }

      const cleanName = String(nama).trim().toUpperCase();

      if (DEFAULT_JENIS_DOKUMEN.includes(cleanName)) {
        res.status(400).json({ status: 'error', error: 'Jenis dokumen default tidak boleh diduplikasi.' });
        return;
      }

      // JenisDokumen sekarang hanya berupa list statis.
      // Penambahan custom jenis dokumen tidak persisten ke database.
      res.status(201).json({ status: 'success', data: { nama: cleanName } });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };
}
