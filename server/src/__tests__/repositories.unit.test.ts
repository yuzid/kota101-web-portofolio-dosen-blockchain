/**
 * Unit tests: repositories
 * Fokus: setiap public method repository memanggil Prisma dengan benar dan
 * melakukan transformasi kecil yang ada di repository.
 */

import { prisma } from '../lib/prisma';
import { AkademikRepository } from '../repositories/AkademikRepository';
import { UserRepository } from '../repositories/UserRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { DistributionRepository } from '../repositories/DistributionRepository';
import { HighlightRepository } from '../repositories/HighlightRepository';
import { JabatanRepository } from '../repositories/JabatanRepository';
import { RekapRepository } from '../repositories/RekapRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

const mockResult = { id: 'result-1' };
const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();

  db.programStudi.findFirst = jest.fn();
  db.kepemilikanDokumen.createMany = jest.fn();
  db.kepemilikanDokumen.count = jest.fn();
  db.partisipasiKegiatanTridharma.createMany = jest.fn();
  db.partisipasiKegiatanTridharma.deleteMany = jest.fn();
  db.lampiranBukti.createMany = jest.fn();
  db.lampiranBukti.deleteMany = jest.fn();
  db.kegiatanTridharma.groupBy = jest.fn().mockResolvedValue([]);
  db.kepemilikanDokumen.updateMany = jest.fn().mockResolvedValue({ count: 1 });

  for (const model of Object.values(prisma) as any[]) {
    if (!model || typeof model !== 'object') continue;
    for (const value of Object.values(model)) {
      if (jest.isMockFunction(value)) {
        value.mockResolvedValue(mockResult);
      }
    }
  }

  (prisma.$transaction as jest.Mock).mockImplementation((arg: any) => {
    if (typeof arg === 'function') return arg(prisma);
    return Promise.all(arg);
  });
});

describe('AkademikRepository unit', () => {
  const repo = new AkademikRepository();

  it('memanggil seluruh method jurusan', async () => {
    await expect(repo.findAllJurusan()).resolves.toBe(mockResult);
    await expect(repo.findJurusanById('jurusan-1')).resolves.toBe(mockResult);
    await expect(repo.findJurusanByKode('TI')).resolves.toBe(mockResult);
    await expect(repo.createJurusan({ kode_jurusan: 'TI' })).resolves.toBe(mockResult);
    await expect(repo.updateJurusan('jurusan-1', { nama_jurusan: 'Teknik' })).resolves.toBe(mockResult);
    await expect(repo.deleteJurusan('jurusan-1')).resolves.toBe(mockResult);

    expect(prisma.jurusan.findMany).toHaveBeenCalled();
    expect(prisma.jurusan.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'jurusan-1' } }));
    expect(prisma.jurusan.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { kode_jurusan: 'TI' } }));
    expect(prisma.jurusan.create).toHaveBeenCalledWith(expect.objectContaining({ data: { kode_jurusan: 'TI' } }));
    expect(prisma.jurusan.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'jurusan-1' } }));
    expect(prisma.jurusan.delete).toHaveBeenCalledWith({ where: { id: 'jurusan-1' } });
  });

  it('memanggil seluruh method prodi', async () => {
    await expect(repo.findAllProdi({ jurusan_id: 'jurusan-1' })).resolves.toBe(mockResult);
    await expect(repo.findProdiById('prodi-1')).resolves.toBe(mockResult);
    await expect(repo.findProdiByKode('IF')).resolves.toBe(mockResult);
    await expect(repo.createProdi({ kode_prodi: 'IF' })).resolves.toBe(mockResult);
    await expect(repo.updateProdi('prodi-1', { nama_prodi: 'Informatika' })).resolves.toBe(mockResult);
    await expect(repo.deleteProdi('prodi-1')).resolves.toBe(mockResult);

    expect(prisma.programStudi.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { jurusan_id: 'jurusan-1' } }));
    expect(prisma.programStudi.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'prodi-1' } }));
    expect(prisma.programStudi.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { kode_prodi: 'IF' } }));
    expect(prisma.programStudi.create).toHaveBeenCalledWith(expect.objectContaining({ data: { kode_prodi: 'IF' } }));
    expect(prisma.programStudi.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'prodi-1' } }));
    expect(prisma.programStudi.delete).toHaveBeenCalledWith({ where: { id: 'prodi-1' } });
  });
});

