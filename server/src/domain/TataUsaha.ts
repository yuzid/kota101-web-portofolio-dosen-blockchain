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
    if (daftarDosen.length === 0) {
      throw new Error('Daftar dosen penerima tidak boleh kosong.');
    }
    // Logic: Record the distribution event
    this.logEvent(`TU ${this.nama} mendistribusikan dokumen: ${dokumen.getNama()}`);
  }

  private logEvent(message: string): void {
    console.log(`[AUDIT] ${new Date().toISOString()}: ${message}`);
  }
  

  public getJurusanId(): string | null { return this.jurusan_id; }
  public getId(): string { return this.id; }
}
