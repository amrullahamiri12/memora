vi.mock('../lib/pg', () => ({
  query: vi.fn(async () => ({ rows: [{}] })),
}));

const request = require('supertest');
const app = require('../app');

describe('API (Express)', () => {
  it('GET /api/health returns ok when database responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/unknown returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('GET /api/auth/config returns feature flags', async () => {
    const res = await request(app).get('/api/auth/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailConfigured');
    expect(res.body).toHaveProperty('googleConfigured');
  });
});
