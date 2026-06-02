import { prisma } from '../lib/prisma';
import { Dokumen } from '../domain/Dokumen';
import { JenisDokumen as DomainJenisDokumen, SumberDokumen as DomainSumberDokumen } from '../domain/types';

export class DocumentRepository {
  async findAllDomain(where: any): Promise<Dokumen[]> {
    const data = await prisma.dokumen.findMany({ where });
    return data.map(d => new Dokumen(
      d.nama,
      d.jenis_dokumen as unknown as DomainJenisDokumen,
      d.file_path,
      d.hash_file,
      d.sumber_dokumen as unknown as DomainSumberDokumen,
      d.tanggal_upload
    ));
  }

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
          select: {
            highlight: { select: { id: true } }
          }
        },
        kepemilikan: {
          select: {
            dosen: {
              select: {
                nama: true,
                nip: true
              }
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
}
