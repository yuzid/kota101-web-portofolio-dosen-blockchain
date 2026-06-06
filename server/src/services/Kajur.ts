import { ActivityRepository } from '../repositories/ActivityRepository';
import { KegiatanFilter, PageRequest, PageResponse } from '../types/activity';
import { KegiatanTridharma } from '@prisma/client';

export class Kajur {
  private activityRepository: ActivityRepository;
  private jurusanId: string;

  constructor(activityRepository: ActivityRepository, jurusanId: string) {
    this.activityRepository = activityRepository;
    this.jurusanId = jurusanId;
  }

  async getDaftarKegiatanTridharmaJurusan(filter: KegiatanFilter, pageRequest: PageRequest): Promise<PageResponse<KegiatanTridharma>> {
    return await this.activityRepository.findByJurusan(this.jurusanId, filter, pageRequest);
  }
}
