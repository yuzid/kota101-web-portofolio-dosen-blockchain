import { RekapRepository } from '../repositories/RekapRepository';
import { Prisma } from '@prisma/client';

export class RekapService {
  private rekapRepository: RekapRepository;

  constructor() {
    this.rekapRepository = new RekapRepository();
  }

  async createRekap(data: {
    nama: string;
    tanggalPerekapan: Date;
    dibuatOlehId: string;
    prodiId?: string;
    jurusanId?: string;
    filter: any;
    kegiatanData: any[];
  }) {
    const riwayat = [{
      aktivitas: 'Rekap dibuat',
      dilakukanOleh: data.dibuatOlehId, // Will be resolved to name in controller if needed, or stored as ID
      waktu: new Date().toISOString(),
    }];

    return this.rekapRepository.create({
      nama: data.nama,
      tanggal_perekapan: data.tanggalPerekapan,
      dibuat_oleh_id: data.dibuatOlehId,
      prodi_id: data.prodiId,
      jurusan_id: data.jurusanId,
      filter: data.filter,
      kegiatan_data: data.kegiatanData,
      riwayat: riwayat,
    });
  }

  async getAllRekap(where: Prisma.RekapLaporanWhereInput) {
    return this.rekapRepository.findAll(where);
  }

  async getRekapDetail(id: string) {
    return this.rekapRepository.findById(id);
  }

  async updateRekap(id: string, data: {
    nama?: string;
    tanggalPerekapan?: Date;
    filter?: any;
    kegiatanData?: any[];
    dilakukanOlehName: string;
  }) {
    const existing = await this.rekapRepository.findById(id);
    if (!existing) throw new Error('Rekap tidak ditemukan');

    const riwayat = (existing.riwayat as any[]) || [];
    const changes: string[] = [];
    
    if (data.nama && data.nama !== existing.nama) {
      changes.push(`Nama diubah dari "${existing.nama}" menjadi "${data.nama}"`);
    }

    riwayat.push({
      aktivitas: 'Rekap diperbarui',
      detail: changes.join(', '),
      dilakukanOleh: data.dilakukanOlehName,
      waktu: new Date().toISOString(),
    });

    return this.rekapRepository.update(id, {
      nama: data.nama,
      tanggal_perekapan: data.tanggalPerekapan,
      filter: data.filter,
      kegiatan_data: data.kegiatanData,
      riwayat: riwayat,
    });
  }

  async deleteRekap(id: string) {
    return this.rekapRepository.delete(id);
  }
}
