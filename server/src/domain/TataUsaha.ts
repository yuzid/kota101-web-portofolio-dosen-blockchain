// server/src/domain/TataUsaha.ts
import { User } from './User';
import { Dosen } from './Dosen';
import { Dokumen } from './Dokumen';

export class TataUsaha extends User {
  private nip: string;
  private nama: string;
  private id: string;
  private jurusan_id: string | null;

  constructor(
    id: string,
    email: string,
    passwordHash: string,
    nip: string,
    nama: string,
    jurusan_id: string | null = null
  ) {
    super(email, passwordHash);
    this.id = id;
    this.nip = nip;
    this.nama = nama;
    this.jurusan_id = jurusan_id;
  }

  public distribusiDokumen(daftarDosen: Dosen[], dokumen: Dokumen): void {
    // Logic encapsulated here: ensure document is assigned to each dosen
    // In a real implementation, this might emit events or be used to validate distribution
    console.log(`TU ${this.nama} mendistribusikan dokumen ke ${daftarDosen.length} dosen.`);
  }

  public getJurusanId(): string | null { return this.jurusan_id; }
  public getId(): string { return this.id; }
}
