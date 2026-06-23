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
          where: { status: 'DISETUJUI' },
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
      include: { kepemilikan: { where: { status: 'DISETUJUI' } } }
    });
  }

  async findByHashFile(hashFile: string) {
    return await prisma.dokumen.findFirst({
      where: {
        hash_file: hashFile,
        deleted_at: null,
      },
      select: {
        id: true,
        file_path: true,
      },
      orderBy: { tanggal_upload: 'asc' },
    });
  }

  async findPreviewById(id: string) {
    return await prisma.dokumen.findUnique({
      where: { id },
      include: {
        kepemilikan: { where: { status: 'DISETUJUI' } },
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
      where: { dosen_id: dosenId, dokumen_id: dokumenId, status: 'DISETUJUI' },
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
            didistribusikan_oleh: {
              select: { tata_usaha: { select: { nama: true, nip: true } } },
            },
          },
          orderBy: { tanggal_distribusi: 'desc' },
        },
      },
    });
  }

  // Public methods (no authentication required)
  async findAllPublic() {
    return await prisma.dokumen.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        nama: true,
        jenis_dokumen: true,
        tanggal_upload: true,
        sumber_dokumen: true,
        kepemilikan: {
          where: { status: 'DISETUJUI' },
          select: {
            dosen: {
              select: {
                id: true,
                nama: true,
                nip: true
              }
            }
          }
        },
        lampiran_bukti: {
          select: {
            kegiatan: {
              select: {
                id: true,
                nama_kegiatan: true
              }
            }
          }
        }
      },
      orderBy: { tanggal_upload: 'desc' }
    });
  }

  async findByIdPublic(id: string) {
    return await prisma.dokumen.findUnique({
      where: { id },
      include: {
        kepemilikan: {
          where: { status: 'DISETUJUI' },
          select: {
            dosen: {
              select: {
                id: true,
                nama: true,
                nip: true,
                nidn: true,
                program_studi: {
                  select: {
                    id: true,
                    nama_prodi: true,
                    kode_prodi: true
                  }
                }
              }
            }
          }
        },
        lampiran_bukti: {
          include: {
            kegiatan: {
              select: {
                id: true,
                nama_kegiatan: true,
                kategori_tridharma: true,
                jenis_kegiatan: true,
                tanggal_mulai: true,
                tanggal_selesai: true
              }
            }
          }
        }
      }
    });
  }
}
