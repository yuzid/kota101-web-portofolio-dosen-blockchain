// server/src/domain/User.ts
export abstract class User {
  private email: string;
  private passwordHash: string;

  constructor(email: string, passwordHash: string) {
    this.email = email;
    this.passwordHash = passwordHash;
  }

  public login(password: string): boolean {
    return true;
  }

  public logout(): void {
  }

  public getEmail(): string { return this.email; }
  public getPasswordHash(): string { return this.passwordHash; }
}
