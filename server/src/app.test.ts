import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('health endpoints', () => {
  const app = createApp();

  it('GET /health -> 200 {ok:true}', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /ready -> reports dependency checks', async () => {
    const res = await request(app).get('/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body.checks).toHaveProperty('inferenceKey');
    expect(res.body.checks).toHaveProperty('database');
  });

  it('unknown route -> 404 error envelope', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
    expect(res.body.error).toHaveProperty('requestId');
  });
});
