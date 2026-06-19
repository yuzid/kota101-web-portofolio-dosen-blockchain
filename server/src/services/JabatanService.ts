import { JabatanRepository } from '../repositories/JabatanRepository';

export class JabatanService {
  private jabatanRepository: JabatanRepository;

  constructor(jabatanRepository: JabatanRepository) {
    this.jabatanRepository = jabatanRepository;
  }

  // Kajur Methods
  async getAllKajur(query: any) {
    const { jurusan_id, dosen_id } = query;
    const where = {
      ...(jurusan_id && { jurusan_id: String(jurusan_id) }),
      ...(dosen_id && { dosen_id: String(dosen_id) }),
    };
    return await this.jabatanRepository.findAllKajur(where);
  }

  async createKajur(data: any) {
    const { dosen_id, jurusan_id, periode_mulai, periode_selesai } = data;
    if (!dosen_id || !jurusan_id || !periode_mulai || !periode_selesai) {
      throw new Error('Semua field wajib diisi.');
    }

    const mulai = new Date(periode_mulai);
    const selesai = new Date(periode_selesai);
    if (mulai >= selesai) {
      throw new Error('periode_mulai harus sebelum periode_selesai.');
    }

    const dosen = await this.jabatanRepository.findDosenById(dosen_id);
    if (!dosen) throw new Error('Dosen tidak ditemukan.');

    const overlap = await this.jabatanRepository.findOverlapKajur(jurusan_id, mulai, selesai);
    if (overlap) throw new Error('Jurusan ini sudah memiliki Kajur aktif pada periode tersebut.');

    return await this.jabatanRepository.createKajur({
      dosen_id, jurusan_id, periode_mulai: mulai, periode_selesai: selesai
    });
  }

  async updateKajur(id: string, data: any) {
    const { periode_mulai, periode_selesai, dosen_id, jurusan_id } = data;
    const existing = await this.jabatanRepository.findKajurById(id);
    if (!existing) throw new Error('Jabatan tidak ditemukan.');

    if (dosen_id && dosen_id !== existing.dosen_id) {
      const dosen = await this.jabatanRepository.findDosenById(dosen_id);
      if (!dosen) throw new Error('Dosen tidak ditemukan.');
    }

    const targetJurusanId = jurusan_id || existing.jurusan_id;
    const mulai = periode_mulai ? new Date(periode_mulai) : existing.periode_mulai;
    const selesai = periode_selesai ? new Date(periode_selesai) : existing.periode_selesai;

    if (mulai >= selesai) {
      throw new Error('periode_mulai harus sebelum periode_selesai.');
    }

    const overlap = await this.jabatanRepository.findOverlapKajur(targetJurusanId, mulai, selesai, id);
    if (overlap) throw new Error('Jurusan ini sudah memiliki Kajur aktif pada periode tersebut.');

    return await this.jabatanRepository.updateKajur(id, {
      ...(dosen_id && { dosen_id }),
      ...(jurusan_id && { jurusan_id }),
      periode_mulai: mulai,
      periode_selesai: selesai,
    });
  }

  async deleteKajur(id: string) {
    const existing = await this.jabatanRepository.findKajurById(id);
    if (!existing) throw new Error('Jabatan tidak ditemukan.');
    await this.jabatanRepository.deleteKajur(id);
  }

  // Kaprodi Methods
  async getAllKaprodi(query: any) {
    const { program_studi_id, dosen_id } = query;
    const where = {
      ...(program_studi_id && { program_studi_id: String(program_studi_id) }),
      ...(dosen_id && { dosen_id: String(dosen_id) }),
    };
    return await this.jabatanRepository.findAllKaprodi(where);
  }

  async createKaprodi(data: any) {
    const { dosen_id, program_studi_id, periode_mulai, periode_selesai } = data;
    if (!dosen_id || !program_studi_id || !periode_mulai || !periode_selesai) {
      throw new Error('Semua field wajib diisi.');
    }

    const mulai = new Date(periode_mulai);
    const selesai = new Date(periode_selesai);
    if (mulai >= selesai) {
      throw new Error('periode_mulai harus sebelum periode_selesai.');
    }

    const dosen = await this.jabatanRepository.findDosenById(dosen_id);
    if (!dosen) throw new Error('Dosen tidak ditemukan.');

    const overlap = await this.jabatanRepository.findOverlapKaprodi(program_studi_id, mulai, selesai);
    if (overlap) throw new Error('Program studi ini sudah memiliki Kaprodi aktif pada periode tersebut.');

    return await this.jabatanRepository.createKaprodi({
      dosen_id, program_studi_id, periode_mulai: mulai, periode_selesai: selesai
    });
  }

  async updateKaprodi(id: string, data: any) {
    const { periode_mulai, periode_selesai, dosen_id, program_studi_id } = data;
    const existing = await this.jabatanRepository.findKaprodiById(id);
    if (!existing) throw new Error('Jabatan tidak ditemukan.');

    if (dosen_id && dosen_id !== existing.dosen_id) {
      const dosen = await this.jabatanRepository.findDosenById(dosen_id);
      if (!dosen) throw new Error('Dosen tidak ditemukan.');
    }

    const targetProdiId = program_studi_id || existing.program_studi_id;
    const mulai = periode_mulai ? new Date(periode_mulai) : existing.periode_mulai;
    const selesai = periode_selesai ? new Date(periode_selesai) : existing.periode_selesai;

    if (mulai >= selesai) {
      throw new Error('periode_mulai harus sebelum periode_selesai.');
    }

    const overlap = await this.jabatanRepository.findOverlapKaprodi(targetProdiId, mulai, selesai, id);
    if (overlap) throw new Error('Program studi ini sudah memiliki Kaprodi aktif pada periode tersebut.');

    return await this.jabatanRepository.updateKaprodi(id, {
      ...(dosen_id && { dosen_id }),
      ...(program_studi_id && { program_studi_id }),
      periode_mulai: mulai,
      periode_selesai: selesai,
    });
  }

  async deleteKaprodi(id: string) {
    const existing = await this.jabatanRepository.findKaprodiById(id);
    if (!existing) throw new Error('Jabatan tidak ditemukan.');
    await this.jabatanRepository.deleteKaprodi(id);
  }
}
