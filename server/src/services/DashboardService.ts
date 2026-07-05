import { prisma } from '../lib/prisma';
import { DistributionRepository } from '../repositories/DistributionRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class DashboardService {
  private distributionRepository: DistributionRepository;
  private activityRepository: ActivityRepository;

  constructor() {
    this.distributionRepository = new DistributionRepository();
    this.activityRepository = new ActivityRepository();
  }

  async getStafTuDashboard(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [distributedThisMonth, pending, draft, uniqueDosenCount, recentDistributions] = await Promise.all([
      // Terdistribusi bulan ini oleh user ini
      prisma.kepemilikanDokumen.count({
        where: {
          didistribusikan_oleh_id: userId,
          status: 'DISETUJUI',
          tanggal_distribusi: { gte: startOfMonth }
        } as any
      }),
      // Menunggu distribusi (status menunggu konfirmasi) oleh user ini
      prisma.kepemilikanDokumen.count({
        where: {
          didistribusikan_oleh_id: userId,
          status: 'MENUNGGU_KONFIRMASI'
        } as any
      }),
      // Draft: Dokumen Tata Usaha yang tidak memiliki relasi kepemilikan sama sekali
      prisma.dokumen.count({
        where: {
          sumber_dokumen: 'TATA_USAHA',
          deleted_at: null,
          kepemilikan: { none: {} }
        }
      }),
      // Jumlah dosen penerima unik dari distribusi user ini
      prisma.kepemilikanDokumen.groupBy({
        by: ['dosen_id'],
        where: {
          didistribusikan_oleh_id: userId
        }
      }).then(res => res.length),
      // Distribusi terbaru
      prisma.kepemilikanDokumen.findMany({
        where: {
          didistribusikan_oleh_id: userId
        },
        include: {
          dokumen: true,
          dosen: true
        },
        orderBy: {
          tanggal_distribusi: 'desc'
        },
        take: 5
      })
    ]);

    // Tren 6 bulan terakhir
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const distributionsForTrend = await prisma.kepemilikanDokumen.findMany({
      where: {
        didistribusikan_oleh_id: userId,
        tanggal_distribusi: { gte: sixMonthsAgo }
      },
      select: {
        tanggal_distribusi: true
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const trendMap = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      trendMap.set(label, 0);
    }

    distributionsForTrend.forEach((d: any) => {
      if (d.tanggal_distribusi) {
        const date = new Date(d.tanggal_distribusi);
        const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (trendMap.has(label)) {
          trendMap.set(label, trendMap.get(label)! + 1);
        }
      }
    });

    const monthlyTrend = Array.from(trendMap.entries()).map(([month, count]) => ({
      month,
      count
    }));

    return {
      distributed: distributedThisMonth, // alias to match KPI card mapping easily if needed
      distributedThisMonth,
      pending,
      draft,
      dosenPenerima: uniqueDosenCount,
      monthlyTrend,
      recentDocs: (recentDistributions as any[]).map((kd: any) => ({
        name: kd.dokumen.nama,
        recipients: kd.dosen.nama, // map for display
        date: this.formatRelativeTime(new Date(kd.tanggal_distribusi)),
        status: kd.status === 'DISETUJUI' ? 'Terdistribusi' : kd.status === 'DITOLAK' ? 'Ditolak' : 'Menunggu',
        dokumen_id: kd.dokumen_id
      })),
    };
  }

  async getAdminDashboard() {
    const [totalUsers, dosenAktif, stafTuCount, jurusanCount, prodiCount, rolesGroupBy, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.dosen.count(),
      prisma.tataUsaha.count(),
      prisma.jurusan.count(),
      prisma.programStudi.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
          dosen: { select: { nama: true } },
          tata_usaha: { select: { nama: true } },
          admin: { select: { nama: true } }
        }
      })
    ]);

    const roleMap: Record<string, string> = {
      admin: 'Admin',
      dosen: 'Dosen',
      staf_tu: 'Staf TU',
      kaprodi: 'Kaprodi',
      kajur: 'Kajur'
    };

    const rolesData = rolesGroupBy.map(r => ({
      name: roleMap[r.role] || r.role,
      value: r._count.id
    }));

    const recentLogs = recentUsers.map(u => ({
      name: u.dosen?.nama || u.tata_usaha?.nama || u.admin?.nama || u.email,
      role: roleMap[u.role] || u.role,
      email: u.email
    }));

    return {
      totalUsers,
      dosenAktif,
      stafTuCount,
      jurusanProdi: `${jurusanCount} / ${prodiCount}`,
      rolesData,
      recentLogs
    };
  }

  async getDosenDashboard(dosenId: string) {
    const [stats, tanpaBukti, totalDokumen, perluKonfirmasi] = await Promise.all([
      this.activityRepository.findSummaryStats(dosenId),
      this.activityRepository.findTanpaBukti(dosenId),
      prisma.kepemilikanDokumen.count({
        where: { dosen_id: dosenId, status: 'DISETUJUI' } as any,
      }),
      prisma.partisipasiKegiatanTridharma.count({
        where: { dosen_id: dosenId, status: 'MENUNGGU_KONFIRMASI' } as any,
      }),
    ]);

    const activities: any[] = (stats as any).activities || [];
    const total = activities.length;
    const pengajaran = activities.filter(a => a.kategori_tridharma === 'PENDIDIKAN').length;
    const penelitian = activities.filter(a => a.kategori_tridharma === 'PENELITIAN').length;
    const pengabdian = activities.filter(a => a.kategori_tridharma === 'PENGABDIAN').length;
    const tugasTambahan = activities.filter(a => a.kategori_tridharma === 'TUGAS_TAMBAHAN').length;
    const tanpaBuktiCount = (tanpaBukti as any[]).length;
    const totalSelesai = activities.filter(a => (a.lampiran_bukti || []).length > 0).length;

    return {
      totalKegiatan: total,
      pengajaran,
      penelitian,
      pengabdian,
      tugasTambahan,
      tanpaBukti: tanpaBuktiCount,
      totalDokumen: (stats as any).total_dokumen || 0,
      totalSelesai,
      perluKonfirmasi,
      incomplete: (tanpaBukti as any[]).map((act: any) => ({
        name: act.nama_kegiatan,
        type: act.kategori_tridharma,
        date: act.tanggal_mulai
          ? new Date(act.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
      })),
    };
  }

  async getKaprodiDashboard(prodiId: string) {
    const [totalDosen, allDosenInProdi, belumLengkap, rekapDibuat] = await Promise.all([
      prisma.dosen.count({ where: { program_studi_id: prodiId } }),
      prisma.dosen.findMany({
        where: { program_studi_id: prodiId },
        include: { _count: { select: { kepemilikan_dokumen: true, kegiatan_tridharma: true } } },
      }),
      prisma.kegiatanTridharma.count({
        where: {
          dosen: { program_studi_id: prodiId },
          lampiran_bukti: { none: {} }
        }
      }),
      prisma.rekapLaporan.count({
        where: { prodi_id: prodiId }
      })
    ]);

    const allDosen: any[] = allDosenInProdi;
    const totalKegiatan = allDosen.reduce((sum, d) => sum + d._count.kegiatan_tridharma, 0);
    const avgDocsPerDosen = totalDosen > 0
      ? allDosen.reduce((sum, d) => sum + d._count.kepemilikan_dokumen, 0) / totalDosen
      : 0;

    const kegiatanWithoutBukti = await prisma.kegiatanTridharma.groupBy({
      by: ['dosen_id'],
      where: {
        dosen: { program_studi_id: prodiId },
        lampiran_bukti: { none: {} }
      },
      _count: { id: true }
    });

    const incompleteDosen = kegiatanWithoutBukti
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 4)
      .map(d => {
        const dosen = allDosenInProdi.find(ds => ds.id === d.dosen_id);
        return {
          name: dosen?.nama || 'Unknown',
          nidn: dosen?.nidn || '-',
          incomplete: d._count.id,
          total: dosen?._count.kegiatan_tridharma || 0,
        };
      });

    // Top dosen by activity count
    const topDosenRaw = [...allDosen]
      .sort((a, b) => b._count.kegiatan_tridharma - a._count.kegiatan_tridharma)
      .slice(0, 5)
      .map(d => ({
        name: d.nama,
        kegiatan: d._count.kegiatan_tridharma
      }));

    return {
      totalDosen,
      totalKegiatan,
      belumLengkap,
      rekapDibuat,
      completeness: Math.min(100, Math.round((avgDocsPerDosen / 5) * 100)),
      avgCompleteness: Math.min(100, Math.round((avgDocsPerDosen / 5) * 100)),
      incompleteDosen,
      topDosen: topDosenRaw,
    };
  }

  async getKajurDashboard(jurusanId: string) {
    const prodiList = await prisma.programStudi.findMany({
      where: { jurusan_id: jurusanId },
      select: {
        id: true,
        nama_prodi: true,
        _count: { select: { dosen: true } },
      },
    });

    const [kegiatanCounts, rekapJurusan] = await Promise.all([
      Promise.all(
        prodiList.map(async (prodi: any) => {
          const count = await prisma.kegiatanTridharma.count({
            where: {
              OR: [
                { dosen: { program_studi_id: prodi.id } },
                { partisipasi: { some: { dosen: { program_studi_id: prodi.id }, status: 'DITERIMA' } as any } },
              ],
            } as any,
          });
          const kegiatanWithBukti = await prisma.kegiatanTridharma.count({
            where: {
              dosen: { program_studi_id: prodi.id },
              lampiran_bukti: { some: {} }
            }
          });
          const completeness = count > 0
            ? Math.round((kegiatanWithBukti / count) * 100)
            : 100;
          return {
            name: prodi.nama_prodi,
            dosen: prodi._count.dosen,
            kegiatan: count,
            completeness: Math.min(100, completeness),
          };
        })
      ),
      prisma.rekapLaporan.count({
        where: { jurusan_id: jurusanId }
      })
    ]);

    const totalKegiatan = kegiatanCounts.reduce((sum: number, p: any) => sum + p.kegiatan, 0);
    const avgCompleteness = kegiatanCounts.length > 0
      ? Math.round(kegiatanCounts.reduce((sum: number, p: any) => sum + p.completeness, 0) / kegiatanCounts.length)
      : 0;

    return {
      totalProdi: prodiList.length,
      totalDosen: prodiList.reduce((sum: number, p: any) => sum + p._count.dosen, 0),
      totalKegiatan,
      avgCompleteness,
      ringkasanProdi: kegiatanCounts,
      rekapJurusan,
    };
  }

  private formatRelativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID');
  }
}
