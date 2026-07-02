import { prisma } from '../lib/prisma';

export const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  admin: { select: { nama: true } },
  tata_usaha: { select: { nip: true, nama: true, jurusan_id: true } },
  dosen: {
    select: {
      nip: true,
      nidn: true,
      nama: true,
      chain_address: true,
      program_studi: { select: { id: true, nama_prodi: true, jurusan_id: true } },
      jabatan_kajur: { select: { id: true, jurusan_id: true } },
      jabatan_kaprodi: { select: { id: true, program_studi_id: true } }
    }
  },
};

export class UserRepository {
  async findByEmail(email: string) {
    const now = new Date();
    return await prisma.user.findUnique({
      where: { email },
      include: {
        admin: { select: { nama: true } },
        tata_usaha: true,
        dosen: {
          include: {
            program_studi: { select: { nama_prodi: true } },
            jabatan_kajur: {
              where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
              select: { id: true, jurusan_id: true }
            },
            jabatan_kaprodi: {
              where: { periode_mulai: { lte: now }, periode_selesai: { gte: now } },
              select: { id: true, program_studi_id: true }
            }
          }
        }
      }
    });
  }

  async findAll(whereClause: any) {
    return await prisma.user.findMany({
      where: whereClause,
      select: userSelect,
      orderBy: { email: 'asc' },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  async findByIdWithDosen(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: { dosen: { include: { program_studi: true } } }
    });
  }

  async create(data: any) {
    return await prisma.user.create({
      data,
      select: userSelect,
    });
  }

  async update(id: string, userData: any, profileData: any, role: string) {
    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id }, data: userData });
      }

      const hasProfileData = Object.keys(profileData).length > 0;

      if (role === 'TATA_USAHA' && hasProfileData) {
        await tx.tataUsaha.update({ where: { id }, data: profileData });
      } else if (role === 'DOSEN' && hasProfileData) {
        await tx.dosen.update({ where: { id }, data: profileData });
      } else if (role === 'ADMIN' && profileData.nama) {
        await tx.admin.update({ where: { id }, data: { nama: profileData.nama } });
      }
    });
  }

  async delete(id: string) {
    return await prisma.user.delete({ where: { id } });
  }

  async findProgramStudi(id: string, jurusan_id: string) {
    return await prisma.programStudi.findFirst({
      where: { id, jurusan_id }
    });
  }

  async findProgramStudiById(id: string) {
    return await prisma.programStudi.findUnique({
      where: { id },
      select: { id: true, kode_prodi: true, nama_prodi: true, jurusan_id: true },
    });
  }
}
