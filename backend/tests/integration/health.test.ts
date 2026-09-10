import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Health Check API Integration', () => {
  it('GET /api/health returns 200 and valid health payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.error).toBeNull();
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.service).toBe('recruitment-ats-api');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  it('GET /api/unknown-route returns 404 with standardized error format', async () => {
    const response = await request(app).get('/api/unknown-route-12345');

    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
