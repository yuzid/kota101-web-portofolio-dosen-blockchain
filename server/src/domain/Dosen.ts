// server/src/domain/Dosen.ts
import { User } from './User';
import { Dokumen } from './Dokumen';
import { KegiatanTridharma } from './KegiatanTridharma';
import { PageResponse, KegiatanFilter, PageRequest } from './types';

export class Dosen extends User {
  private nip: string;
  private nidn: string;
  private nama: string;

  constructor(
    email: string,
    passwordHash: string,
    nip: string,
    nidn: string,
    nama: string
  ) {
    super(email, passwordHash);
    this.nip = nip;
    this.nidn = nidn;
    this.nama = nama;
  }

  public getDaftarKegiatanTridharma(
    filter: KegiatanFilter,
    pageRequest: PageRequest
  ): PageResponse<KegiatanTridharma> {
    // Implementation placeholder
    return { data: [], page: 0, totalPages: 0, totalElements: 0 };
  }

  public getDaftarDokumen(pageRequest: PageRequest): PageResponse<Dokumen> {
    // Implementation placeholder
    return { data: [], page: 0, totalPages: 0, totalElements: 0 };
  }

  public isiKegiatan(kegiatan: KegiatanTridharma): void {
    // Implementation
  }

  public isActiveKaprodi(): boolean {
    // Check if active kaprodi
    return false;
  }

  public isActiveKajur(): boolean {
    // Check if active kajur
    return false;
  }

  public hapusDariKegiatan(kegiatan: KegiatanTridharma): void {
    // Implementation
  }

  public hapusDokumen(dokumen: Dokumen): void {
    // Implementation
  }
}
