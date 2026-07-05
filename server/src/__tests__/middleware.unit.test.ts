/**
 * Unit tests: middleware
 */

import jwt from 'jsonwebtoken';
import { asyncHandler, errorHandler, requireRole, verifyToken } from '../middleware/authMiddleware';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware unit', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    jest.clearAllMocks();
  });

  it('asyncHandler meneruskan error ke next', async () => {
    const err = new Error('boom');
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw err;
    });

    await handler({} as any, mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it('verifyToken menerima token valid dan menolak token kosong/invalid', () => {
    const token = jwt.sign({ id: 'user-1', email: 'a@example.com', role: 'DOSEN' }, process.env.JWT_SECRET!);
    const next = jest.fn();
    const req: any = { headers: { authorization: `Bearer ${token}` } };

    verifyToken(req, mockRes(), next);
    expect(req.user.id).toBe('user-1');
    expect(next).toHaveBeenCalled();

    const resMissing = mockRes();
    verifyToken({ headers: {} } as any, resMissing, jest.fn());
    expect(resMissing.status).toHaveBeenCalledWith(401);

    const resInvalid = mockRes();
    verifyToken({ headers: { authorization: 'Bearer invalid' } } as any, resInvalid, jest.fn());
    expect(resInvalid.status).toHaveBeenCalledWith(401);
  });

  it('requireRole menerima role dasar dan jabatan struktural', () => {
    const next = jest.fn();
    requireRole(['dosen'])({ user: { role: 'DOSEN' } } as any, mockRes(), next);
    expect(next).toHaveBeenCalled();

    const kajurNext = jest.fn();
    requireRole(['kajur'])({ user: { role: 'DOSEN', jabatan: { is_kajur: true } } } as any, mockRes(), kajurNext);
    expect(kajurNext).toHaveBeenCalled();

    const res = mockRes();
    requireRole(['admin'])({ user: { role: 'DOSEN', jabatan: { is_kajur: false, is_kaprodi: false } } } as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('errorHandler mengembalikan status 500', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();

    errorHandler(new Error('server error'), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', error: 'server error' });
    spy.mockRestore();
  });
});