describe('UserRepository unit', () => {
  const repo = new UserRepository();

  it('memanggil seluruh method read/create/delete user', async () => {
    await repo.findByEmail('a@example.com');
    await repo.findAll({ role: 'DOSEN' });
    await repo.findById('user-1');
    await repo.findByIdWithDosen('user-1');
    await repo.create({ email: 'a@example.com' });
    await repo.delete('user-1');
    await repo.findProgramStudi('prodi-1', 'jurusan-1');
    await repo.findProgramStudiById('prodi-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'a@example.com' } }));
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { role: 'DOSEN' } }));
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: { email: 'a@example.com' } }));
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(prisma.programStudi.findFirst).toHaveBeenCalledWith({ where: { id: 'prodi-1', jurusan_id: 'jurusan-1' } });
  });

  it('update menjalankan transaksi profile sesuai role', async () => {
    await repo.update('user-1', { email: 'baru@example.com' }, { nama: 'Dosen' }, 'DOSEN');

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { email: 'baru@example.com' } });
    expect(prisma.dosen.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { nama: 'Dosen' } });
  });
});

describe('DocumentRepository unit', () => {
  const repo = new DocumentRepository();

  it('memanggil seluruh method dokumen dasar', async () => {
    await repo.findAll({ deleted_at: null });
    await repo.findById('doc-1');
    await repo.findByHashFile('hash-1');
    await repo.findPreviewById('doc-1');
    await repo.update('doc-1', { nama: 'Dokumen' });
    await repo.softDelete('doc-1');
    await repo.findKepemilikan('dosen-1', 'doc-1');
    await repo.createKepemilikan('dosen-1', 'doc-1');
    await repo.findWithDistribusi('doc-1');
    await repo.findAllPublic();
    await repo.findByIdPublic('doc-1');

    expect(prisma.dokumen.findMany).toHaveBeenCalled();
    expect(prisma.dokumen.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'doc-1' } }));
    expect(prisma.dokumen.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ hash_file: 'hash-1' }) }));
    expect(prisma.kepemilikanDokumen.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ dosen_id: 'dosen-1', dokumen_id: 'doc-1' }) }));
  });

  it('create membuat dokumen dan kepemilikan dalam transaksi', async () => {
    (prisma.dokumen.create as jest.Mock).mockResolvedValueOnce({ id: 'doc-1' });

    const result = await repo.create({ nama: 'Dokumen' }, ['dosen-1', 'dosen-2']);

    expect(result).toEqual({ id: 'doc-1' });
    expect(prisma.kepemilikanDokumen.createMany).toHaveBeenCalledWith({
      data: [
        { dosen_id: 'dosen-1', dokumen_id: 'doc-1' },
        { dosen_id: 'dosen-2', dokumen_id: 'doc-1' },
      ],
    });
  });
});

describe('DistributionRepository unit', () => {
  const repo = new DistributionRepository();

  it('memanggil seluruh method distribusi', async () => {
    (prisma.kepemilikanDokumen.findMany as jest.Mock).mockResolvedValueOnce([{ dosen_id: 'dosen-1' }]);

    await repo.create({ dokumen_id: 'doc-1', dosen_id: 'dosen-1', didistribusikan_oleh_id: 'tu-1' });
    await repo.createMany('doc-1', ['dosen-1'], 'tu-1');
    await repo.findDosenRecipientsByIds(['dosen-1']);
    await repo.findTataUsahaSenderByUserId('tu-1');
    await expect(repo.findDistributedDosenIds('doc-1', ['dosen-1'])).resolves.toEqual(['dosen-1']);
    await repo.findByDokumen('doc-1');
    await repo.findById('dist-1');
    await repo.findPendingByDosen('dosen-1');
    await repo.findByDosen('dosen-1');
    await repo.updateStatus('dist-1', 'DISETUJUI');
    await repo.findDistributionByDosenAndDokumen('dosen-1', 'doc-1');
    await repo.resetStatus('dist-1');

    expect(prisma.kepemilikanDokumen.create).toHaveBeenCalled();
    expect(prisma.kepemilikanDokumen.createMany).toHaveBeenCalled();
    expect(prisma.kepemilikanDokumen.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'dist-1' } }));
  });

  it('delete menghapus highlight terkait sebelum distribusi', async () => {
    (prisma.highlight.findMany as jest.Mock).mockResolvedValueOnce([{ id: 'hl-1' }]);

    await repo.delete('dist-1');

    expect(prisma.highlightRect.deleteMany).toHaveBeenCalledWith({ where: { highlight_id: { in: ['hl-1'] } } });
    expect(prisma.highlight.deleteMany).toHaveBeenCalledWith({ where: { kepemilikan_id: 'dist-1' } });
    expect(prisma.kepemilikanDokumen.delete).toHaveBeenCalledWith({ where: { id: 'dist-1' } });
  });
});

