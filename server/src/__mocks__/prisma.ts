/**
 * Mock untuk Prisma client.
 * Digunakan oleh Jest saat menjalankan test agar tidak memerlukan koneksi database nyata.
 *
 * Semua method Prisma dikembalikan sebagai jest.fn() yang bisa di-override
 * di setiap test menggunakan mockResolvedValue / mockReturnValue.
 */

const mockPrisma: Record<string, any> = {
  // User
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Dosen
  dosen: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // TataUsaha
  tataUsaha: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Admin
  admin: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Jurusan
  jurusan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Program Studi
  programStudi: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Jabatan Kajur
  jabatanKajur: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Jabatan Kaprodi
  jabatanKaprodi: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Dokumen
  dokumen: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // KepemilikanDokumen
  kepemilikanDokumen: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },

  // KegiatanTridharma
  kegiatanTridharma: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // PartisipasiKegiatanTridharma
  partisipasiKegiatanTridharma: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // LampiranBukti
  lampiranBukti: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },

  // AuditTrail
  auditTrail: {
    findMany: jest.fn(),
    create: jest.fn(),
  },

  // Highlight
  highlight: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },

  // HighlightRect
  highlightRect: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },

  // RekapLaporan
  rekapLaporan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Prisma utils
  $transaction: jest.fn((callback: (tx: Record<string, any>) => any) => callback(mockPrisma)),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
};

export { mockPrisma as prisma };
export default mockPrisma;
