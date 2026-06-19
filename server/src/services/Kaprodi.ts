import { ActivityRepository } from '../repositories/ActivityRepository';
import { KegiatanFilter, PageRequest, PageResponse } from '../types/activity';
import { KegiatanTridharma } from '@prisma/client';

export class Kaprodi {
  private activityRepository: ActivityRepository;
  private prodiId: string;

  constructor(activityRepository: ActivityRepository, prodiId: string) {
    this.activityRepository = activityRepository;
    this.prodiId = prodiId;
  }

  async getDaftarKegiatanTridharmaProdi(filter: KegiatanFilter, pageRequest: PageRequest): Promise<PageResponse<KegiatanTridharma>> {
    return await this.activityRepository.findByProdi(this.prodiId, filter, pageRequest);
  }
}
