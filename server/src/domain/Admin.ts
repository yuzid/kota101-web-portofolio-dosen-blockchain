// server/src/domain/Admin.ts
import { User } from './User';
import { Dosen } from './Dosen';

export class Admin extends User {
  constructor(email: string, passwordHash: string) {
    super(email, passwordHash);
  }

  public assignKaprodi(dosen: Dosen): void {
    // Logic to assign kaprodi
    console.log(`Admin assigning Kaprodi: ${dosen.getNama()}`);
  }

  public assignKajur(dosen: Dosen): void {
    // Logic to assign kajur
    console.log(`Admin assigning Kajur: ${dosen.getNama()}`);
  }

  public tambahPengguna(pengguna: User): void {
    // Logic to add user
    console.log(`Admin adding user: ${pengguna.getEmail()}`);
  }
}
