import { prisma } from '../lib/prisma';

export class JabatanRepository {
  async findAllKajur(where: any) {
    return await prisma.jabatanKajur.findMany({
      where,
      include: {
        dosen: { select: { nama: true, nip: true } },
        jurusan: { select: { nama_jurusan: true, kode_jurusan: true } },
      },
      orderBy: { periode_mulai: 'desc' },
    });
  }

  async findKajurById(id: string) {
    return await prisma.jabatanKajur.findUnique({ where: { id } });
  }

  async findOverlapKajur(jurusan_id: string, periode_mulai: Date, periode_selesai: Date, excludeId?: string) {
    return await prisma.jabatanKajur.findFirst({
      where: {
        jurusan_id,
        id: excludeId ? { not: excludeId } : undefined,
        AND: [
          { periode_mulai: { lt: periode_selesai } },
          { periode_selesai: { gt: periode_mulai } },
        ],
      },
    });
  }

  async createKajur(data: any) {
    return await prisma.jabatanKajur.create({
      data,
      include: {
        dosen: { select: { nama: true, nip: true } },
        jurusan: { select: { nama_jurusan: true } },
      },
    });
  }

  async updateKajur(id: string, data: any) {
    return await prisma.jabatanKajur.update({
      where: { id },
      data,
      include: {
        dosen: { select: { nama: true, nip: true } },
        jurusan: { select: { nama_jurusan: true } },
      },
    });
  }

  async deleteKajur(id: string) {
    return await prisma.jabatanKajur.delete({ where: { id } });
  }

  async findAllKaprodi(where: any) {
    return await prisma.jabatanKaprodi.findMany({
      where,
      include: {
        dosen: { select: { nama: true, nip: true } },
        program_studi: { select: { nama_prodi: true, kode_prodi: true } },
      },
      orderBy: { periode_mulai: 'desc' },
    });
  }

  async findKaprodiById(id: string) {
    return await prisma.jabatanKaprodi.findUnique({ where: { id } });
  }

  async findOverlapKaprodi(program_studi_id: string, periode_mulai: Date, periode_selesai: Date, excludeId?: string) {
    return await prisma.jabatanKaprodi.findFirst({
      where: {
        program_studi_id,
        id: excludeId ? { not: excludeId } : undefined,
        AND: [
          { periode_mulai: { lt: periode_selesai } },
          { periode_selesai: { gt: periode_mulai } },
        ],
      },
    });
  }

  async createKaprodi(data: any) {
    return await prisma.jabatanKaprodi.create({
      data,
      include: {
        dosen: { select: { nama: true, nip: true } },
        program_studi: { select: { nama_prodi: true } },
      },
    });
  }

  async updateKaprodi(id: string, data: any) {
    return await prisma.jabatanKaprodi.update({
      where: { id },
      data,
      include: {
        dosen: { select: { nama: true, nip: true } },
        program_studi: { select: { nama_prodi: true } },
      },
    });
  }

  async deleteKaprodi(id: string) {
    return await prisma.jabatanKaprodi.delete({ where: { id } });
  }

  async findDosenById(id: string) {
    return await prisma.dosen.findUnique({
      where: { id },
      include: { program_studi: { select: { id: true, nama_prodi: true, jurusan_id: true } } },
    });
  }
}
