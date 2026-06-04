const request = require('supertest');
const pg = require('../lib/pg');
const app = require('../app');

describe('API (Express)', () => {
  beforeEach(() => {
    vi.spyOn(pg, 'query').mockResolvedValue({ rows: [{ '?column?': 1 }] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health returns ok when database responds', async () => {
    const res = await request(app).get('/api/health');
    expect(pg.query).toHaveBeenCalledWith('SELECT 1');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/health returns 503 when database query fails', async () => {
    pg.query.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.database).toBe('disconnected');
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
