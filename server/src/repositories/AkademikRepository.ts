import { prisma } from '../lib/prisma';

export class AkademikRepository {
  // Jurusan
  async findAllJurusan() {
    return await prisma.jurusan.findMany({
      include: {
        program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
      },
      orderBy: { kode_jurusan: 'asc' },
    });
  }

  async findJurusanById(id: string) {
    return await prisma.jurusan.findUnique({
      where: { id },
      include: {
        program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
      },
    });
  }

  async findJurusanByKode(kode_jurusan: string) {
    return await prisma.jurusan.findUnique({ where: { kode_jurusan } });
  }

  async createJurusan(data: any) {
    return await prisma.jurusan.create({
      data,
      include: {
        program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
      },
    });
  }

  async updateJurusan(id: string, data: any) {
    return await prisma.jurusan.update({
      where: { id },
      data,
      include: {
        program_studi: { select: { id: true, kode_prodi: true, nama_prodi: true } },
      },
    });
  }

  async deleteJurusan(id: string) {
    return await prisma.jurusan.delete({ where: { id } });
  }

  // Prodi
  async findAllProdi(where: any) {
    return await prisma.programStudi.findMany({
      where,
      include: {
        jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
      },
      orderBy: { kode_prodi: 'asc' },
    });
  }

  async findProdiById(id: string) {
    return await prisma.programStudi.findUnique({
      where: { id },
      include: {
        jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
      },
    });
  }

  async findProdiByKode(kode_prodi: string) {
    return await prisma.programStudi.findUnique({ where: { kode_prodi } });
  }

  async createProdi(data: any) {
    return await prisma.programStudi.create({
      data,
      include: {
        jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
      },
    });
  }

  async updateProdi(id: string, data: any) {
    return await prisma.programStudi.update({
      where: { id },
      data,
      include: {
        jurusan: { select: { id: true, kode_jurusan: true, nama_jurusan: true } },
      },
    });
  }

  async deleteProdi(id: string) {
    return await prisma.programStudi.delete({ where: { id } });
  }
}
