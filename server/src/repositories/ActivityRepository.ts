import { prisma } from '../lib/prisma';

export class ActivityRepository {
  async findAll(dosenId: string) {
    return await prisma.kegiatanTridharma.findMany({
      where: {
        OR: [
          { dosen_id: dosenId },
          { partisipasi: { some: { dosen_id: dosenId } } }
        ]
      },
      include: {
        lampiran_bukti: true,
        partisipasi: true
      },
      orderBy: { tanggal_mulai: 'desc' }
    });
  }

  async findSummaryStats(dosenId: string) {
    const activities = await prisma.kegiatanTridharma.findMany({
      where: {
        OR: [
          { dosen_id: dosenId },
          { partisipasi: { some: { dosen_id: dosenId } } }
        ]
      },
      include: { lampiran_bukti: true }
    });
    
    const total_dokumen = await prisma.kepemilikanDokumen.count({ where: { dosen_id: dosenId } });
    
    return { activities, total_dokumen };
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
            dokumen: { include: { kepemilikan: true } }
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

async findAllByProdi(prodiId: string, filter: any) {
  return await prisma.kegiatanTridharma.findMany({
    where: {
      dosen: { program_studi_id: prodiId },
      // Apply other filters from filter object
    },
    include: { lampiran_bukti: true }
  });
}

async findAllByJurusan(jurusanId: string, filter: any) {
  return await prisma.kegiatanTridharma.findMany({
    where: {
      dosen: { program_studi: { jurusan_id: jurusanId } },
    },
    include: { lampiran_bukti: true }
  });
}
}

