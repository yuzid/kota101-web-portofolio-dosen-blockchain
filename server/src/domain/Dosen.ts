// server/src/domain/Dosen.ts
import { User } from './User';
import { Dokumen } from './Dokumen';
import { KegiatanTridharma } from './KegiatanTridharma';
import { PageResponse, KegiatanFilter, PageRequest } from './types';

export class Dosen extends User {
  private nip: string;
  private nidn: string;
  private nama: string;
  private id: string; // Internal ID

  constructor(
    id: string,
    email: string,
    passwordHash: string,
    nip: string,
    nidn: string,
    nama: string
  ) {
    super(email, passwordHash);
    this.id = id;
    this.nip = nip;
    this.nidn = nidn;
    this.nama = nama;
  }

  public getDaftarKegiatanTridharma(
    filter: KegiatanFilter,
    pageRequest: PageRequest
  ): PageResponse<KegiatanTridharma> {
    // Logic orchestrated by Service/Repository
    return { data: [], page: pageRequest.page, totalPages: 0, totalElements: 0 };
  }

  public getDaftarDokumen(pageRequest: PageRequest): PageResponse<Dokumen> {
    return { data: [], page: pageRequest.page, totalPages: 0, totalElements: 0 };
  }

  public isiKegiatan(kegiatan: KegiatanTridharma): void {
    // Logic to record activity
    kegiatan.catatAuditTrail();
  }

  public isActiveKaprodi(): boolean {
    // This state should be managed by the repository/service 
    // but exposed through the domain model
    return false; 
  }

  public isActiveKajur(): boolean {
    return false;
  }

  public hapusDariKegiatan(kegiatan: KegiatanTridharma): void {
    // Logic to remove self from activity
  }

  public hapusDokumen(dokumen: Dokumen): void {
    // Logic for soft delete
  }

  // Getters for internal use
  public getId(): string { return this.id; }
  public getNama(): string { return this.nama; }
  public getNip(): string { return this.nip; }
}
