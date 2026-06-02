// server/src/domain/Kaprodi.ts
import { Dosen } from './Dosen';
import { KegiatanTridharma } from './KegiatanTridharma';
import { PageResponse, KegiatanFilter, PageRequest } from './types';

export class Kaprodi {
  private periodeMulai: Date;
  private periodeSelesai: Date;

  constructor(periodeMulai: Date, periodeSelesai: Date) {
    this.periodeMulai = periodeMulai;
    this.periodeSelesai = periodeSelesai;
  }

  public isActive(): boolean {
    const now = new Date();
    return now >= this.periodeMulai && now <= this.periodeSelesai;
  }

  public getDaftarKegiatanTridharmaProdi(
    filter: KegiatanFilter,
    pageRequest: PageRequest
  ): PageResponse<KegiatanTridharma> {
    // Implementation
    return { data: [], page: 0, totalPages: 0, totalElements: 0 };
  }
}
