// server/src/domain/Admin.ts
import { User } from './User';
import { Dosen } from './Dosen';

export class Admin extends User {
  constructor(email: string, passwordHash: string) {
    super(email, passwordHash);
  }

  public assignKaprodi(dosen: Dosen): void {
    // Logic to assign kaprodi
  }

  public assignKajur(dosen: Dosen): void {
    // Logic to assign kajur
  }

  public tambahPengguna(pengguna: User): void {
    // Logic to add user
  }
}
