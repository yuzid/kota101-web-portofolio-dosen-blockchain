import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

// Prisma v7: wajib pakai adapter untuk koneksi runtime
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nama     = process.env.ADMIN_NAME;

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan di .env');
  if (!email || !password || !nama) throw new Error('ADMIN_EMAIL/PASSWORD/NAME tidak ditemukan di .env');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Admin "${email}" sudah ada. Seed dilewati.`);
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

  console.log(`✅ Admin berhasil dibuat — ${user.email} (${user.admin?.nama})`);
}

main()
  .catch((err) => { console.error('❌ Seed gagal:', err); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });