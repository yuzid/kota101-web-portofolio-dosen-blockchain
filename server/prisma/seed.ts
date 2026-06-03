import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nama = process.env.ADMIN_NAME;

  if (!email || !password || !nama) {
    throw new Error('ADMIN_EMAIL/PASSWORD/NAME tidak ditemukan di .env');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin "${email}" sudah ada. Seed admin dilewati.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role: 'ADMIN',
      admin: { create: { nama } },
    },
    include: { admin: true },
  });

  console.log(`Admin berhasil dibuat - ${user.email} (${user.admin?.nama})`);
}

async function seedProgramStudi() {
  const jurusan = await prisma.jurusan.upsert({
    where: { kode_jurusan: 'JTK' },
    update: {},
    create: {
      kode_jurusan: 'JTK',
      nama_jurusan: 'Jurusan Teknik Komputer dan Informatika',
    },
  });

  await prisma.programStudi.upsert({
    where: { kode_prodi: 'D3-TI' },
    update: {
      nama_prodi: 'D3 TEKNIK INFORMATIKA',
      jurusan_id: jurusan.id,
    },
    create: {
      kode_prodi: 'D3-TI',
      nama_prodi: 'D3 TEKNIK INFORMATIKA',
      jurusan_id: jurusan.id,
    },
  });

  await prisma.programStudi.upsert({
    where: { kode_prodi: 'D4-TI' },
    update: {
      nama_prodi: 'D4 TEKNIK INFORMATIKA',
      jurusan_id: jurusan.id,
    },
    create: {
      kode_prodi: 'D4-TI',
      nama_prodi: 'D4 TEKNIK INFORMATIKA',
      jurusan_id: jurusan.id,
    },
  });

  console.log('Program studi berhasil disiapkan - D3 TEKNIK INFORMATIKA, D4 TEKNIK INFORMATIKA');
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan di .env');

  await seedAdmin();
  await seedProgramStudi();
}

main()
  .catch((err) => { console.error('Seed gagal:', err); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
