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
        kepemilikan_dokumen: true,
        partisipasi: true,
        dosen: true,
      },
      orderBy: { tanggal_mulai: 'desc' }
    });
  }

  async findByJurusan(jurusanId: string, filter: KegiatanFilter, pageRequest: PageRequest): Promise<PageResponse<KegiatanTridharma>> {
    const { jenis, kategori, tanggalAwal, tanggalAkhir, search, prodiId, dosenId, status, periode, semester } = filter;
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
    if (jenis) {
      where.kategori_tridharma = Array.isArray(jenis) ? { in: jenis } : jenis;
    }
    if (kategori) {
      where.jenis_kegiatan = Array.isArray(kategori) ? { in: kategori } : kategori;
    }

    if (status) {
      if (status === 'lengkap') {
        where.kepemilikan_dokumen = { some: {} };
      } else {
        where.kepemilikan_dokumen = { none: {} };
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

    if (periode) where.periode = periode;
    if (semester) where.semester = semester;

    const [total, data] = await Promise.all([
      prisma.kegiatanTridharma.count({ where }),
      prisma.kegiatanTridharma.findMany({
        where,
        include: {
          dosen: { include: { program_studi: true } },
          kepemilikan_dokumen: {
            include: {
              dokumen: true,
              dosen: true,
            }
          },
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
    const { jenis, kategori, tanggalAwal, tanggalAkhir, search, dosenId, status, periode, semester } = filter;
    const { page, size } = pageRequest;
    const skip = (page - 1) * size;

    const where: any = {
      dosen: {
        program_studi_id: prodiId
      }
    };

    if (dosenId) where.dosen_id = dosenId;
    if (jenis) {
      where.kategori_tridharma = Array.isArray(jenis) ? { in: jenis } : jenis;
    }
    if (kategori) {
      where.jenis_kegiatan = Array.isArray(kategori) ? { in: kategori } : kategori;
    }

    if (status) {
      if (status === 'lengkap') {
        where.kepemilikan_dokumen = { some: {} };
      } else {
        where.kepemilikan_dokumen = { none: {} };
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

    if (periode) where.periode = periode;
    if (semester) where.semester = semester;

    const [total, data] = await Promise.all([
      prisma.kegiatanTridharma.count({ where }),
      prisma.kegiatanTridharma.findMany({
        where,
        include: {
          dosen: { include: { program_studi: true } },
          kepemilikan_dokumen: {
            include: {
              dokumen: true,
              dosen: true,
            }
          },
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
      include: { kepemilikan_dokumen: true }
    });

    const total_dokumen = await prisma.kepemilikanDokumen.count({
      where: { dosen_id: dosenId, status: 'DISETUJUI' },
    });

    return { activities, total_dokumen };
  }

  async findJurusanSummaryStats(jurusanId: string, filter: KegiatanFilter) {
    const { prodiId, dosenId, tanggalAwal, tanggalAkhir, search, status, periode, semester } = filter;

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
        where.kepemilikan_dokumen = { some: {} };
      } else {
        where.kepemilikan_dokumen = { none: {} };
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
    if (periode) where.periode = periode;
    if (semester) where.semester = semester;

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
    const { dosenId, tanggalAwal, tanggalAkhir, search, status, periode, semester } = filter;

    const where: any = {
      dosen: {
        program_studi_id: prodiId
      }
    };

    if (dosenId) where.dosen_id = dosenId;
    if (status) {
      if (status === 'lengkap') {
        where.kepemilikan_dokumen = { some: {} };
      } else {
        where.kepemilikan_dokumen = { none: {} };
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
    if (periode) where.periode = periode;
    if (semester) where.semester = semester;

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
        kepemilikan_dokumen: { none: {} }
      },
      orderBy: { tanggal_mulai: 'desc' },
      take: 5
    });
  }

  async findById(id: string) {
    return await prisma.kegiatanTridharma.findUnique({
      where: { id },
      include: {
        dosen: { include: { program_studi: true, user: { select: { email: true } } } },
        partisipasi: {
          include: {
            dosen: { include: { program_studi: true, user: { select: { email: true } } } },
          },
        },
        kepemilikan_dokumen: {
          include: {
            dokumen: true,
            highlights: { include: { highlight_rect: true } },
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
        // lampiranData: { dokumen_id, dosen_id }
        // Link kepemilikan dokumen ke kegiatan ini
        for (const lampiran of lampiranData) {
          await tx.kepemilikanDokumen.updateMany({
            where: { dosen_id: lampiran.dosen_id, dokumen_id: lampiran.dokumen_id },
            data: { kegiatan_id: activity.id }
          });
        }
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

  async findActivityIdsByDocumentId(dokumenId: string): Promise<string[]> {
    const kepemilikan = await prisma.kepemilikanDokumen.findMany({
      where: { dokumen_id: dokumenId, kegiatan_id: { not: null } },
      select: { kegiatan_id: true },
    });

    return [...new Set(
      kepemilikan.map((item) => item.kegiatan_id).filter(Boolean) as string[]
    )];
  }

  async delete(id: string) {
    // kepemilikan_dokumen.kegiatan_id akan otomatis di-set NULL via onDelete: SetNull
    return await prisma.$transaction([
      prisma.partisipasiKegiatanTridharma.deleteMany({ where: { kegiatan_tridharma_id: id } }),
      prisma.kegiatanTridharma.delete({ where: { id } })
    ]);
  }

  async createLampiran(data: { kegiatan_id: string; dokumen_id: string; dosen_id: string }) {
    // Link kepemilikan dokumen ke kegiatan dengan update kegiatan_id
    return await prisma.kepemilikanDokumen.update({
      where: { dosen_id_dokumen_id: { dosen_id: data.dosen_id, dokumen_id: data.dokumen_id } },
      data: { kegiatan_id: data.kegiatan_id }
    });
  }

  async deleteLampiran(kepemilikanId: string) {
    // Hanya unlink kepemilikan yang spesifik ini (set kegiatan_id = null)
    // Masing-masing kepemilikan bersifat independen per dosen
    await prisma.kepemilikanDokumen.update({
      where: { id: kepemilikanId },
      data: { kegiatan_id: null }
    });
  }

  async deleteLampiranBersama(kepemilikanId: string) {
    // Untuk mode BERSAMA: unlink SEMUA kepemilikan anggota untuk dokumen yang sama di kegiatan yang sama
    const kepemilikan = await prisma.kepemilikanDokumen.findUnique({
      where: { id: kepemilikanId },
      select: { dokumen_id: true, kegiatan_id: true }
    });

    if (!kepemilikan || !kepemilikan.kegiatan_id) return;

    await prisma.kepemilikanDokumen.updateMany({
      where: { dokumen_id: kepemilikan.dokumen_id, kegiatan_id: kepemilikan.kegiatan_id },
      data: { kegiatan_id: null }
    });
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

  async updateParticipationStatus(id: string, status: string, expectedCurrentStatus?: string) {
    if (expectedCurrentStatus) {
      const result = await prisma.partisipasiKegiatanTridharma.updateMany({
        where: { id, status: expectedCurrentStatus as any },
        data: { status: status as any },
      });
      if (result.count === 0) {
        throw new Error('Undangan kegiatan sudah diproses.');
      }
      return result;
    }
    return await prisma.partisipasiKegiatanTridharma.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async findParticipationById(id: string) {
    return await prisma.partisipasiKegiatanTridharma.findUnique({
      where: { id },
      include: {
        dosen: { include: { user: { select: { email: true } } } },
        kegiatan_tridharma: {
          include: {
            dosen: { include: { user: { select: { email: true } } } },
          },
        },
      },
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

  async getActivityDocumentIds(kegiatanId: string): Promise<string[]> {
    const kepemilikan = await prisma.kepemilikanDokumen.findMany({
      where: { kegiatan_id: kegiatanId },
      select: { dokumen_id: true }
    });
    return [...new Set(kepemilikan.map(k => k.dokumen_id))];
  }

  async createKepemilikanIfNotExists(dosenId: string, dokumenIds: string[], kegiatanId?: string) {
    const existing = await prisma.kepemilikanDokumen.findMany({
      where: { dosen_id: dosenId, dokumen_id: { in: dokumenIds } },
      select: { id: true, dokumen_id: true, status: true }
    });
    const existingIds = new Set(existing.map(e => e.dokumen_id));
    const inactiveIds = existing.filter(e => e.status !== 'DISETUJUI').map(e => e.id);
    if (inactiveIds.length > 0) {
      await prisma.kepemilikanDokumen.updateMany({
        where: { id: { in: inactiveIds } },
        data: { status: 'DISETUJUI', tanggal_keputusan: new Date() },
      });
    }
    const newData = dokumenIds
      .filter(id => !existingIds.has(id))
      .map(dokumen_id => ({
        dosen_id: dosenId,
        dokumen_id,
        ...(kegiatanId ? { kegiatan_id: kegiatanId } : {})
      }));
    if (newData.length > 0) {
      await prisma.kepemilikanDokumen.createMany({ data: newData });
    }
    // Jika kegiatanId diberikan, link kepemilikan yang sudah ada ke kegiatan ini
    if (kegiatanId && existing.length > 0) {
      await prisma.kepemilikanDokumen.updateMany({
        where: { dosen_id: dosenId, dokumen_id: { in: dokumenIds }, kegiatan_id: null },
        data: { kegiatan_id: kegiatanId }
      });
    }
  }

  async getDiterimaMemberIds(kegiatanId: string): Promise<string[]> {
    const activity = await prisma.kegiatanTridharma.findUnique({
      where: { id: kegiatanId },
      select: {
        dosen_id: true,
        partisipasi: {
          where: { status: 'DITERIMA' },
          select: { dosen_id: true }
        }
      }
    });
    if (!activity) return [];
    const ids = [activity.dosen_id];
    activity.partisipasi.forEach(p => {
      if (!ids.includes(p.dosen_id)) ids.push(p.dosen_id);
    });
    return ids;
  }

  // Public methods (no authentication required)
  async findAllPublic() {
    return await prisma.kegiatanTridharma.findMany({
      include: {
        dosen: {
          select: {
            id: true,
            nama: true,
            nip: true,
            program_studi: {
              select: {
                id: true,
                nama_prodi: true,
                kode_prodi: true
              }
            }
          }
        },
        partisipasi: {
          select: {
            dosen: {
              select: {
                id: true,
                nama: true,
                nip: true
              }
            },
            peran: true,
            status: true
          }
        },
        kepemilikan_dokumen: {
          include: {
            dokumen: {
              select: {
                id: true,
                nama: true,
                jenis_dokumen: true,
                tanggal_upload: true
              }
            }
          }
        }
      },
      orderBy: { tanggal_mulai: 'desc' }
    });
  }

  async findByIdPublic(id: string) {
    return await prisma.kegiatanTridharma.findUnique({
      where: { id },
      include: {
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
        },
        partisipasi: {
          select: {
            dosen: {
              select: {
                id: true,
                nama: true,
                nip: true,
                nidn: true
              }
            },
            peran: true,
            status: true
          }
        },
        kepemilikan_dokumen: {
          select: {
            id: true,
            dosen_id: true,
            dokumen: {
              select: {
                id: true,
                nama: true,
                jenis_dokumen: true,
                sumber_dokumen: true,
                tanggal_upload: true,
                hash_file: true,
                file_path: true
              }
            }
          }
        },
        audit_trail: true
      }
    });
  }
}
