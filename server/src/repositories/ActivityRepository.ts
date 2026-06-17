import { prisma } from '../lib/prisma';
import { KegiatanFilter, PageRequest, PageResponse } from '../types/activity';
import { KegiatanTridharma } from '@prisma/client';

export class ActivityRepository {
  async findAll(dosenId: string) {
    return await prisma.kegiatanTridharma.findMany({
      where: {
        OR: [
          { dosen_id: dosenId },
          { partisipasi: { some: { dosen_id: dosenId, status: 'DITERIMA' } } }
        ]
      },
      include: {
        lampiran_bukti: true,
        partisipasi: true,
        dosen: true,
      },
      orderBy: { tanggal_mulai: 'desc' }
    });
  }

  async findByJurusan(jurusanId: string, filter: KegiatanFilter, pageRequest: PageRequest): Promise<PageResponse<KegiatanTridharma>> {
    const { jenis, kategori, tanggalAwal, tanggalAkhir, search, prodiId, dosenId, status } = filter;
    const { page, size } = pageRequest;
    const skip = (page - 1) * size;

    const where: any = {
      dosen: {
        program_studi: {
          jurusan_id: jurusanId
        }
      }
    };

    if (prodiId) where.dosen.program_studi_id = prodiId;
    if (dosenId) where.dosen_id = dosenId;
    if (jenis) where.kategori_tridharma = jenis;
    if (kategori) where.jenis_kegiatan = kategori;

    if (status) {
      if (status === 'lengkap') {
        where.lampiran_bukti = { some: {} };
      } else {
        where.lampiran_bukti = { none: {} };
      }
    }

    if (tanggalAwal || tanggalAkhir) {
      where.tanggal_mulai = {};
      if (tanggalAwal) where.tanggal_mulai.gte = new Date(tanggalAwal);
      if (tanggalAkhir) where.tanggal_mulai.lte = new Date(tanggalAkhir);
    }

    if (search) {
      where.nama_kegiatan = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      prisma.kegiatanTridharma.count({ where }),
      prisma.kegiatanTridharma.findMany({
        where,
        include: {
          dosen: { include: { program_studi: true } },
          lampiran_bukti: true,
          partisipasi: { include: { dosen: true } }
        },
        orderBy: { tanggal_mulai: 'desc' },
        skip,
        take: size
      })
    ]);

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size)
    };
  }

  async findByProdi(prodiId: string, filter: KegiatanFilter, pageRequest: PageRequest): Promise<PageResponse<KegiatanTridharma>> {
    const { jenis, kategori, tanggalAwal, tanggalAkhir, search } = filter;
    const { page, size } = pageRequest;
    const skip = (page - 1) * size;

    const where: any = {
      dosen: {
        program_studi_id: prodiId
      }
    };

    if (jenis) where.kategori_tridharma = jenis;
    if (kategori) where.jenis_kegiatan = kategori;

    if (tanggalAwal || tanggalAkhir) {
      where.tanggal_mulai = {};
      if (tanggalAwal) where.tanggal_mulai.gte = new Date(tanggalAwal);
      if (tanggalAkhir) where.tanggal_mulai.lte = new Date(tanggalAkhir);
    }

    if (search) {
      where.nama_kegiatan = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      prisma.kegiatanTridharma.count({ where }),
      prisma.kegiatanTridharma.findMany({
        where,
        include: {
          dosen: { include: { program_studi: true } },
          lampiran_bukti: true,
          partisipasi: { include: { dosen: true } }
        },
        orderBy: { tanggal_mulai: 'desc' },
        skip,
        take: size
      })
    ]);

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size)
    };
  }

  async findSummaryStats(dosenId: string) {
    const activities = await prisma.kegiatanTridharma.findMany({
      where: {
        OR: [
          { dosen_id: dosenId },
          { partisipasi: { some: { dosen_id: dosenId, status: 'DITERIMA' } } }
        ]
      },
      include: { lampiran_bukti: true }
    });

    const total_dokumen = await prisma.kepemilikanDokumen.count({ where: { dosen_id: dosenId } });

    return { activities, total_dokumen };
  }

  async findJurusanSummaryStats(jurusanId: string, filter: KegiatanFilter) {
    const { prodiId, dosenId, tanggalAwal, tanggalAkhir, search, status } = filter;

    const where: any = {
      dosen: {
        program_studi: {
          jurusan_id: jurusanId
        }
      }
    };

    if (prodiId) where.dosen.program_studi_id = prodiId;
    if (dosenId) where.dosen_id = dosenId;
    if (status) {
      if (status === 'lengkap') {
        where.lampiran_bukti = { some: {} };
      } else {
        where.lampiran_bukti = { none: {} };
      }
    }
    if (tanggalAwal || tanggalAkhir) {
      where.tanggal_mulai = {};
      if (tanggalAwal) where.tanggal_mulai.gte = new Date(tanggalAwal);
      if (tanggalAkhir) where.tanggal_mulai.lte = new Date(tanggalAkhir);
    }
    if (search) {
      where.nama_kegiatan = { contains: search, mode: 'insensitive' };
    }

    const stats = await prisma.kegiatanTridharma.groupBy({
      by: ['kategori_tridharma'],
      where,
      _count: true
    });

    const total = await prisma.kegiatanTridharma.count({ where });

    return {
      semua: total,
      PENDIDIKAN: stats.find(s => s.kategori_tridharma === 'PENDIDIKAN')?._count || 0,
      PENELITIAN: stats.find(s => s.kategori_tridharma === 'PENELITIAN')?._count || 0,
      PENGABDIAN: stats.find(s => s.kategori_tridharma === 'PENGABDIAN')?._count || 0,
      TUGAS_TAMBAHAN: stats.find(s => s.kategori_tridharma === 'TUGAS_TAMBAHAN')?._count || 0,
    };
  }

  async findProdiSummaryStats(prodiId: string, filter: KegiatanFilter) {
    const { dosenId, tanggalAwal, tanggalAkhir, search, status } = filter;

    const where: any = {
      dosen: {
        program_studi_id: prodiId
      }
    };

    if (dosenId) where.dosen_id = dosenId;
    if (status) {
      if (status === 'lengkap') {
        where.lampiran_bukti = { some: {} };
      } else {
        where.lampiran_bukti = { none: {} };
      }
    }
    if (tanggalAwal || tanggalAkhir) {
      where.tanggal_mulai = {};
      if (tanggalAwal) where.tanggal_mulai.gte = new Date(tanggalAwal);
      if (tanggalAkhir) where.tanggal_mulai.lte = new Date(tanggalAkhir);
    }
    if (search) {
      where.nama_kegiatan = { contains: search, mode: 'insensitive' };
    }

    const stats = await prisma.kegiatanTridharma.groupBy({
      by: ['kategori_tridharma'],
      where,
      _count: true
    });

    const total = await prisma.kegiatanTridharma.count({ where });

    return {
      semua: total,
      PENDIDIKAN: stats.find(s => s.kategori_tridharma === 'PENDIDIKAN')?._count || 0,
      PENELITIAN: stats.find(s => s.kategori_tridharma === 'PENELITIAN')?._count || 0,
      PENGABDIAN: stats.find(s => s.kategori_tridharma === 'PENGABDIAN')?._count || 0,
      TUGAS_TAMBAHAN: stats.find(s => s.kategori_tridharma === 'TUGAS_TAMBAHAN')?._count || 0,
    };
  }

  async findTanpaBukti(dosenId: string) {
    return await prisma.kegiatanTridharma.findMany({
      where: {
        dosen_id: dosenId,
        lampiran_bukti: { none: {} }
      },
      orderBy: { tanggal_mulai: 'desc' },
      take: 5
    });
  }

  async findById(id: string) {
    return await prisma.kegiatanTridharma.findUnique({
      where: { id },
      include: {
        dosen: { include: { program_studi: true } },
        partisipasi: { include: { dosen: true } },
        lampiran_bukti: {
          include: {
            dokumen: {
              include: {
                kepemilikan: {
                  include: { highlights: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async create(activityData: any, partisipasiData: any[], lampiranData: any[]) {
    return await prisma.$transaction(async (tx) => {
      const activity = await tx.kegiatanTridharma.create({ data: activityData });

      const partisipasi = partisipasiData.map(p => ({ ...p, kegiatan_tridharma_id: activity.id }));
      await tx.partisipasiKegiatanTridharma.createMany({ data: partisipasi });

      if (lampiranData.length > 0) {
        const lampiran = lampiranData.map(l => ({ ...l, kegiatan_id: activity.id }));
        await tx.lampiranBukti.createMany({ data: lampiran });
      }

      return activity;
    });
  }

  async update(id: string, data: any) {
    return await prisma.kegiatanTridharma.update({
      where: { id },
      data
    });
  }

  async updateTransactionId(id: string, txId: string) {
    return await prisma.kegiatanTridharma.update({
      where: { id },
      data: { tx_id: txId },
    });
  }

  async delete(id: string) {
    return await prisma.$transaction([
      prisma.partisipasiKegiatanTridharma.deleteMany({ where: { kegiatan_tridharma_id: id } }),
      prisma.lampiranBukti.deleteMany({ where: { kegiatan_id: id } }),
      prisma.kegiatanTridharma.delete({ where: { id } })
    ]);
  }

  async createLampiran(data: any) {
    return await prisma.lampiranBukti.create({ data });
  }

  async deleteLampiran(id: string) {
    return await prisma.lampiranBukti.delete({ where: { id } });
  }

  async findParticipationsByDosen(dosenId: string) {
    return await prisma.partisipasiKegiatanTridharma.findMany({
      where: { dosen_id: dosenId },
      include: {
        kegiatan_tridharma: {
          include: {
            dosen: true,
          },
        },
      },
      orderBy: { kegiatan_tridharma: { tanggal_mulai: 'desc' } },
    });
  }

  async findPendingConfirmations(dosenId: string) {
    return await prisma.partisipasiKegiatanTridharma.findMany({
      where: {
        dosen_id: dosenId,
        status: 'MENUNGGU_KONFIRMASI',
      },
      include: {
        kegiatan_tridharma: {
          include: {
            dosen: true,
          },
        },
      },
      orderBy: { kegiatan_tridharma: { tanggal_mulai: 'desc' } },
    });
  }

  async updateParticipationStatus(id: string, status: string) {
    return await prisma.partisipasiKegiatanTridharma.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async createParticipation(data: { dosen_id: string; kegiatan_tridharma_id: string; peran: string; status: string }) {
    return await prisma.partisipasiKegiatanTridharma.create({ data: data as any });
  }

  async deleteParticipation(dosenId: string, kegiatanId: string) {
    return await prisma.partisipasiKegiatanTridharma.deleteMany({
      where: {
        dosen_id: dosenId,
        kegiatan_tridharma_id: kegiatanId,
      },
    });
  }
}
