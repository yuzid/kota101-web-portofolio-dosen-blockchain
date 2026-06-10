import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class RekapRepository {
  async create(data: Prisma.RekapLaporanUncheckedCreateInput) {
    return prisma.rekapLaporan.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dosen: { select: { nama: true } },
            admin: { select: { nama: true } },
            tata_usaha: { select: { nama: true } }
          }
        },
        program_studi: true,
        jurusan: true
      }
    });
  }

  async findAll(where: Prisma.RekapLaporanWhereInput) {
    return prisma.rekapLaporan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dosen: { select: { nama: true } },
            admin: { select: { nama: true } },
            tata_usaha: { select: { nama: true } }
          }
        },
        program_studi: true,
        jurusan: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.rekapLaporan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dosen: { select: { nama: true } },
            admin: { select: { nama: true } },
            tata_usaha: { select: { nama: true } }
          }
        },
        program_studi: true,
        jurusan: true
      }
    });
  }

  async update(id: string, data: Prisma.RekapLaporanUncheckedUpdateInput) {
    return prisma.rekapLaporan.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dosen: { select: { nama: true } },
            admin: { select: { nama: true } },
            tata_usaha: { select: { nama: true } }
          }
        },
        program_studi: true,
        jurusan: true
      }
    });
  }

  async delete(id: string) {
    return prisma.rekapLaporan.delete({
      where: { id }
    });
  }
}
