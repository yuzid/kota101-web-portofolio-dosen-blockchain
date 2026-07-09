import { KategoriTridharma, JenisKegiatan, PeranTridharma } from '@prisma/client';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { prisma } from '../lib/prisma';
import { EmailService } from './EmailService';
import { MultiChainService } from './MultiChainService';

export class ActivityService {
  private activityRepository: ActivityRepository;
  private multiChainService: MultiChainService;
  private emailService: EmailService;

  constructor(
    activityRepository: ActivityRepository,
    multiChainService = new MultiChainService(),
    emailService = new EmailService(),
  ) {
    this.activityRepository = activityRepository;
    this.multiChainService = multiChainService;
    this.emailService = emailService;
  }

  private buildBlockchainPayload(activity: any, eventType: string) {
    return {
      event_type: eventType,
      payload_version: 1,
      recorded_at: new Date().toISOString(),
      kegiatan: {
        id: activity.id,
        dosen_id: activity.dosen_id,
        kategori_tridharma: activity.kategori_tridharma,
        jenis_kegiatan: activity.jenis_kegiatan,
        nama_kegiatan: activity.nama_kegiatan,
        tanggal_mulai: activity.tanggal_mulai.toISOString(),
        tanggal_selesai: activity.tanggal_selesai.toISOString(),
        periode: activity.periode,
        semester: activity.semester,
      },
      pencatat: {
        id: activity.dosen.id,
        nip: activity.dosen.nip,
        nidn: activity.dosen.nidn,
        nama: activity.dosen.nama,
        program_studi: {
          id: activity.dosen.program_studi.id,
          kode: activity.dosen.program_studi.kode_prodi,
          nama: activity.dosen.program_studi.nama_prodi,
        },
      },
      partisipasi: activity.partisipasi.map((participant: any) => ({
        dosen_id: participant.dosen_id,
        nip: participant.dosen.nip,
        nidn: participant.dosen.nidn,
        nama: participant.dosen.nama,
        peran: participant.peran,
        status: participant.status,
      })),
      dokumen_pendukung: activity.lampiran_bukti.map((lampiran: any) => ({
        dokumen_id: lampiran.dokumen.id,
        nama: lampiran.dokumen.nama,
        jenis_dokumen: lampiran.dokumen.jenis_dokumen,
        sumber_dokumen: lampiran.dokumen.sumber_dokumen,
        tanggal_upload: lampiran.dokumen.tanggal_upload.toISOString(),
        hash_file: lampiran.dokumen.hash_file,
      })),
    };
  }

  private async publishActivitySnapshot(activity: any, eventType: string) {
    return await this.multiChainService.publishJson(
      activity.id,
      this.buildBlockchainPayload(activity, eventType),
    );
  }

  private async notifyInvitedMembers(activityId: string, memberIds: string[]) {
    if (memberIds.length === 0) return;

    const activity = await this.activityRepository.findById(activityId);
    if (!activity) return;

    const inviterName = activity.dosen.nama;
    const invited = activity.partisipasi.filter((participant: any) =>
      memberIds.includes(participant.dosen_id),
    );

    await this.emailService.sendMany(
      invited.map((participant: any) => ({
        to: {
          nama: participant.dosen.nama,
          email: participant.dosen.user?.email,
        },
        subject: `Undangan anggota kegiatan tridharma: ${activity.nama_kegiatan}`,
        text: [
          `Halo ${participant.dosen.nama || 'Bapak/Ibu'},`,
          '',
          `${inviterName} menambahkan Anda sebagai anggota kegiatan tridharma "${activity.nama_kegiatan}".`,
          'Silakan masuk ke sistem untuk menerima atau menolak partisipasi.',
        ].join('\n'),
      })),
    );
  }

  isValidUUID(uuid: any): uuid is string {
    if (typeof uuid !== 'string') return false;
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return re.test(uuid);
  }

