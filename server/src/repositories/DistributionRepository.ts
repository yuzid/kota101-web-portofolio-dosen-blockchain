import { prisma } from '../lib/prisma';

export class DistributionRepository {
  async create(data: {
    dokumen_id: string;
    dosen_id: string;
    didistribusikan_oleh_id: string;
    status?: string;
  }) {
    return await prisma.distribusiDokumen.create({ data });
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
    return await prisma.distribusiDokumen.createMany({ data });
  }

  async findByDokumen(dokumenId: string) {
    return await prisma.distribusiDokumen.findMany({
      where: { dokumen_id: dokumenId },
      include: {
        dosen: { select: { nama: true, nip: true, nidn: true } },
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
        kepemilikan: { select: { id: true } },
      },
      orderBy: { tanggal_distribusi: 'desc' },
    });
  }

  async findById(id: string) {
    return await prisma.distribusiDokumen.findUnique({
      where: { id },
      include: {
        dosen: { select: { nama: true, nip: true, nidn: true } },
        dokumen: true,
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
        kepemilikan: { select: { id: true } },
      },
    });
  }

  async findPendingByDosen(dosenId: string) {
    try {
      return await prisma.distribusiDokumen.findMany({
        where: {
          dosen_id: dosenId,
          status: 'MENUNGGU_KONFIRMASI',
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
    return await prisma.distribusiDokumen.findMany({
      where: { dosen_id: dosenId },
      include: {
        dokumen: true,
        didistribusikan_oleh: {
          select: { tata_usaha: { select: { nama: true, nip: true } } },
        },
        kepemilikan: { select: { id: true } },
      },
      orderBy: { tanggal_distribusi: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return await prisma.distribusiDokumen.update({
      where: { id },
      data: {
        status,
        tanggal_keputusan: new Date(),
      },
    });
  }

  async linkKepemilikan(distribusiId: string, kepemilikanId: string) {
    return await prisma.distribusiDokumen.update({
      where: { id: distribusiId },
      data: { kepemilikan_id: kepemilikanId },
    });
  }

  async findDistributionByDosenAndDokumen(dosenId: string, dokumenId: string) {
    return await prisma.distribusiDokumen.findFirst({
      where: {
        dosen_id: dosenId,
        dokumen_id: dokumenId,
      },
    });
  }

  async resetStatus(id: string) {
    return await prisma.distribusiDokumen.update({
      where: { id },
      data: {
        status: 'MENUNGGU_KONFIRMASI',
        tanggal_keputusan: null,
        kepemilikan_id: null,
      },
    });
  }

  async deleteById(id: string) {
    return await prisma.distribusiDokumen.delete({
      where: { id },
    });
  }
}
