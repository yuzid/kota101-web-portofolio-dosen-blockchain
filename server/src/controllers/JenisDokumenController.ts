import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class JenisDokumenController {
  getAll = async (req: Request, res: Response) => {
    try {
      const records = await prisma.jenisDokumen.findMany({
        orderBy: { nama: 'asc' }
      });

      const defaults = [
        'SURAT_KEPUTUSAN',
        'SURAT_TUGAS',
        'LEMBAR_PENGESAHAN',
        'KONTRAK_PENELITIAN',
        'SERTIFIKAT',
        'FOTO',
        'LAPORAN',
        'BUKTI_PENDUKUNG_LAIN'
      ];

      const allNames = new Set(defaults);
      records.forEach((r: any) => allNames.add(r.nama));

      res.status(200).json({ status: 'success', data: Array.from(allNames) });
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

      // Check default list first to prevent duplicates
      const defaults = [
        'SURAT_KEPUTUSAN',
        'SURAT_TUGAS',
        'LEMBAR_PENGESAHAN',
        'KONTRAK_PENELITIAN',
        'SERTIFIKAT',
        'FOTO',
        'LAPORAN',
        'BUKTI_PENDUKUNG_LAIN'
      ];

      if (defaults.includes(cleanName)) {
        res.status(400).json({ status: 'error', error: 'Jenis dokumen default tidak boleh diduplikasi.' });
        return;
      }

      const existing = await prisma.jenisDokumen.findUnique({
        where: { nama: cleanName }
      });

      if (existing) {
        res.status(400).json({ status: 'error', error: 'Jenis dokumen sudah terdaftar.' });
        return;
      }

      const created = await prisma.jenisDokumen.create({
        data: { nama: cleanName }
      });

      res.status(201).json({ status: 'success', data: created });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  };
}