  mapKategoriTridharma(jenis: string): KategoriTridharma {
    switch (jenis?.toLowerCase()) {
      case 'pendidikan':
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

  async getAllActivities(dosenId: string) {
    const activities = await this.activityRepository.findAll(dosenId);
    return activities.map(act => {
      const participantCount = act.partisipasi.length;
      return {
        id: act.id,
        name: act.nama_kegiatan,
        jenisTridharma: act.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pendidikan' : act.kategori_tridharma.toLowerCase(),
        kategori: act.jenis_kegiatan,
        periode: act.periode,
        semester: act.semester.toLowerCase(),
        role: act.dosen_id === dosenId ? 'pencatat' : 'anggota',
        anggotaCount: participantCount,
        tanggalMulai: act.tanggal_mulai.toISOString(),
        tanggalSelesai: act.tanggal_selesai.toISOString(),
        buktiCount: act.lampiran_bukti.length,
        updatedAt: act.tanggal_mulai.toISOString(),
      };
    });
  }

  async getSummaryStats(dosenId: string) {
    const { activities, total_dokumen } = await this.activityRepository.findSummaryStats(dosenId);

    return {
      total: activities.length,
      pengajaran: activities.filter((a: any) => a.kategori_tridharma === KategoriTridharma.PENDIDIKAN).length,
      penelitian: activities.filter((a: any) => a.kategori_tridharma === KategoriTridharma.PENELITIAN).length,
      pengabdian: activities.filter((a: any) => a.kategori_tridharma === KategoriTridharma.PENGABDIAN).length,
      tugas_tambahan: activities.filter((a: any) => a.kategori_tridharma === KategoriTridharma.TUGAS_TAMBAHAN).length,
      tanpa_bukti: activities.filter((a: any) => a.lampiran_bukti.length === 0).length,
      total_dokumen
    };
  }

  async getTanpaBukti(dosenId: string) {
    const activities = await this.activityRepository.findTanpaBukti(dosenId);
    return activities.map(a => ({
      id: a.id,
      name: a.nama_kegiatan,
      type: a.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'Pendidikan' : a.kategori_tridharma,
      date: a.tanggal_mulai.toISOString()
    }));
  }

  async getActivityById(id: string, dosenId?: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    const dosenTerlibatMap = new Map<string, any>();
    dosenTerlibatMap.set(activity.dosen_id, {
      id: activity.dosen_id,
      name: activity.dosen.nama,
      nidn: activity.dosen.nip,
      isPencatat: true,
      isKetua: true,
      status: 'DITERIMA',
      isCurrentUser: activity.dosen_id === dosenId,
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
          status: p.status || 'MENUNGGU_KONFIRMASI',
          isCurrentUser: p.dosen_id === dosenId,
          dokumen: []
        });
      }
    });

    const isBuktiBersama = activity.jenis_bukti === 'BERSAMA';
    const dokumenBersama: any[] = [];

    activity.lampiran_bukti.forEach((lb: any) => {
      const firstKepemilikan = lb.dokumen.kepemilikan[0];
      const uploaderId = firstKepemilikan?.dosen_id;
      const uploaderMember = dosenTerlibatMap.get(uploaderId);
      const uploaderName = uploaderMember?.name || 'Unknown';

      if (isBuktiBersama) {
        const currentUserHasHighlight = lb.dokumen.kepemilikan
          .find((k: any) => k.dosen_id === dosenId)?.highlights?.length > 0;

        dokumenBersama.push({
          id: lb.dokumen.id,
          name: lb.dokumen.nama,
          jenis: lb.dokumen.jenis_dokumen,
          tanggalUpload: lb.dokumen.tanggal_upload.toISOString(),
          hasHighlight: currentUserHasHighlight,
          uploadedBy: { id: uploaderId, name: uploaderName },
          isUploader: dosenId === uploaderId,
          lampiranId: lb.id,
        });
      } else {
        lb.dokumen.kepemilikan.forEach((k: any) => {
          const ownerInActivity = dosenTerlibatMap.get(k.dosen_id);
          if (ownerInActivity) {
            ownerInActivity.dokumen.push({
              id: lb.dokumen.id,
              name: lb.dokumen.nama,
              jenis: lb.dokumen.jenis_dokumen,
              tanggalUpload: lb.dokumen.tanggal_upload.toISOString(),
              hasHighlight: k.highlights.length > 0,
              isOwner: true,
              uploadedBy: { id: uploaderId, name: uploaderName },
              lampiranId: lb.id,
            });
          }
        });
      }
    });

