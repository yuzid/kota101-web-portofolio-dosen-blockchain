import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';

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
    const roleUpper = role?.toUpperCase();
    let targetProdi: any = null;

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      if (roleUpper !== 'DOSEN') {
        throw new Error('Akses ditolak. Tata Usaha hanya diizinkan membuat akun DOSEN.');
      }
      targetProdi = await this.userRepository.findProgramStudi(program_studi_id, currentUser.jurusan_id!);
      if (!targetProdi) {
        throw new Error('Program studi yang dipilih tidak valid atau berada di luar yurisdiksi jurusan Anda.');
      }
    }

    if (!email || !password || !role || !nama) {
      throw new Error('email, password, role, dan nama wajib diisi.');
    }

    // Validasi panjang password (OWASP / NIST SP 800-63B — minimal 8 karakter)
    if (password.length < 8) {
      throw new Error('Password minimal 8 karakter.');
    }

    const validRoles = ['ADMIN', 'TATA_USAHA', 'DOSEN'];
    if (!validRoles.includes(roleUpper)) {
      throw new Error(`Role tidak valid. Pilihan: ${validRoles.join(', ')}`);
    }

    if (roleUpper === 'TATA_USAHA' && !nip) {
      throw new Error('NIP wajib diisi untuk Tata Usaha.');
    }
    if (roleUpper === 'DOSEN' && (!nip || !nidn || !program_studi_id)) {
      throw new Error('NIP, NIDN, dan program_studi_id wajib diisi untuk Dosen.');
    }
    if (roleUpper === 'TATA_USAHA' && !jurusan_id) {
      throw new Error('Jurusan_id wajib diisi untuk Tata Usaha.');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error('Email sudah terdaftar.');

    const passwordHash = await bcrypt.hash(password, 12);

    if (roleUpper === 'DOSEN') {
      targetProdi = targetProdi || await this.userRepository.findProgramStudiById(program_studi_id);
      if (!targetProdi) {
        throw new Error('Program studi tidak ditemukan.');
      }
    }

    const createData = {
      email,
      password_hash: passwordHash,
      role: roleUpper,
      ...(roleUpper === 'ADMIN' && { admin: { create: { nama } } }),
      ...(roleUpper === 'TATA_USAHA' && { tata_usaha: { create: { nip, nama, jurusan_id } } }),
      ...(roleUpper === 'DOSEN' && {
        dosen: {
          create: {
            nip,
            nidn,
            nama,
            program_studi_id,
            chain_address: 'UNUSED_LEGACY_FIELD',
          },
        },
      }),
    };

    try {
      return await this.userRepository.create(createData);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[])?.join(', ') || '';
        if (target.includes('nip')) throw new Error('NIP sudah terdaftar.');
        if (target.includes('nidn')) throw new Error('NIDN sudah terdaftar.');
        if (target.includes('email')) throw new Error('Email sudah terdaftar.');
        throw new Error('Data sudah terdaftar.');
      }
      throw err;
    }
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

    // Validasi NIP wajib untuk DOSEN dan TATA_USAHA (role tidak bisa diubah, gunakan existing.role)
    if (existing.role === 'TATA_USAHA' && (!nip || !String(nip).trim())) {
      throw new Error('NIP wajib diisi untuk Tata Usaha.');
    }
    if (existing.role === 'DOSEN' && (!nip || !String(nip).trim())) {
      throw new Error('NIP wajib diisi untuk Dosen.');
    }
    // Validasi NIDN wajib untuk DOSEN
    if (existing.role === 'DOSEN' && (!nidn || !String(nidn).trim())) {
      throw new Error('NIDN wajib diisi untuk Dosen.');
    }

    if (email && email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(email);
      if (emailTaken) throw new Error('Email sudah digunakan user lain.');
    }

    const userData: any = {};
    if (email) userData.email = email;
    if (password) {
      // Validasi panjang password jika user mengisi password baru
      if (password.length < 8) {
        throw new Error('Password minimal 8 karakter.');
      }
      userData.password_hash = await bcrypt.hash(password, 12);
    }

    const profileData: any = {};
    if (nama) profileData.nama = nama;
    if (nip) profileData.nip = nip;
    if (nidn) profileData.nidn = nidn;
    if (program_studi_id) profileData.program_studi_id = program_studi_id;
    if (existing.role === 'TATA_USAHA' && jurusan_id) profileData.jurusan_id = jurusan_id;

    try {
      await this.userRepository.update(id, userData, profileData, existing.role);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[])?.join(', ') || '';
        if (target.includes('nip')) throw new Error('NIP sudah digunakan user lain.');
        if (target.includes('nidn')) throw new Error('NIDN sudah digunakan user lain.');
        if (target.includes('email')) throw new Error('Email sudah digunakan user lain.');
        throw new Error('Data sudah digunakan user lain.');
      }
      throw err;
    }
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

  async updateUserStatus(id: string, status: string, currentUser: any) {
    if (currentUser.id === id) {
      throw new Error('Tidak bisa menonaktifkan/mengaktifkan akun sendiri.');
    }

    const existing = await this.userRepository.findByIdWithDosen(id);
    if (!existing) throw new Error('User tidak ditemukan.');

    if (currentUser.role.toUpperCase() === 'TATA_USAHA') {
      const isDosenInSameJurusan = (existing as any).dosen?.program_studi?.jurusan_id === currentUser.jurusan_id;
      if (existing.role !== 'DOSEN' || !isDosenInSameJurusan) {
        throw new Error('Akses ditolak. Anda tidak berwenang mengubah status user di luar jurusan Anda.');
      }
    }

    if (status !== 'active' && status !== 'inactive') {
      throw new Error('Status tidak valid. Harus "active" atau "inactive".');
    }

    await this.userRepository.update(id, { status }, {}, existing.role);
    return await this.userRepository.findById(id);
  }
}
