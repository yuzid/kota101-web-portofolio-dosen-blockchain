/**
 * Jest global setup untuk test suite Staf TU & Kaprodi.
 * File ini dijalankan sebelum setiap test file.
 */

// Set environment variables untuk testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.AWS_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'ap-southeast-1';

jest.mock('mjml', () => ({
  __esModule: true,
  default: jest.fn(() => ({ html: '<html></html>', errors: [] })),
}), { virtual: true });

// Suppress console.error dalam test (optional, aktifkan jika butuh debug)
// jest.spyOn(console, 'error').mockImplementation(() => {});