describe('HighlightRepository unit', () => {
  const repo = new HighlightRepository();

  it('memanggil seluruh method highlight dasar', async () => {
    await repo.findByKepemilikanId('kep-1');
    await repo.findById('hl-1');
    await repo.create({ kepemilikan_id: 'kep-1', page_number: 1, highlighted_text: 'teks', highlight_rect: [] });
    await repo.findByDokumenId('doc-1');

    expect(prisma.highlight.findMany).toHaveBeenCalled();
    expect(prisma.highlight.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'hl-1' } }));
    expect(prisma.highlight.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ kepemilikan_id: 'kep-1', page_number: 1 }),
    }));
  });

  it('update dan delete memakai transaksi', async () => {
    await repo.update('hl-1', { page_number: 2, highlighted_text: 'baru', highlight_rect: [{ x: 1 }] });
    await repo.delete('hl-1');
    (prisma.highlight.findMany as jest.Mock).mockResolvedValueOnce([{ id: 'hl-1' }]);
    await repo.deleteByKepemilikanId('kep-1');

    expect(prisma.highlight.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'hl-1' } }));
    expect(prisma.highlightRect.deleteMany).toHaveBeenCalled();
    expect(prisma.highlight.delete).toHaveBeenCalledWith({ where: { id: 'hl-1' } });
  });

  it('verify ownership dan kepemilikan mengembalikan boolean', async () => {
    (prisma.highlight.findUnique as jest.Mock).mockResolvedValueOnce({ kepemilikan: { dosen_id: 'dosen-1' } });
    (prisma.kepemilikanDokumen.findUnique as jest.Mock).mockResolvedValueOnce({ dosen_id: 'dosen-1' });

    await expect(repo.verifyOwnership('hl-1', 'dosen-1')).resolves.toBe(true);
    await expect(repo.verifyKepemilikanOwnership('kep-1', 'dosen-1')).resolves.toBe(true);

    (prisma.highlight.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.kepemilikanDokumen.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(repo.verifyOwnership('hl-404', 'dosen-1')).resolves.toBe(false);
    await expect(repo.verifyKepemilikanOwnership('kep-404', 'dosen-1')).resolves.toBe(false);
  });

  it('findKepemilikanId mengembalikan id atau undefined', async () => {
    (prisma.kepemilikanDokumen.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'kep-1' });
    await expect(repo.findKepemilikanId('dosen-1', 'doc-1')).resolves.toBe('kep-1');
  });
});

describe('JabatanRepository unit', () => {
  const repo = new JabatanRepository();

  it('memanggil seluruh method kajur dan kaprodi', async () => {
    const mulai = new Date('2025-01-01');
    const selesai = new Date('2025-12-31');

    await repo.findAllKajur({ jurusan_id: 'jurusan-1' });
    await repo.findKajurById('kajur-1');
    await repo.findOverlapKajur('jurusan-1', mulai, selesai, 'kajur-lama');
    await repo.createKajur({ dosen_id: 'dosen-1' });
    await repo.updateKajur('kajur-1', { dosen_id: 'dosen-2' });
    await repo.deleteKajur('kajur-1');
    await repo.findAllKaprodi({ program_studi_id: 'prodi-1' });
    await repo.findKaprodiById('kaprodi-1');
    await repo.findOverlapKaprodi('prodi-1', mulai, selesai, 'kaprodi-lama');
    await repo.createKaprodi({ dosen_id: 'dosen-1' });
    await repo.updateKaprodi('kaprodi-1', { dosen_id: 'dosen-2' });
    await repo.deleteKaprodi('kaprodi-1');
    await repo.findDosenById('dosen-1');

    expect(prisma.jabatanKajur.findMany).toHaveBeenCalled();
    expect(prisma.jabatanKajur.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ jurusan_id: 'jurusan-1' }) }));
    expect(prisma.jabatanKaprodi.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ program_studi_id: 'prodi-1' }) }));
    expect(prisma.dosen.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'dosen-1' } }));
  });
});

describe('RekapRepository unit', () => {
  const repo = new RekapRepository();

  it('memanggil seluruh method rekap', async () => {
    await repo.create({ nama: 'Rekap' } as any);
    await repo.findAll({ jurusan_id: 'jurusan-1' } as any);
    await repo.findById('rekap-1');
    await repo.update('rekap-1', { nama: 'Revisi' } as any);
    await repo.delete('rekap-1');

    expect(db.rekapLaporan.create).toHaveBeenCalledWith(expect.objectContaining({ data: { nama: 'Rekap' } }));
    expect(db.rekapLaporan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { jurusan_id: 'jurusan-1' } }));
    expect(db.rekapLaporan.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'rekap-1' } }));
    expect(db.rekapLaporan.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'rekap-1' } }));
    expect(db.rekapLaporan.delete).toHaveBeenCalledWith({ where: { id: 'rekap-1' } });
  });
});

