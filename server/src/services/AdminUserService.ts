import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository';
import { Admin } from '../domain/Admin';

export class AdminUserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers(currentUser: any, roleQuery?: string) {
    let whereClause: any = {};
    if (roleQuery) {
      whereClause.role = String(roleQuery).toUpperCase();
    }

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      if (!currentUser.jurusan_id) {
        throw new Error('Akses ditolak. Akun TU Anda tidak terikat ke jurusan mana pun.');
      }
      whereClause.role = 'DOSEN';
      whereClause.dosen = {
        program_studi: { jurusan_id: currentUser.jurusan_id }
      };
    }

    return await this.userRepository.findAll(whereClause);
  }

  async getUserById(id: string, currentUser: any) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User tidak ditemukan.');

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      const isDosenInSameJurusan = (user as any).dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
      if (user.role !== 'DOSEN' || !isDosenInSameJurusan) {
        throw new Error('Akses ditolak. Anda tidak berwenang melihat data di luar jurusan Anda.');
      }
    }
    return user;
  }

  async createUser(data: any, currentUser: any) {
    const { email, password, role, nama, nip, nidn, program_studi_id, jurusan_id } = data;

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      if (role?.toUpperCase() !== 'DOSEN') {
        throw new Error('Akses ditolak. Tata Usaha hanya diizinkan membuat akun DOSEN.');
      }
      const targetProdi = await this.userRepository.findProgramStudi(program_studi_id, currentUser.jurusan_id!);
      if (!targetProdi) {
        throw new Error('Program studi yang dipilih tidak valid atau berada di luar yurisdiksi jurusan Anda.');
      }
    }

    if (!email || !password || !role || !nama) {
      throw new Error('email, password, role, dan nama wajib diisi.');
    }

    const validRoles = ['ADMIN', 'TATA_USAHA', 'DOSEN'];
    if (!validRoles.includes(role.toUpperCase())) {
      throw new Error(`Role tidak valid. Pilihan: ${validRoles.join(', ')}`);
    }

    if (role === 'TATA_USAHA' && !nip) {
      throw new Error('NIP wajib diisi untuk Tata Usaha.');
    }
    if (role === 'DOSEN' && (!nip || !nidn || !program_studi_id)) {
      throw new Error('NIP, NIDN, dan program_studi_id wajib diisi untuk Dosen.');
    }
    if (role === 'TATA_USAHA' && !jurusan_id) {
      throw new Error('Jurusan_id wajib diisi untuk Tata Usaha.');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error('Email sudah terdaftar.');

    const passwordHash = await bcrypt.hash(password, 12);

    // Domain interaction
    if (currentUser.role === 'ADMIN') {
        const admin = new Admin(currentUser.email, ''); 
        admin.tambahPengguna(null as any); // Placeholder for domain interaction
    }

    const createData = {
      email,
      password_hash: passwordHash,
      role: role.toUpperCase(),
      ...(role.toUpperCase() === 'ADMIN' && { admin: { create: { nama } } }),
      ...(role.toUpperCase() === 'TATA_USAHA' && { tata_usaha: { create: { nip, nama, jurusan_id } } }),
      ...(role.toUpperCase() === 'DOSEN' && { dosen: { create: { nip, nidn, nama, program_studi_id } } }),
    };

    return await this.userRepository.create(createData);
  }

  async updateUser(id: string, data: any, currentUser: any) {
    const { email, password, nama, nip, nidn, program_studi_id, jurusan_id } = data;

    const existing = await this.userRepository.findByIdWithDosen(id);
    if (!existing) throw new Error('User tidak ditemukan.');

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      const isDosenInSameJurusan = (existing as any).dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
      if (existing.role !== 'DOSEN' || !isDosenInSameJurusan) {
        throw new Error('Akses ditolak. Anda tidak berwenang mengubah data user di luar jurusan Anda.');
      }

      if (program_studi_id) {
        const validProdi = await this.userRepository.findProgramStudi(program_studi_id, currentUser.jurusan_id!);
        if (!validProdi) {
          throw new Error('Program studi baru berada di luar yurisdiksi jurusan Anda.');
        }
      }
    }

    if (email && email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(email);
      if (emailTaken) throw new Error('Email sudah digunakan user lain.');
    }

    const userData: any = {};
    if (email) userData.email = email;
    if (password) userData.password_hash = await bcrypt.hash(password, 12);

    const profileData: any = {};
    if (nama) profileData.nama = nama;
    if (nip) profileData.nip = nip;
    if (nidn) profileData.nidn = nidn;
    if (program_studi_id) profileData.program_studi_id = program_studi_id;
    if (jurusan_id) profileData.jurusan_id = jurusan_id;

    await this.userRepository.update(id, userData, profileData, existing.role);
    return await this.userRepository.findById(id);
  }

  async deleteUser(id: string, currentUser: any) {
    if (currentUser.id === id) throw new Error('Tidak bisa menghapus akun sendiri.');

    const existing = await this.userRepository.findByIdWithDosen(id);
    if (!existing) throw new Error('User tidak ditemukan.');

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      const isDosenInSameJurusan = (existing as any).dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
      if (existing.role !== 'DOSEN' || !isDosenInSameJurusan) {
        throw new Error('Akses ditolak. Anda tidak berwenang menghapus data user di luar jurusan Anda.');
      }
    }

    await this.userRepository.delete(id);
    return existing;
  }
}
