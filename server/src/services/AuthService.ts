import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserRepository } from '../repositories/UserRepository';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async login(email: string, password_hash: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password_hash, user.password_hash);
    if (!isValid) return null;

    return this.generateAuthData(user);
  }

  async googleLogin(idToken: string) {
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new Error('Token Google tidak valid atau kedaluwarsa.');
    }

    if (!payload || !payload.email) {
      throw new Error('Gagal mendapatkan informasi email dari Google.');
    }

    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      throw new Error('Email Google Anda belum terdaftar di sistem. Silakan hubungi admin.');
    }

    return this.generateAuthData(user);
  }

  private generateAuthData(user: any) {
    const profile = this.extractProfileData(user);
    const jabatanAktif = this.getJabatanAktif(user);

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: profile.nama,
        programStudi: profile.programStudi,
        jurusan_id: user.role === 'TATA_USAHA' ? user.tata_usaha?.jurusan_id : null,
        jabatan: jabatanAktif
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    return { 
      token, 
      role: user.role, 
      email: user.email,
      name: profile.nama,
      programStudi: profile.programStudi,
      jabatan: jabatanAktif
    };
  }

  private extractProfileData(user: any) {
    let nama = user.email.split('@')[0]; 
    let programStudi = null;

    const currentRole = user.role?.toUpperCase();

    if (currentRole === 'ADMIN' && user.admin) {
      nama = user.admin.nama;
    } else if (currentRole === 'TATA_USAHA' && user.tata_usaha) {
      nama = user.tata_usaha.nama;
    } else if (currentRole === 'DOSEN' && user.dosen) {
      nama = user.dosen.nama;
      programStudi = user.dosen.program_studi?.nama_prodi || null;
    }

    return { nama, programStudi };
  }

  private getJabatanAktif(user: any) {
    const isKajur = (user.dosen?.jabatan_kajur.length ?? 0) > 0;
    const isKaprodi = (user.dosen?.jabatan_kaprodi.length ?? 0) > 0;

    return {
      is_kajur: isKajur,
      is_kaprodi: isKaprodi,
      jurusan_id: isKajur ? user.dosen?.jabatan_kajur[0].jurusan_id : null,
      program_studi_id: isKaprodi ? user.dosen?.jabatan_kaprodi[0].program_studi_id : null
    };
  }
}