describe('ActivityRepository unit', () => {
  const repo = new ActivityRepository();

  it('memanggil method read dan pagination activity', async () => {
    (prisma.kegiatanTridharma.count as jest.Mock).mockResolvedValue(11);
    (prisma.kegiatanTridharma.findMany as jest.Mock).mockResolvedValue([{ id: 'keg-1' }]);
    (prisma.kepemilikanDokumen.count as jest.Mock).mockResolvedValue(3);
    (prisma.kegiatanTridharma as any).groupBy.mockResolvedValue([{ kategori_tridharma: 'PENELITIAN', _count: 2 }]);

    await expect(repo.findAll('dosen-1')).resolves.toEqual([{ id: 'keg-1' }]);
    await expect(repo.findByJurusan('jurusan-1', { prodiId: 'prodi-1', status: 'lengkap' } as any, { page: 2, size: 5 })).resolves.toMatchObject({ total: 11, page: 2, size: 5, totalPages: 3 });
    await expect(repo.findByProdi('prodi-1', { search: 'riset' } as any, { page: 1, size: 10 })).resolves.toMatchObject({ total: 11, totalPages: 2 });
    await expect(repo.findSummaryStats('dosen-1')).resolves.toMatchObject({ activities: [{ id: 'keg-1' }], total_dokumen: 3 });
    await expect(repo.findJurusanSummaryStats('jurusan-1', {} as any)).resolves.toMatchObject({ semua: 11, PENELITIAN: 2 });
    await expect(repo.findProdiSummaryStats('prodi-1', {} as any)).resolves.toMatchObject({ semua: 11, PENELITIAN: 2 });
    await repo.findTanpaBukti('dosen-1');
    await repo.findById('keg-1');
    await repo.findParticipationsByDosen('dosen-1');
    await repo.findPendingConfirmations('dosen-1');
    await repo.findAllPublic();
    await repo.findByIdPublic('keg-1');

    expect(prisma.kegiatanTridharma.findMany).toHaveBeenCalled();
    expect((prisma.kegiatanTridharma as any).groupBy).toHaveBeenCalled();
  });

  it('memanggil method mutasi activity', async () => {
    (prisma.kegiatanTridharma.create as jest.Mock).mockResolvedValueOnce({ id: 'keg-1' });
    (prisma.lampiranBukti.findMany as jest.Mock).mockResolvedValueOnce([{ dokumen_id: 'doc-1' }]);
    (prisma.kepemilikanDokumen.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'kep-1', dokumen_id: 'doc-1', status: 'MENUNGGU_KONFIRMASI' },
    ]);
    (prisma.kegiatanTridharma.findUnique as jest.Mock).mockResolvedValueOnce({
      dosen_id: 'dosen-owner',
      partisipasi: [{ dosen_id: 'dosen-2' }, { dosen_id: 'dosen-owner' }],
    });

    await repo.create({ dosen_id: 'dosen-1' }, [{ dosen_id: 'dosen-2' }], [{ dokumen_id: 'doc-1' }]);
    await repo.update('keg-1', { nama_kegiatan: 'Update' });
    await repo.updateTransactionId('keg-1', 'tx-1');
    await repo.delete('keg-1');
    await repo.createLampiran({ kegiatan_id: 'keg-1', dokumen_id: 'doc-1' });
    await repo.deleteLampiran('lamp-1');
    await repo.updateParticipationStatus('part-1', 'DITERIMA');
    await repo.findParticipationById('part-1');
    await repo.createParticipation({ dosen_id: 'dosen-1', kegiatan_tridharma_id: 'keg-1', peran: 'Anggota', status: 'MENUNGGU_KONFIRMASI' });
    await repo.deleteParticipation('dosen-1', 'keg-1');
    await expect(repo.getActivityDocumentIds('keg-1')).resolves.toEqual(['doc-1']);
    await repo.createKepemilikanIfNotExists('dosen-1', ['doc-1', 'doc-2']);
    await expect(repo.getDiterimaMemberIds('keg-1')).resolves.toEqual(['dosen-owner', 'dosen-2']);

    expect(prisma.kegiatanTridharma.create).toHaveBeenCalled();
    expect(prisma.partisipasiKegiatanTridharma.createMany).toHaveBeenCalled();
    expect(prisma.lampiranBukti.createMany).toHaveBeenCalled();
    expect(prisma.kepemilikanDokumen.updateMany).toHaveBeenCalled();
    expect(prisma.kepemilikanDokumen.createMany).toHaveBeenCalled();
  });
});