    const result: any = {
      id: activity.id,
      namaKegiatan: activity.nama_kegiatan,
      jenisTridharma: activity.kategori_tridharma.toLowerCase() === 'pendidikan' ? 'pendidikan' : activity.kategori_tridharma.toLowerCase(),
      kategori: activity.jenis_kegiatan,
      tanggalMulai: activity.tanggal_mulai.toISOString(),
      tanggalSelesai: activity.tanggal_selesai.toISOString(),
      tahunAkademik: activity.periode,
      semester: activity.semester.toLowerCase(),
      programStudi: activity.dosen.program_studi?.nama_prodi || "Umum",
      dosenTerlibat: Array.from(dosenTerlibatMap.values()),
      statusKelengkapan: activity.lampiran_bukti.length > 0 ? 'lengkap' : 'tidak_lengkap',
      jenisBukti: activity.jenis_bukti || 'MASING_MASING',
      currentUserId: dosenId,
      isCurrentUserPencatat: activity.dosen_id === dosenId,
    };

    if (isBuktiBersama) {
      result.dokumenBersama = dokumenBersama;
    }

    return result;
  }

  async getAuditTrail(id: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    const items = await this.multiChainService.getJsonStreamItems(id);

    return items.map((item) => {
      const payload = item.data.json || {};
      const pencatat = payload.pencatat as { nama?: string } | undefined;
      const kegiatan = payload.kegiatan as { nama_kegiatan?: string } | undefined;
      const documents = Array.isArray(payload.dokumen_pendukung)
        ? payload.dokumen_pendukung
        : [];

      return {
        id: item.txid,
        txId: item.txid,
        action: String(payload.event_type || 'KEGIATAN_RECORDED'),
        actor: pencatat?.nama || item.publishers[0] || 'Unknown',
        publisher: item.publishers[0] || null,
        timestamp: String(
          payload.recorded_at ||
          new Date((item.blocktime || item.time || 0) * 1000).toISOString(),
        ),
        details: kegiatan?.nama_kegiatan || activity.nama_kegiatan,
        documentCount: documents.length,
        confirmations: item.confirmations,
        blockHeight: item.blockheight ?? null,
        payload,
      };
    });
  }

  async createActivity(dosenId: string, data: any) {
    const {
      namaKegiatan, jenisTridharma, kategori, tanggalMulai,
      tanggalSelesai, tahunAkademik, semester, anggota_ids, lampiran_ids,
      jenisBukti
    } = data;

    const activityData: any = {
      dosen_id: dosenId,
      nama_kegiatan: String(namaKegiatan),
      kategori_tridharma: this.mapKategoriTridharma(String(jenisTridharma)),
      jenis_kegiatan: this.mapJenisKegiatan(String(kategori)),
      tanggal_mulai: new Date(String(tanggalMulai)),
      tanggal_selesai: new Date(String(tanggalSelesai)),
      periode: String(tahunAkademik),
      semester: String(semester).toUpperCase(),
      tx_id: 'PENDING_BLOCKCHAIN',
    };

    if (jenisBukti) activityData.jenis_bukti = jenisBukti;

    const partisipasiData: any[] = [];
    const filteredAnggotaIds = (anggota_ids && Array.isArray(anggota_ids))
      ? anggota_ids.filter((id: string) => id !== dosenId)
      : [];
    filteredAnggotaIds.forEach((id: string) => {
      partisipasiData.push({ dosen_id: id, peran: PeranTridharma.ANGGOTA, status: 'MENUNGGU_KONFIRMASI' });
    });

    if (!partisipasiData.some(p => p.dosen_id === dosenId)) {
      partisipasiData.push({ dosen_id: dosenId, peran: PeranTridharma.KETUA, status: 'DITERIMA' });
    }

    // Validate that documents are not bound to other activities
    if (lampiran_ids && Array.isArray(lampiran_ids) && lampiran_ids.length > 0) {
      const bound = await prisma.lampiranBukti.findFirst({
        where: {
          dokumen_id: { in: lampiran_ids }
        },
        include: {
          dokumen: true
        }
      });
      if (bound) {
        throw new Error(`Dokumen "${bound.dokumen.nama}" sudah terikat dengan kegiatan lain.`);
      }
    }

    const lampiranData = (lampiran_ids && Array.isArray(lampiran_ids))
      ? lampiran_ids.map((docId: string) => ({ dokumen_id: docId }))
      : [];

    const createdActivity = await this.activityRepository.create(activityData, partisipasiData, lampiranData);

    let txId: string;

    try {
      const activity = await this.activityRepository.findById(createdActivity.id);
      if (!activity) {
        throw new Error('Kegiatan gagal dimuat setelah dibuat.');
      }
      txId = await this.publishActivitySnapshot(activity, 'KEGIATAN_CREATED');
    } catch (error) {
      await this.activityRepository.delete(createdActivity.id);
      throw error;
    }

    const result = await this.activityRepository.updateTransactionId(createdActivity.id, txId);
    await this.notifyInvitedMembers(createdActivity.id, filteredAnggotaIds);
    return result;
  }

  async updateActivity(id: string, dosenId: string, data: any) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    const isCreator = activity.dosen_id === dosenId;
    const isDiterimaMember = activity.partisipasi.some(
      p => p.dosen_id === dosenId && p.status === 'DITERIMA'
    );
    if (!isCreator && !isDiterimaMember) throw new Error('Akses ditolak. Anda bukan anggota kegiatan ini.');

    const {
      namaKegiatan, jenisTridharma, kategori,
      tanggalMulai, tanggalSelesai, tahunAkademik, semester,
      anggota_ids, lampiran_ids, deleted_lampiran_ids,
      jenisBukti
    } = data;

    const updateData: any = {};
    if (namaKegiatan) updateData.nama_kegiatan = String(namaKegiatan);
    if (jenisTridharma) updateData.kategori_tridharma = this.mapKategoriTridharma(String(jenisTridharma));
    if (kategori) updateData.jenis_kegiatan = this.mapJenisKegiatan(String(kategori));
    if (tanggalMulai) updateData.tanggal_mulai = new Date(String(tanggalMulai));
    if (tanggalSelesai) updateData.tanggal_selesai = new Date(String(tanggalSelesai));
    if (tahunAkademik) updateData.periode = String(tahunAkademik);
    if (semester) updateData.semester = String(semester).toUpperCase();
    if (jenisBukti) updateData.jenis_bukti = jenisBukti;

    await this.activityRepository.update(id, updateData);

    let newlyAddedMemberIds: string[] = [];
    if (anggota_ids && Array.isArray(anggota_ids)) {
      const existingParticipations = activity.partisipasi;
      const existingIds = existingParticipations.map(p => p.dosen_id);
      const newIds = anggota_ids
        .filter((aid: string) => !existingIds.includes(aid))
        .filter((aid: string) => aid !== dosenId);
      newlyAddedMemberIds = newIds;

      for (const newId of newIds) {
        await this.activityRepository.createParticipation({
          dosen_id: newId,
          kegiatan_tridharma_id: id,
          peran: 'ANGGOTA',
          status: 'MENUNGGU_KONFIRMASI',
        });
      }
    }

    // Hapus lampiran yang di-defer dari frontend (fix cancel button)
    if (deleted_lampiran_ids && Array.isArray(deleted_lampiran_ids)) {
      // Re-fetch agar activity.lampiran_bukti fresh setelah update metadata
      const freshActivity = await this.activityRepository.findById(id);
      if (freshActivity) {
        for (const lampiranId of deleted_lampiran_ids) {
          if (typeof lampiranId !== 'string') continue;

          const lampiran = freshActivity.lampiran_bukti.find((lb: any) => lb.id === lampiranId);
          if (!lampiran) continue; // sudah tidak ada, skip

          // Validasi: hanya uploader yang boleh hapus
          const isUploader = lampiran.dokumen.kepemilikan.some(
            (k: any) => k.dosen_id === dosenId
          );
          if (!isUploader) continue; // bukan uploader, skip

          await this.activityRepository.deleteLampiran(lampiranId);
        }
      }
    }

    if (lampiran_ids && Array.isArray(lampiran_ids)) {
      const existingDocIds = activity.lampiran_bukti.map((l: any) => l.dokumen_id);

      const toAdd = lampiran_ids.filter(
        (docId: string) => !existingDocIds.includes(docId)
      );

      if (toAdd.length > 0) {
        const bound = await prisma.lampiranBukti.findFirst({
          where: {
            dokumen_id: { in: toAdd }
          },
          include: {
            dokumen: true
          }
        });
        if (bound) {
          throw new Error(`Dokumen "${bound.dokumen.nama}" sudah terikat dengan kegiatan lain.`);
        }
      }

      for (const docId of toAdd) {
        await this.activityRepository.createLampiran({
          kegiatan_id: id,
          dokumen_id: docId,
        });
      }
    }

    let txId: string;
    try {
      const updatedActivity = await this.activityRepository.findById(id);
      if (!updatedActivity) throw new Error('Kegiatan gagal dimuat setelah diperbarui.');
      txId = await this.publishActivitySnapshot(updatedActivity, 'KEGIATAN_UPDATED');
    } catch (error) {
      await this.activityRepository.update(id, {
        nama_kegiatan: activity.nama_kegiatan,
        kategori_tridharma: activity.kategori_tridharma,
        jenis_kegiatan: activity.jenis_kegiatan,
        tanggal_mulai: activity.tanggal_mulai,
        tanggal_selesai: activity.tanggal_selesai,
        periode: activity.periode,
        semester: activity.semester,
        tx_id: activity.tx_id,
      });
      throw error;
    }

    const result = await this.activityRepository.updateTransactionId(id, txId);
    await this.notifyInvitedMembers(id, newlyAddedMemberIds);
    return result;
  }

  async deleteActivity(id: string, dosenId: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    if (activity.dosen_id !== dosenId) throw new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.');

    return await this.activityRepository.delete(id);
  }

  async addLampiran(id: string, dokumen_id: string, dosenId: string) {
    if (!this.isValidUUID(id) || !this.isValidUUID(dokumen_id)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    const isCreator = activity.dosen_id === dosenId;
    const isDiterimaMember = activity.partisipasi.some(
      p => p.dosen_id === dosenId && p.status === 'DITERIMA'
    );
    if (!isCreator && !isDiterimaMember) {
      throw new Error('Akses ditolak. Anda bukan anggota aktif kegiatan ini.');
    }

    const lampiran = await this.activityRepository.createLampiran({
      kegiatan_id: id,
      dokumen_id: String(dokumen_id)
    });

    if (activity.jenis_bukti === 'BERSAMA') {
      const memberIds = await this.activityRepository.getDiterimaMemberIds(id);
      for (const memberId of memberIds) {
        await this.activityRepository.createKepemilikanIfNotExists(memberId, [dokumen_id]);
      }
    }

    let txId: string;
    try {
      const updatedActivity = await this.activityRepository.findById(id);
      if (!updatedActivity) throw new Error('Kegiatan gagal dimuat setelah dokumen ditambahkan.');
      txId = await this.publishActivitySnapshot(updatedActivity, 'DOKUMEN_ADDED');
    } catch (error) {
      await this.activityRepository.deleteLampiran(lampiran.id);
      throw error;
    }

    await this.activityRepository.updateTransactionId(id, txId);
    return lampiran;
  }

  async deleteLampiran(kegiatanId: string, lampiranId: string, dosenId: string) {
    if (!this.isValidUUID(kegiatanId) || !this.isValidUUID(lampiranId)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(kegiatanId);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');

    const lampiran = activity.lampiran_bukti.find((lb: any) => lb.id === lampiranId);
    if (!lampiran) throw new Error('Lampiran tidak ditemukan.');

    const isUploader = lampiran.dokumen.kepemilikan.some((k: any) => k.dosen_id === dosenId);
    if (!isUploader) throw new Error('Akses ditolak. Hanya uploader yang dapat menghapus dokumen.');

    await this.activityRepository.deleteLampiran(lampiranId);

    let txId: string;
    try {
      const updatedActivity = await this.activityRepository.findById(kegiatanId);
      if (updatedActivity) {
        txId = await this.publishActivitySnapshot(updatedActivity, 'DOKUMEN_REMOVED');
        await this.activityRepository.updateTransactionId(kegiatanId, txId);
      }
    } catch {
      // ignore blockchain errors on delete
    }
  }

  async getPendingConfirmations(dosenId: string) {
    const pending = await this.activityRepository.findPendingConfirmations(dosenId);
    return pending.map(p => ({
      id: p.id,
      kegiatanId: p.kegiatan_tridharma_id,
      namaKegiatan: p.kegiatan_tridharma.nama_kegiatan,
      pengundang: p.kegiatan_tridharma.dosen.nama,
      status: p.status,
    }));
  }

  async acceptParticipation(partisipasiId: string, dosenId: string) {
    if (!this.isValidUUID(partisipasiId)) throw new Error('Format ID tidak valid.');

    const partisipasi = await this.activityRepository.findParticipationById(partisipasiId);
    if (!partisipasi) throw new Error('Partisipasi tidak ditemukan.');
    if (partisipasi.dosen_id !== dosenId) throw new Error('Akses ditolak. Partisipasi bukan milik Anda.');

    const updated = await this.activityRepository.updateParticipationStatus(partisipasiId, 'DITERIMA');

    const activity = await this.activityRepository.findById(partisipasi.kegiatan_tridharma_id);
    if (activity && activity.jenis_bukti === 'BERSAMA') {
      const docIds = await this.activityRepository.getActivityDocumentIds(activity.id);
      if (docIds.length > 0) {
        await this.activityRepository.createKepemilikanIfNotExists(dosenId, docIds);
      }
    }

    await this.emailService.notifyActivityDecision(
      {
        nama: partisipasi.kegiatan_tridharma.dosen.nama,
        email: partisipasi.kegiatan_tridharma.dosen.user?.email,
      },
      partisipasi.kegiatan_tridharma.nama_kegiatan,
      partisipasi.dosen.nama,
      'DITERIMA',
    );

    return updated;
  }

  async rejectParticipation(partisipasiId: string, dosenId: string) {
    if (!this.isValidUUID(partisipasiId)) throw new Error('Format ID tidak valid.');

    const partisipasi = await this.activityRepository.findParticipationById(partisipasiId);
    if (!partisipasi) throw new Error('Partisipasi tidak ditemukan.');
    if (partisipasi.dosen_id !== dosenId) throw new Error('Akses ditolak. Partisipasi bukan milik Anda.');

    const updated = await this.activityRepository.updateParticipationStatus(partisipasiId, 'DITOLAK');
    await this.emailService.notifyActivityDecision(
      {
        nama: partisipasi.kegiatan_tridharma.dosen.nama,
        email: partisipasi.kegiatan_tridharma.dosen.user?.email,
      },
      partisipasi.kegiatan_tridharma.nama_kegiatan,
      partisipasi.dosen.nama,
      'DITOLAK',
    );
    return updated;
  }

  async addMember(kegiatanId: string, dosenId: string, anggotaId: string) {
    if (!this.isValidUUID(kegiatanId) || !this.isValidUUID(anggotaId)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(kegiatanId);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    if (activity.dosen_id !== dosenId) throw new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.');

    const existing = activity.partisipasi.find(p => p.dosen_id === anggotaId);
    if (existing) throw new Error('Dosen sudah terdaftar sebagai anggota.');

    const participation = await this.activityRepository.createParticipation({
      dosen_id: anggotaId,
      kegiatan_tridharma_id: kegiatanId,
      peran: 'ANGGOTA',
      status: 'MENUNGGU_KONFIRMASI',
    });
    await this.notifyInvitedMembers(kegiatanId, [anggotaId]);
    return participation;
  }

  async removeMember(kegiatanId: string, dosenId: string, anggotaId: string) {
    if (!this.isValidUUID(kegiatanId) || !this.isValidUUID(anggotaId)) throw new Error('Format ID tidak valid.');

    const activity = await this.activityRepository.findById(kegiatanId);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    if (activity.dosen_id !== dosenId) throw new Error('Akses ditolak. Anda bukan pencatat kegiatan ini.');
    if (activity.dosen_id === anggotaId) throw new Error('Tidak dapat menghapus pembuat kegiatan.');

    return await this.activityRepository.deleteParticipation(anggotaId, kegiatanId);
  }

  // Public methods (no authentication required)
  async getPublicActivities() {
    return await this.activityRepository.findAllPublic();
  }

  async getPublicActivityById(id: string) {
    if (!this.isValidUUID(id)) throw new Error('Format ID tidak valid.');
    
    const activity = await this.activityRepository.findByIdPublic(id);
    if (!activity) throw new Error('Kegiatan tidak ditemukan.');
    
    return activity;
  }
}
