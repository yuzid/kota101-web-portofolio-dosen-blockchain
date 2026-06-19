import { prisma } from '../lib/prisma';

export class DocumentRepository {
  async findAll(where: any) {
    return await prisma.dokumen.findMany({
      where,
      select: {
        id: true,
        nama: true,
        jenis_dokumen: true,
        tanggal_upload: true,
        sumber_dokumen: true,
        file_path: true,
        lampiran_bukti: {
          select: { id: true }
        },
        kepemilikan: {
          select: {
            dosen: {
              select: {
                nama: true,
                nip: true
              }
            },
            highlights: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { tanggal_upload: 'desc' }
    });
  }

  async findById(id: string) {
    return await prisma.dokumen.findUnique({
      where: { id },
      include: { kepemilikan: true }
    });
  }

  async findPreviewById(id: string) {
    return await prisma.dokumen.findUnique({
      where: { id },
      include: {
        kepemilikan: true,
        lampiran_bukti: {
          include: {
            kegiatan: {
              include: {
                dosen: { include: { program_studi: true } },
                partisipasi: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: any, recipientIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      const doc = await tx.dokumen.create({ data });
      const kepemilikanData = recipientIds.map(dosenId => ({
        dosen_id: dosenId,
        dokumen_id: doc.id
      }));
      await tx.kepemilikanDokumen.createMany({ data: kepemilikanData });
      return doc;
    });
  }

  async update(id: string, data: any) {
    return await prisma.dokumen.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string) {
    return await prisma.dokumen.update({
      where: { id },
      data: { deleted_at: new Date() } as any
    });
  }

  async findKepemilikan(dosenId: string, dokumenId: string) {
    return await prisma.kepemilikanDokumen.findFirst({
      where: { dosen_id: dosenId, dokumen_id: dokumenId },
    });
  }

  async createKepemilikan(dosenId: string, dokumenId: string) {
    return await prisma.kepemilikanDokumen.create({
      data: { dosen_id: dosenId, dokumen_id: dokumenId },
    });
  }

  async findWithDistribusi(id: string) {
    return await prisma.dokumen.findUnique({
      where: { id },
      include: {
        kepemilikan: {
          include: {
            dosen: { select: { nama: true, nip: true, nidn: true } },
          },
        },
        distribusi_dokumen: {
          include: {
            dosen: { select: { nama: true, nip: true, nidn: true } },
            didistribusikan_oleh: {
              select: { tata_usaha: { select: { nama: true, nip: true } } },
            },
            kepemilikan: { select: { id: true } },
          },
          orderBy: { tanggal_distribusi: 'desc' },
        },
      },
    });
  }
}
