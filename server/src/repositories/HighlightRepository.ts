import { prisma } from '../lib/prisma';

export class HighlightRepository {
  async findByKepemilikanId(kepemilikanId: string) {
    return await prisma.highlight.findMany({
      where: { kepemilikan_id: kepemilikanId },
      include: { highlight_rect: true },
    });
  }

  async findById(id: string) {
    return await prisma.highlight.findUnique({
      where: { id },
      include: { highlight_rect: true },
    });
  }

  async create(data: any) {
    const { kepemilikan_id, page_number, highlighted_text, highlight_rect } = data;

    return await prisma.highlight.create({
      data: {
        kepemilikan_id,
        page_number,
        highlighted_text,
        highlight_rect: {
          create: highlight_rect,
        },
      },
      include: { highlight_rect: true },
    });
  }

  async update(id: string, data: any) {
    const { page_number, highlighted_text, highlight_rect } = data;

    return await prisma.$transaction(async (tx) => {
      // Update basic fields
      const highlight = await tx.highlight.update({
        where: { id },
        data: {
          page_number,
          highlighted_text,
        },
      });

      // If rects are provided, replace them
      if (highlight_rect && Array.isArray(highlight_rect)) {
        await tx.highlightRect.deleteMany({
          where: { highlight_id: id },
        });

        await tx.highlightRect.createMany({
          data: highlight_rect.map((rect: any) => ({
            ...rect,
            highlight_id: id,
          })),
        });
      }

      return await tx.highlight.findUnique({
        where: { id },
        include: { highlight_rect: true },
      });
    });
  }

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
      await tx.highlightRect.deleteMany({
        where: { highlight_id: id },
      });
      return await tx.highlight.delete({
        where: { id },
      });
    });
  }

  async deleteByKepemilikanId(kepemilikanId: string) {
    return await prisma.$transaction(async (tx) => {
      const highlights = await tx.highlight.findMany({
        where: { kepemilikan_id: kepemilikanId },
        select: { id: true },
      });

      const highlightIds = highlights.map((h) => h.id);

      await tx.highlightRect.deleteMany({
        where: { highlight_id: { in: highlightIds } },
      });

      return await tx.highlight.deleteMany({
        where: { kepemilikan_id: kepemilikanId },
      });
    });
  }

  async findKepemilikanId(dosenId: string, dokumenId: string) {
    const kepemilikan = await prisma.kepemilikanDokumen.findFirst({
      where: {
        dosen_id: dosenId,
        dokumen_id: dokumenId,
      },
      select: { id: true },
    });
    return kepemilikan?.id;
  }
}
