// server/src/domain/User.ts
export abstract class User {
  private email: string;
  private passwordHash: string;

  constructor(email: string, passwordHash: string) {
    this.email = email;
    this.passwordHash = passwordHash;
  }

  public login(password: string): boolean {
    // Logic will be implemented in AuthService/Security layer
    // This is just a placeholder as per diagram
    return true;
  }

  public logout(): void {
    // Logic for logout
  }
}
