// server/src/domain/TataUsaha.ts
import { User } from './User';
import { Dosen } from './Dosen';
import { Dokumen } from './Dokumen';

export class TataUsaha extends User {
  private nip: string;
  private nama: string;

  constructor(
    email: string,
    passwordHash: string,
    nip: string,
    nama: string
  ) {
    super(email, passwordHash);
    this.nip = nip;
    this.nama = nama;
  }

  public distribusiDokumen(daftarDosen: Dosen[], dokumen: Dokumen): void {
    // Logic for distributing documents
  }
}
