import crypto from 'crypto';
import { KategoriTridharma, JenisKegiatan, PeranTridharma } from '@prisma/client';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { PageResponse, PageRequest, KategoriPendidikan, KategoriPenelitian, KategoriPengabdian, Semester as DomainSemester, KegiatanFilter } from '../domain/types';
import { KegiatanPendidikan, KegiatanPenelitian, KegiatanPengabdian, TugasTambahan } from '../domain/KegiatanSubclasses';

export class ActivityService {
  private activityRepository: ActivityRepository;

  constructor(activityRepository: ActivityRepository) {
    this.activityRepository = activityRepository;
  }

  isValidUUID(uuid: any): uuid is string {
    if (typeof uuid !== 'string') return false;
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return re.test(uuid);
  }

  mapKategoriTridharma(jenis: string): KategoriTridharma {
    switch (jenis?.toLowerCase()) {
      case 'pengajaran': return KategoriTridharma.PENDIDIKAN;
      case 'penelitian': return KategoriTridharma.PENELITIAN;
      case 'pengabdian': return KategoriTridharma.PENGABDIAN;
      case 'tugas_tambahan': return KategoriTridharma.TUGAS_TAMBAHAN;
      default: return KategoriTridharma.PENDIDIKAN;
    }
  }

  mapJenisKegiatan(kategori: string): JenisKegiatan {
    const k = kategori?.toLowerCase() || "";
    if (k.includes('ajar') || k.includes('mengajar')) return JenisKegiatan.PENGAJARAN;
    if (k.includes('bimbingan') || k.includes('pembimbing')) return JenisKegiatan.BIMBINGAN_MAHASISWA;
    if (k.includes('kurikulum') || k.includes('bahan ajar')) return JenisKegiatan.BAHAN_AJAR;
    if (k.includes('penelitian')) return JenisKegiatan.PENELITIAN;
    if (k.includes('publikasi') || k.includes('jurnal') || k.includes('prosiding')) return JenisKegiatan.PUBLIKASI_KARYA;
    if (k.includes('paten')) return JenisKegiatan.PATEN;
    if (k.includes('pengabdian') || k.includes('pelatihan') || k.includes('konsultasi')) return JenisKegiatan.PENGABDIAN;
    if (k.includes('pembicara')) return JenisKegiatan.PEMBICARA;
    if (k.includes('jurnal') && k.includes('pengelola')) return JenisKegiatan.PENGELOLA_JURNAL;
    if (k.includes('tugas tambahan') || k.includes('koordinator') || k.includes('sekretaris')) return JenisKegiatan.TUGAS_TAMBAHAN;
    return JenisKegiatan.TUGAS_TAMBAHAN;
  }

  async getAllActivities(dosenId: string, pageReq?: PageRequest): Promise<any> {
    const activities = await this.activityRepository.findAll(dosenId);
    
    let resultData = activities;
    if (pageReq) {
      const start = (pageReq.page - 1) * pageReq.size;
      resultData = activities.slice(start, start + pageReq.size);
    }

    const data = resultData.map(act => ({
      id: act.id,
      name: act.nama_kegiatan,
      jenisTridharma: act.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pengajaran' : act.kategori_tridharma.toLowerCase(),
      kategori: act.jenis_kegiatan,
      periode: act.periode,
      semester: act.semester.toLowerCase(),
      role: act.dosen_id === dosenId ? 'pencatat' : 'anggota',
      buktiCount: act.lampiran_bukti.length,
      updatedAt: act.tanggal_mulai.toISOString(),
    }));

    if (pageReq) {
      return {
        data,
        page: pageReq.page,
        totalPages: Math.ceil(activities.length / pageReq.size),
        totalElements: activities.length
      } as PageResponse<any>;
    }

    return data;
  }

