import { prisma } from '../lib/prisma';

export class DistributionRepository {
  async create(data: {
    dokumen_id: string;
    dosen_id: string;
    didistribusikan_oleh_id: string;
    status?: string;
  }) {
    return await prisma.kepemilikanDokumen.create({
      data: { ...data, tanggal_distribusi: new Date() },
    });
  }

  async createMany(
    dokumenId: string,
    recipientIds: string[],
    tuUserId: string,
  ) {
    const data = recipientIds.map(dosen_id => ({
      dokumen_id: dokumenId,
      dosen_id,
      didistribusikan_oleh_id: tuUserId,
      status: 'MENUNGGU_KONFIRMASI',
    }));
    return await prisma.kepemilikanDokumen.createMany({
      data: data.map(item => ({ ...item, tanggal_distribusi: new Date() })),
      skipDuplicates: true,
    });
  }

  async findDosenRecipientsByIds(dosenIds: string[]) {
    return await prisma.dosen.findMany({
      where: { id: { in: dosenIds } },
      select: {
        id: true,
        nama: true,
        user: { select: { email: true } },
      },
    });
  }

  async findTataUsahaSenderByUserId(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        tata_usaha: { select: { nama: true, nip: true } },
      },
    });
  }

  async findDistributedDosenIds(dokumenId: string, dosenIds: string[]) {
    const distributions = await prisma.kepemilikanDokumen.findMany({
      where: {
        dokumen_id: dokumenId,
        dosen_id: { in: dosenIds },
        didistribusikan_oleh_id: { not: null },
      },
      select: { dosen_id: true },
    });
    return distributions.map(distribution => distribution.dosen_id);
  }

  async findByDokumen(dokumenId: string) {
    return await prisma.kepemilikanDokumen.findMany({
      where: {
        dokumen_id: dokumenId,
        didistribusikan_oleh_id: { not: null },
      },
      include: {
        dosen: { select: { nama: true, nip: true, nidn: true } },
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
      },
      orderBy: { tanggal_distribusi: 'desc' },
    });
  }

  async findById(id: string) {
    return await prisma.kepemilikanDokumen.findFirst({
      where: { id, didistribusikan_oleh_id: { not: null } },
      include: {
        dosen: { select: { nama: true, nip: true, nidn: true } },
        dokumen: true,
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
      },
    });
  }

  async findPendingByDosen(dosenId: string) {
    try {
      return await prisma.kepemilikanDokumen.findMany({
        where: {
          dosen_id: dosenId,
          status: 'MENUNGGU_KONFIRMASI',
          didistribusikan_oleh_id: { not: null },
        },
        include: {
          dokumen: {
            select: {
              id: true,
              nama: true,
              jenis_dokumen: true,
              file_path: true,
              tanggal_upload: true,
            },
          },
          didistribusikan_oleh: {
            select: { tata_usaha: { select: { nama: true, nip: true } } },
          },
        },
        orderBy: { tanggal_distribusi: 'desc' },
      });
    } catch (error) {
      console.error('[DistributionRepository] findPendingByDosen error:', error);
      throw new Error('Gagal memuat permintaan dokumen.');
    }
  }

  async findByDosen(dosenId: string) {
    return await prisma.kepemilikanDokumen.findMany({
      where: {
        dosen_id: dosenId,
        didistribusikan_oleh_id: { not: null },
      },
      include: {
        dokumen: true,
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
      },
      orderBy: { tanggal_distribusi: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, expectedCurrentStatus?: string) {
    if (expectedCurrentStatus) {
      const result = await prisma.kepemilikanDokumen.updateMany({
        where: { id, status: expectedCurrentStatus },
        data: {
          status,
          tanggal_keputusan: new Date(),
        },
      });
      if (result.count === 0) {
        throw new Error("Dokumen sudah diproses.");
      }
      return result;
    }
    return await prisma.kepemilikanDokumen.update({
      where: { id },
      data: {
        status,
        tanggal_keputusan: new Date(),
      },
    });
  }

  async findDistributionByDosenAndDokumen(dosenId: string, dokumenId: string) {
    return await prisma.kepemilikanDokumen.findFirst({
      where: {
        dosen_id: dosenId,
        dokumen_id: dokumenId,
        didistribusikan_oleh_id: { not: null },
      },
      include: {
        dosen: { select: { nama: true } },
        dokumen: { select: { nama: true } },
        didistribusikan_oleh: {
          select: {
            email: true,
            tata_usaha: { select: { nama: true } },
          },
        },
      },
    });
  }

  async resetStatus(id: string) {
    return await prisma.kepemilikanDokumen.update({
      where: { id },
      data: {
        status: 'MENUNGGU_KONFIRMASI',
        tanggal_keputusan: null,
      },
    });
  }

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
      const highlights = await tx.highlight.findMany({
        where: { kepemilikan_id: id },
        select: { id: true },
      });
      await tx.highlightRect.deleteMany({
        where: { highlight_id: { in: highlights.map(item => item.id) } },
      });
      await tx.highlight.deleteMany({ where: { kepemilikan_id: id } });
      return await tx.kepemilikanDokumen.delete({ where: { id } });
    });
  }
}
