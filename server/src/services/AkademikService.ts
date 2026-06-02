import { AkademikRepository } from '../repositories/AkademikRepository';

export class AkademikService {
  private akademikRepository: AkademikRepository;

  constructor(akademikRepository: AkademikRepository) {
    this.akademikRepository = akademikRepository;
  }

  // Jurusan
  async getAllJurusan() {
    return await this.akademikRepository.findAllJurusan();
  }

  async getJurusanById(id: string) {
    const data = await this.akademikRepository.findJurusanById(id);
    if (!data) throw new Error('Jurusan tidak ditemukan.');
    return data;
  }

  async createJurusan(data: any) {
    const { kode_jurusan, nama_jurusan } = data;
    if (!kode_jurusan || !nama_jurusan) {
      throw new Error('kode_jurusan dan nama_jurusan wajib diisi.');
    }

    const existing = await this.akademikRepository.findJurusanByKode(kode_jurusan);
    if (existing) throw new Error('Kode jurusan sudah digunakan.');

    return await this.akademikRepository.createJurusan({ kode_jurusan, nama_jurusan });
  }

  async updateJurusan(id: string, data: any) {
    const { kode_jurusan, nama_jurusan } = data;
    const existing = await this.akademikRepository.findJurusanById(id);
    if (!existing) throw new Error('Jurusan tidak ditemukan.');

    if (kode_jurusan && kode_jurusan !== existing.kode_jurusan) {
      const taken = await this.akademikRepository.findJurusanByKode(kode_jurusan);
      if (taken) throw new Error('Kode jurusan sudah digunakan.');
    }

    return await this.akademikRepository.updateJurusan(id, {
      ...(kode_jurusan && { kode_jurusan }),
      ...(nama_jurusan && { nama_jurusan }),
    });
  }

  async deleteJurusan(id: string) {
    const existing = await this.akademikRepository.findJurusanById(id);
    if (!existing) throw new Error('Jurusan tidak ditemukan.');

    if ((existing as any).program_studi.length > 0) {
      throw new Error(`Jurusan tidak bisa dihapus karena masih memiliki ${(existing as any).program_studi.length} program studi.`);
    }

    await this.akademikRepository.deleteJurusan(id);
    return existing;
  }

  // Prodi
  async getAllProdi(jurusan_id?: string) {
    const where = jurusan_id ? { jurusan_id: String(jurusan_id) } : undefined;
    return await this.akademikRepository.findAllProdi(where);
  }

  async getProdiById(id: string) {
    const data = await this.akademikRepository.findProdiById(id);
    if (!data) throw new Error('Program studi tidak ditemukan.');
    return data;
  }

  async createProdi(data: any) {
    const { kode_prodi, nama_prodi, jurusan_id } = data;
    if (!kode_prodi || !nama_prodi || !jurusan_id) {
      throw new Error('kode_prodi, nama_prodi, dan jurusan_id wajib diisi.');
    }

    const jurusan = await this.akademikRepository.findJurusanById(jurusan_id);
    if (!jurusan) throw new Error('Jurusan tidak ditemukan.');

    const existing = await this.akademikRepository.findProdiByKode(kode_prodi);
    if (existing) throw new Error('Kode program studi sudah digunakan.');

    return await this.akademikRepository.createProdi({ kode_prodi, nama_prodi, jurusan_id });
  }

  async updateProdi(id: string, data: any) {
    const { kode_prodi, nama_prodi, jurusan_id } = data;
    const existing = await this.akademikRepository.findProdiById(id);
    if (!existing) throw new Error('Program studi tidak ditemukan.');

    if (kode_prodi && kode_prodi !== existing.kode_prodi) {
      const taken = await this.akademikRepository.findProdiByKode(kode_prodi);
      if (taken) throw new Error('Kode program studi sudah digunakan.');
    }

    if (jurusan_id) {
      const jurusan = await this.akademikRepository.findJurusanById(jurusan_id);
      if (!jurusan) throw new Error('Jurusan tidak ditemukan.');
    }

    return await this.akademikRepository.updateProdi(id, {
      ...(kode_prodi && { kode_prodi }),
      ...(nama_prodi && { nama_prodi }),
      ...(jurusan_id && { jurusan_id }),
    });
  }

  async deleteProdi(id: string) {
    const existing = await this.akademikRepository.findProdiById(id);
    if (!existing) throw new Error('Program studi tidak ditemukan.');

    if ((existing as any).dosen.length > 0) {
      throw new Error(`Program studi tidak bisa dihapus karena masih memiliki ${(existing as any).dosen.length} dosen terdaftar.`);
    }

    await this.akademikRepository.deleteProdi(id);
    return existing;
  }
}