  async getSummaryStats(dosenId: string) {
    const { activities, total_dokumen } = await this.activityRepository.findSummaryStats(dosenId);
    
    return {
      total: activities.length,
      pengajaran: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENDIDIKAN).length,
      penelitian: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENELITIAN).length,
      pengabdian: activities.filter(a => a.kategori_tridharma === KategoriTridharma.PENGABDIAN).length,
      tugas_tambahan: activities.filter(a => a.kategori_tridharma === KategoriTridharma.TUGAS_TAMBAHAN).length,
      tanpa_bukti: activities.filter(a => a.lampiran_bukti.length === 0).length,
      total_dokumen
    };
  }

  async getTanpaBukti(dosenId: string) {
    const activities = await this.activityRepository.findTanpaBukti(dosenId);
    return activities.map(a => ({
      id: a.id,
      name: a.nama_kegiatan,
      type: a.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'Pengajaran' : a.kategori_tridharma,
      date: a.tanggal_mulai.toISOString()
    }));
  }

  async getActivityById(id: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    // Instantiate domain objects based on category
    let domainActivity;
    const commonArgs = [
      activity.nama_kegiatan,
      activity.tanggal_mulai,
      activity.tanggal_selesai,
      activity.periode
    ] as [string, Date, Date, string];

    switch (activity.kategori_tridharma) {
      case KategoriTridharma.PENDIDIKAN:
        domainActivity = new KegiatanPendidikan(...commonArgs, activity.jenis_kegiatan as any, activity.semester as any);
        break;
      case KategoriTridharma.PENELITIAN:
        domainActivity = new KegiatanPenelitian(...commonArgs, activity.jenis_kegiatan as any);
        break;
      case KategoriTridharma.PENGABDIAN:
        domainActivity = new KegiatanPengabdian(...commonArgs, activity.jenis_kegiatan as any);
        break;
      default:
        domainActivity = new TugasTambahan(...commonArgs);
    }

    const dosenTerlibatMap = new Map<string, any>();
    dosenTerlibatMap.set(activity.dosen_id, {
      id: activity.dosen_id,
      name: activity.dosen.nama,
      nidn: activity.dosen.nip, 
      isPencatat: true,
      isKetua: true,
      dokumen: []
    });

    activity.partisipasi.forEach((p: any) => {
      if (!dosenTerlibatMap.has(p.dosen_id)) {
        dosenTerlibatMap.set(p.dosen_id, {
          id: p.dosen_id,
          name: p.dosen.nama,
          nidn: p.dosen.nidn || p.dosen.nip,
          isPencatat: false,
          isKetua: p.peran === PeranTridharma.KETUA,
          dokumen: []
        });
      }
    });

    activity.lampiran_bukti.forEach((lb: any) => {
      const docData = {
        id: lb.dokumen.id,
        name: lb.dokumen.nama,
        jenis: lb.dokumen.jenis_dokumen,
        tanggalUpload: lb.dokumen.tanggal_upload.toISOString(),
        hasHighlight: lb.highlighted
      };

      lb.dokumen.kepemilikan.forEach((k: any) => {
        const ownerInActivity = dosenTerlibatMap.get(k.dosen_id);
        if (ownerInActivity) {
          ownerInActivity.dokumen.push(docData);
        }
      });
    });

    return {
      id: activity.id,
      namaKegiatan: activity.nama_kegiatan,
      jenisTridharma: activity.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pengajaran' : activity.kategori_tridharma.toLowerCase(),
      kategori: activity.jenis_kegiatan,
      tanggalMulai: activity.tanggal_mulai.toISOString(),
      tanggalSelesai: activity.tanggal_selesai.toISOString(),
      tahunAkademik: activity.periode,
      semester: activity.semester.toLowerCase(),
      programStudi: activity.dosen.program_studi?.nama_prodi || "Umum",
      dosenTerlibat: Array.from(dosenTerlibatMap.values()),
      statusKelengkapan: activity.lampiran_bukti.length > 0 ? 'lengkap' : 'tidak_lengkap'
    };
  }

  async createActivity(dosenId: string, data: any) {
    const { 
      namaKegiatan, jenisTridharma, kategori, tanggalMulai, 
      tanggalSelesai, tahunAkademik, semester, anggota_ids, lampiran_ids 
    } = data;

    const activityData = {
      dosen_id: dosenId,
      nama_kegiatan: String(namaKegiatan),
      kategori_tridharma: this.mapKategoriTridharma(String(jenisTridharma)),
      jenis_kegiatan: this.mapJenisKegiatan(String(kategori)),
      tanggal_mulai: new Date(String(tanggalMulai)),
      tanggal_selesai: new Date(String(tanggalSelesai)),
      periode: String(tahunAkademik),
      semester: String(semester).toUpperCase(),
      tx_id: crypto.randomBytes(16).toString('hex'),
    };

    const partisipasiData: any[] = [];
    if (anggota_ids && Array.isArray(anggota_ids)) {
      anggota_ids.forEach((id: string) => {
        partisipasiData.push({ dosen_id: id, peran: PeranTridharma.ANGGOTA });
      });
    }

    if (!partisipasiData.some(p => p.dosen_id === dosenId)) {
      partisipasiData.push({ dosen_id: dosenId, peran: PeranTridharma.KETUA });
    }

    const lampiranData = (lampiran_ids && Array.isArray(lampiran_ids)) 
      ? lampiran_ids.map((docId: string) => ({ dokumen_id: docId, highlighted: false }))
      : [];

    return await this.activityRepository.create(activityData, partisipasiData, lampiranData);
  }

  async updateActivity(id: string, dosenId: string, data: any) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    if (activity.dosen_id !== dosenId) throw new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.');

    const { 
      namaKegiatan, jenisTridharma, kategori, 
      tanggalMulai, tanggalSelesai, tahunAkademik, semester 
    } = data;

    return await this.activityRepository.update(id, {
      nama_kegiatan: namaKegiatan ? String(namaKegiatan) : undefined,
      kategori_tridharma: jenisTridharma ? this.mapKategoriTridharma(String(jenisTridharma)) : undefined,
      jenis_kegiatan: kategori ? this.mapJenisKegiatan(String(kategori)) : undefined,
      tanggal_mulai: tanggalMulai ? new Date(String(tanggalMulai)) : undefined,
      tanggal_selesai: tanggalSelesai ? new Date(String(tanggalSelesai)) : undefined,
      periode: tahunAkademik ? String(tahunAkademik) : undefined,
      semester: semester ? String(semester).toUpperCase() : undefined,
    });
  }

  async deleteActivity(id: string, dosenId: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    if (activity.dosen_id !== dosenId) throw new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.');

    return await this.activityRepository.delete(id);
  }

  async getActivitiesByProdi(prodiId: string, filter: KegiatanFilter, pageReq: PageRequest): Promise<PageResponse<any>> {
    const activities = await this.activityRepository.findAllByProdi(prodiId, filter);
    const start = (pageReq.page - 1) * pageReq.size;
    const data = activities.slice(start, start + pageReq.size);
    return {
      data,
      page: pageReq.page,
      totalPages: Math.ceil(activities.length / pageReq.size),
      totalElements: activities.length
    };
  }

  async getActivitiesByJurusan(jurusanId: string, filter: KegiatanFilter, pageReq: PageRequest): Promise<PageResponse<any>> {
    const activities = await this.activityRepository.findAllByJurusan(jurusanId, filter);
    const start = (pageReq.page - 1) * pageReq.size;
    const data = activities.slice(start, start + pageReq.size);
    return {
      data,
      page: pageReq.page,
      totalPages: Math.ceil(activities.length / pageReq.size),
      totalElements: activities.length
    };
  }

  async addLampiran(id: string, dokumen_id: string) {
    if (!this.isValidUUID(id) || !this.isValidUUID(dokumen_id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    return await this.activityRepository.createLampiran({
      kegiatan_id: id,
      dokumen_id: String(dokumen_id),
      highlighted: false
    });
  }
}
