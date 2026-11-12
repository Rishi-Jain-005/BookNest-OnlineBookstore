/**
 * SEC-007 / AUTH-09 — login rate limiting.
 * The limiter is 10 requests per 15 minutes per IP outside NODE_ENV=test
 * (see DEVIATIONS.md). No database needed: the User model is mocked.
 */
const express = require('express');
const request = require('supertest');

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  exists: jest.fn().mockResolvedValue(false)
}));
jest.mock('../../src/services/securityLog', () => ({ logSecurityEvent: jest.fn() }));

function buildApp() {
  let app;
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production'; // the limiter reads this when the router is loaded
  jest.isolateModules(() => {
    const authRoutes = require('../../src/routes/auth');
    const errorHandler = require('../../src/middleware/errorHandler');
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    app.use(errorHandler);
  });
  process.env.NODE_ENV = previous;
  return app;
}

const body = { email: 'nobody@test.com', password: 'wrong-password' };

describe('SEC-007 login rate limit', () => {
  it('allows 10 attempts, then answers 429 on the 11th [AUTH-09]', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/v1/auth/login').send(body);
      expect(res.status).toBe(401);
    }
    const blocked = await request(app).post('/api/v1/auth/login').send(body);
    expect(blocked.status).toBe(429);
  });

  it('sends standard rate-limit headers', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/v1/auth/login').send(body);
    expect(res.headers['ratelimit-limit']).toBe('10');
    expect(res.headers['ratelimit-remaining']).toBe('9');
  });
});
