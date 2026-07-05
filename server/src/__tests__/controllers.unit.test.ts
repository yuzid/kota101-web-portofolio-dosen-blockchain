/**
 * Unit tests: controllers
 * Fokus: controller method dipanggil langsung dengan req/res mock.
 */

import { prisma } from '../lib/prisma';
import { AuthController } from '../controllers/AuthController';
import { AdminUserController } from '../controllers/AdminUserController';
import { AkademikController } from '../controllers/AkademikController';
import { JabatanController } from '../controllers/JabatanController';
import { ActivityController } from '../controllers/ActivityController';
import { DocumentController } from '../controllers/DocumentController';
import { HighlightController } from '../controllers/HighlightController';
import { JenisDokumenController } from '../controllers/JenisDokumenController';
import { AkademikRoleController } from '../controllers/AkademikRoleController';

const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  role: 'DOSEN',
  jabatan: { is_kajur: true, is_kaprodi: true, jurusan_id: 'jurusan-1', program_studi_id: 'prodi-1' },
};

function mockReq(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: USER,
    file: { originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('PDF') },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  (prisma as any).jenisDokumen = (prisma as any).jenisDokumen || {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  };
});

describe('AuthController unit', () => {
  it('login dan googleLogin memanggil AuthService', async () => {
    const service = {
      login: jest.fn().mockResolvedValue({ token: 'jwt' }),
      googleLogin: jest.fn().mockResolvedValue({ token: 'google-jwt' }),
    };
    const controller = new AuthController(service as any);

    let res = mockRes();
    await controller.login(mockReq({ body: { email: 'a@example.com', password: 'password' } }), res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { token: 'jwt' } });

    res = mockRes();
    await controller.googleLogin(mockReq({ body: { idToken: 'id-token' } }), res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { token: 'google-jwt' } });
  });

  it('login mengembalikan 401 jika credential salah', async () => {
    const controller = new AuthController({ login: jest.fn().mockResolvedValue(null) } as any);
    const res = mockRes();
    await controller.login(mockReq({ body: { email: 'a@example.com', password: 'bad' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('AdminUserController unit', () => {
  it('menjalankan seluruh method user controller', async () => {
    const service = {
      getAllUsers: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
      getUserById: jest.fn().mockResolvedValue({ id: 'user-1' }),
      createUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
      updateUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
      deleteUser: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
    };
    const controller = new AdminUserController(service as any);

    for (const [method, req] of [
      ['getAllUsers', mockReq({ query: { role: 'dosen' } })],
      ['getUserById', mockReq({ params: { id: 'user-1' } })],
      ['createUser', mockReq({ body: { email: 'a@example.com' } })],
      ['updateUser', mockReq({ params: { id: 'user-1' }, body: { nama: 'User' } })],
      ['deleteUser', mockReq({ params: { id: 'user-1' } })],
    ] as const) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json).toHaveBeenCalled();
    }
  });

  it('menolak jika current user tidak ada', async () => {
    const controller = new AdminUserController({ getAllUsers: jest.fn() } as any);
    const res = mockRes();
    await controller.getAllUsers(mockReq({ user: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('AkademikController unit', () => {
  it('menjalankan seluruh method akademik', async () => {
    const service = {
      getAllJurusan: jest.fn().mockResolvedValue([]),
      getJurusanById: jest.fn().mockResolvedValue({ id: 'jurusan-1' }),
      createJurusan: jest.fn().mockResolvedValue({ id: 'jurusan-1' }),
      updateJurusan: jest.fn().mockResolvedValue({ id: 'jurusan-1' }),
      deleteJurusan: jest.fn().mockResolvedValue({ nama_jurusan: 'Teknik' }),
      getAllProdi: jest.fn().mockResolvedValue([]),
      getProdiById: jest.fn().mockResolvedValue({ id: 'prodi-1' }),
      createProdi: jest.fn().mockResolvedValue({ id: 'prodi-1' }),
      updateProdi: jest.fn().mockResolvedValue({ id: 'prodi-1' }),
      deleteProdi: jest.fn().mockResolvedValue({ nama_prodi: 'Informatika' }),
    };
    const controller = new AkademikController(service as any);

    const cases = [
      ['getAllJurusan', mockReq()],
      ['getJurusanById', mockReq({ params: { id: 'jurusan-1' } })],
      ['createJurusan', mockReq({ body: { kode_jurusan: 'TI' } })],
      ['updateJurusan', mockReq({ params: { id: 'jurusan-1' } })],
      ['deleteJurusan', mockReq({ params: { id: 'jurusan-1' } })],
      ['getAllProdi', mockReq({ query: { jurusan_id: 'jurusan-1' } })],
      ['getProdiById', mockReq({ params: { id: 'prodi-1' } })],
      ['createProdi', mockReq({ body: { kode_prodi: 'IF' } })],
      ['updateProdi', mockReq({ params: { id: 'prodi-1' } })],
      ['deleteProdi', mockReq({ params: { id: 'prodi-1' } })],
    ] as const;

    for (const [method, req] of cases) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json).toHaveBeenCalled();
    }
  });
});

describe('JabatanController unit', () => {
  it('menjalankan seluruh method jabatan', async () => {
    const service = {
      getAllKajur: jest.fn().mockResolvedValue([]),
      createKajur: jest.fn().mockResolvedValue({ id: 'kajur-1' }),
      updateKajur: jest.fn().mockResolvedValue({ id: 'kajur-1' }),
      deleteKajur: jest.fn().mockResolvedValue(undefined),
      getAllKaprodi: jest.fn().mockResolvedValue([]),
      createKaprodi: jest.fn().mockResolvedValue({ id: 'kaprodi-1' }),
      updateKaprodi: jest.fn().mockResolvedValue({ id: 'kaprodi-1' }),
      deleteKaprodi: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new JabatanController(service as any);
    const methods = ['getAllKajur', 'createKajur', 'updateKajur', 'deleteKajur', 'getAllKaprodi', 'createKaprodi', 'updateKaprodi', 'deleteKaprodi'];

    for (const method of methods) {
      const res = mockRes();
      await (controller as any)[method](mockReq({ params: { id: 'jabatan-1' } }), res);
      expect(res.json).toHaveBeenCalled();
    }
  });
});

describe('ActivityController unit', () => {
  it('menjalankan seluruh method activity controller', async () => {
    const service = {
      getPublicActivities: jest.fn().mockResolvedValue([]),
      getPublicActivityById: jest.fn().mockResolvedValue({ id: 'act-1' }),
      getAllActivities: jest.fn().mockResolvedValue([]),
      getSummaryStats: jest.fn().mockResolvedValue({ total: 1 }),
      getTanpaBukti: jest.fn().mockResolvedValue([]),
      getActivityById: jest.fn().mockResolvedValue({ id: 'act-1' }),
      getAuditTrail: jest.fn().mockResolvedValue([]),
      createActivity: jest.fn().mockResolvedValue({ id: 'act-1' }),
      updateActivity: jest.fn().mockResolvedValue({ id: 'act-1' }),
      deleteActivity: jest.fn().mockResolvedValue(undefined),
      addLampiran: jest.fn().mockResolvedValue({ id: 'lamp-1' }),
      deleteLampiran: jest.fn().mockResolvedValue(undefined),
      getPendingConfirmations: jest.fn().mockResolvedValue([]),
      acceptParticipation: jest.fn().mockResolvedValue(undefined),
      rejectParticipation: jest.fn().mockResolvedValue(undefined),
      addMember: jest.fn().mockResolvedValue(undefined),
      removeMember: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ActivityController(service as any);
    const cases = [
      ['getPublicActivities', mockReq()],
      ['getPublicActivityById', mockReq({ params: { id: 'act-1' } })],
      ['getAllActivities', mockReq()],
      ['getSummaryStats', mockReq()],
      ['getTanpaBukti', mockReq()],
      ['getActivityById', mockReq({ params: { id: 'act-1' } })],
      ['getAuditTrail', mockReq({ params: { id: 'act-1' } })],
      ['createActivity', mockReq({ body: { namaKegiatan: 'Kegiatan' } })],
      ['updateActivity', mockReq({ params: { id: 'act-1' }, body: { namaKegiatan: 'Update' } })],
      ['deleteActivity', mockReq({ params: { id: 'act-1' } })],
      ['addLampiran', mockReq({ params: { id: 'act-1' }, body: { dokumen_id: 'doc-1' } })],
      ['deleteLampiran', mockReq({ params: { id: 'act-1', lampiranId: 'lamp-1' } })],
      ['getPendingConfirmations', mockReq()],
      ['acceptParticipation', mockReq({ params: { partisipasiId: 'part-1' } })],
      ['rejectParticipation', mockReq({ params: { partisipasiId: 'part-1' } })],
      ['addMember', mockReq({ params: { id: 'act-1' }, body: { anggota_id: 'dosen-2' } })],
      ['removeMember', mockReq({ params: { id: 'act-1', anggotaId: 'dosen-2' } })],
    ] as const;

    for (const [method, req] of cases) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json).toHaveBeenCalled();
    }
  });
});

describe('DocumentController unit', () => {
  it('menjalankan seluruh method document controller', async () => {
    const documentService = {
      getPublicDocuments: jest.fn().mockResolvedValue([]),
      getPublicDocumentById: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      getPublicDocumentContent: jest.fn().mockResolvedValue({ bytes: Buffer.from('PDF'), contentType: 'application/pdf', contentLength: 3, fileName: 'doc.pdf', contentHash: 'hash' }),
      getDosenDocuments: jest.fn().mockResolvedValue([]),
      uploadDosenDocument: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      getDocumentPreview: jest.fn().mockResolvedValue({ url: 'signed' }),
      getDocumentContent: jest.fn().mockResolvedValue({ bytes: Buffer.from('PDF'), contentType: 'application/pdf', contentLength: 3, fileName: 'doc.pdf', contentHash: 'hash' }),
      uploadTUDocument: jest.fn().mockResolvedValue({ id: 'doc-1', file_path: 'path', hash_file: 'hash' }),
      updateMetadata: jest.fn().mockResolvedValue(undefined),
      replaceFile: jest.fn().mockResolvedValue({ id: 'doc-1', file_path: 'path', hash_file: 'hash' }),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
    };
    const distributionService = {
      getTUDokumenWithDistribusi: jest.fn().mockResolvedValue([]),
      saveDraft: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      distribute: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      getPendingRequests: jest.fn().mockResolvedValue([]),
      getDosenDistributionHistory: jest.fn().mockResolvedValue([]),
      acceptDocument: jest.fn().mockResolvedValue({ message: 'diterima' }),
      rejectDocument: jest.fn().mockResolvedValue({ message: 'ditolak' }),
      getDistribusiByDokumen: jest.fn().mockResolvedValue([]),
      getDokumenWithDistribusi: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      resendDistribution: jest.fn().mockResolvedValue({ message: 'resent' }),
      deleteDistribution: jest.fn().mockResolvedValue({ message: 'deleted' }),
    };
    const controller = new DocumentController(documentService as any, distributionService as any);
    const cases = [
      ['getPublicDocuments', mockReq()],
      ['getPublicDocumentById', mockReq({ params: { id: 'doc-1' } })],
      ['getPublicDocumentContent', mockReq({ params: { id: 'doc-1' } })],
      ['getDosenDocuments', mockReq()],
      ['uploadDosenDocument', mockReq({ body: { nama: 'Dok' } })],
      ['getDocumentPreview', mockReq({ params: { id: 'doc-1' } })],
      ['getDocumentContent', mockReq({ params: { id: 'doc-1' } })],
      ['getTUDocuments', mockReq()],
      ['saveDraft', mockReq({ body: { nama: 'Dok' } })],
      ['distributeDocument', mockReq({ body: { nama: 'Dok' } })],
      ['uploadTUDocument', mockReq({ body: { nama: 'Dok' } })],
      ['updateMetadata', mockReq({ params: { id: 'doc-1' }, body: { nama: 'Baru' } })],
      ['replaceFile', mockReq({ params: { id: 'doc-1' } })],
      ['deleteDocument', mockReq({ params: { id: 'doc-1' } })],
      ['getPendingRequests', mockReq()],
      ['getDosenDistributionHistory', mockReq()],
      ['acceptDocument', mockReq({ params: { id: 'doc-1' } })],
      ['rejectDocument', mockReq({ params: { id: 'doc-1' } })],
      ['getDistribusiByDokumen', mockReq({ params: { id: 'doc-1' } })],
      ['getDokumenDetailWithDistribusi', mockReq({ params: { id: 'doc-1' } })],
      ['resendDistribution', mockReq({ params: { id: 'dist-1' } })],
      ['deleteDistribution', mockReq({ params: { id: 'dist-1' } })],
    ] as const;

    for (const [method, req] of cases) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json.mock.calls.length + res.send.mock.calls.length).toBeGreaterThan(0);
    }
  });
});

describe('HighlightController unit', () => {
  it('menjalankan seluruh method highlight controller', async () => {
    const service = {
      getHighlightsByDocument: jest.fn().mockResolvedValue([]),
      getHighlightsByDocumentAndDosen: jest.fn().mockResolvedValue({ highlights: [], kepemilikanId: 'kep-1' }),
      syncHighlights: jest.fn().mockResolvedValue([]),
      addHighlight: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      updateHighlight: jest.fn().mockResolvedValue({ id: 'hl-1' }),
      deleteHighlight: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new HighlightController(service as any);
    const cases = [
      ['getHighlights', mockReq({ query: { dokumenId: 'doc-1' } })],
      ['getHighlights', mockReq({ params: { kepemilikanId: 'kep-1' } })],
      ['syncHighlights', mockReq({ params: { kepemilikanId: 'kep-1' }, body: { highlights: [] } })],
      ['addHighlight', mockReq({ params: { kepemilikanId: 'kep-1' }, body: { text: 'a' } })],
      ['updateHighlight', mockReq({ params: { id: 'hl-1' }, body: { text: 'b' } })],
      ['deleteHighlight', mockReq({ params: { id: 'hl-1' } })],
      ['getPublicHighlights', mockReq({ params: { kepemilikanId: 'kep-1' } })],
    ] as const;

    for (const [method, req] of cases) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json).toHaveBeenCalled();
    }
  });
});

describe('JenisDokumenController unit', () => {
  it('getAll dan create memanggil prisma langsung', async () => {
    const controller = new JenisDokumenController();
    (prisma.jenisDokumen.findMany as jest.Mock).mockResolvedValue([{ nama: 'CUSTOM' }]);
    (prisma.jenisDokumen.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.jenisDokumen.create as jest.Mock).mockResolvedValue({ id: 'jenis-1', nama: 'CUSTOM_BARU' });

    let res = mockRes();
    await controller.getAll(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data).toContain('CUSTOM');

    res = mockRes();
    await controller.create(mockReq({ body: { nama: 'custom_baru' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('AkademikRoleController unit', () => {
  let controller: AkademikRoleController;
  let activityRepository: any;
  let rekapService: any;
  let documentService: any;

  beforeEach(() => {
    controller = new AkademikRoleController();
    activityRepository = {
      findByJurusan: jest.fn().mockResolvedValue({ data: [] }),
      findByProdi: jest.fn().mockResolvedValue({ data: [] }),
      findJurusanSummaryStats: jest.fn().mockResolvedValue({ semua: 1 }),
      findProdiSummaryStats: jest.fn().mockResolvedValue({ semua: 1 }),
    };
    rekapService = {
      createRekap: jest.fn().mockResolvedValue({ id: 'rekap-1' }),
      getAllRekap: jest.fn().mockResolvedValue([{ id: 'rekap-1' }]),
      getRekapDetail: jest.fn().mockResolvedValue({ id: 'rekap-1' }),
      updateRekap: jest.fn().mockResolvedValue({ id: 'rekap-1' }),
      deleteRekap: jest.fn().mockResolvedValue(undefined),
    };
    documentService = {
      getDocumentPreview: jest.fn().mockResolvedValue({ url: 'signed' }),
      getDocumentContent: jest.fn().mockResolvedValue({ bytes: Buffer.from('PDF'), contentType: 'application/pdf', contentLength: 3, fileName: 'doc.pdf', contentHash: 'hash' }),
    };
    (controller as any).activityRepository = activityRepository;
    (controller as any).rekapService = rekapService;
    (controller as any).documentService = documentService;

    (prisma.jabatanKajur.findFirst as jest.Mock).mockResolvedValue({ dosen_id: USER.id, jurusan_id: 'jurusan-1' });
    (prisma.jabatanKaprodi.findFirst as jest.Mock).mockResolvedValue({ dosen_id: USER.id, program_studi_id: 'prodi-1' });
    (prisma.programStudi.findMany as jest.Mock).mockResolvedValue([{ id: 'prodi-1' }]);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'u@example.com', dosen: { nama: 'Dosen' } });
    (prisma.lampiranBukti.findUnique as jest.Mock).mockResolvedValue({
      id: 'lamp-1',
      kegiatan_id: 'act-1',
      dokumen_id: 'doc-1',
      kegiatan: {
        id: 'act-1',
        dosen: { program_studi_id: 'prodi-1', program_studi: { jurusan_id: 'jurusan-1' } },
      },
      dokumen: { id: 'doc-1' },
    });
  });

  it('menjalankan seluruh method akademik role controller', async () => {
    const cases = [
      ['getJurusanActivities', mockReq()],
      ['getProdiActivities', mockReq()],
      ['getJurusanSummaryStats', mockReq()],
      ['getProdiSummaryStats', mockReq()],
      ['createJurusanRekap', mockReq({ body: { nama: 'Rekap', tanggalPerekapan: '2025-01-01' } })],
      ['getJurusanRekaps', mockReq()],
      ['getKajurAllRekaps', mockReq()],
      ['createProdiRekap', mockReq({ body: { nama: 'Rekap', tanggalPerekapan: '2025-01-01' } })],
      ['getProdiRekaps', mockReq()],
      ['getRekapDetail', mockReq({ params: { id: 'rekap-1' } })],
      ['updateRekap', mockReq({ params: { id: 'rekap-1' }, body: { nama: 'Update' } })],
      ['deleteRekap', mockReq({ params: { id: 'rekap-1' } })],
      ['getJurusanLampiranPreview', mockReq({ params: { kegiatanId: 'act-1', lampiranId: 'lamp-1' } })],
      ['getJurusanLampiranContent', mockReq({ params: { kegiatanId: 'act-1', lampiranId: 'lamp-1' } })],
      ['getProdiLampiranPreview', mockReq({ params: { kegiatanId: 'act-1', lampiranId: 'lamp-1' } })],
      ['getProdiLampiranContent', mockReq({ params: { kegiatanId: 'act-1', lampiranId: 'lamp-1' } })],
    ] as const;

    for (const [method, req] of cases) {
      const res = mockRes();
      await (controller as any)[method](req, res);
      expect(res.json.mock.calls.length + res.send.mock.calls.length).toBeGreaterThan(0);
    }
  });
});
