const { app, request, makeUser, auth } = require('../helpers');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

// US-01 / FR-001 / SEC-001, US-02 / FR-002 / SEC-004
describe('Auth', () => {
  describe('POST /api/v1/auth/register  [UT-AUTH-01..04]', () => {
    it('creates an account and returns a token', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Asha', email: 'asha@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('asha@test.com');
      expect(res.body.token).toBeTruthy();
    });

    it('SEC-001: stores a bcrypt hash, never the plaintext password', async () => {
      await request(app).post('/api/v1/auth/register')
        .send({ name: 'Asha', email: 'asha@test.com', password: 'password123' });

      const stored = await User.findOne({ email: 'asha@test.com' });
      expect(stored.password_hash).not.toBe('password123');
      expect(stored.password_hash.startsWith('$2')).toBe(true);
    });

    it('SEC-001: never returns the hash in the response body', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Asha', email: 'asha@test.com', password: 'password123' });

      expect(JSON.stringify(res.body)).not.toContain('password_hash');
    });

    it('rejects a duplicate email with 409', async () => {
      await makeUser({ email: 'taken@test.com' });
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Other', email: 'taken@test.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('rejects a malformed email with 400', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Asha', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.details.email).toBeTruthy();
    });

    it('rejects a password under 8 characters', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Asha', email: 'asha@test.com', password: 'short' });

      expect(res.status).toBe(400);
    });

    it('ignores a client attempt to self-assign the admin role', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Sneaky', email: 'sneaky@test.com', password: 'password123', role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('customer');
    });
  });

  describe('POST /api/v1/auth/login  [UT-AUTH-05..07]', () => {
    it('returns a signed JWT for correct credentials', async () => {
      await makeUser({ email: 'asha@test.com', password: 'password123' });
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: 'asha@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(jwt.decode(res.body.token).sub).toBeTruthy();
    });

    it('rejects a wrong password with 401', async () => {
      await makeUser({ email: 'asha@test.com', password: 'password123' });
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: 'asha@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('gives the same error for an unknown email, so accounts cannot be enumerated', async () => {
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('SEC-004: token validation  [ST-SEC-01..03]', () => {
    it('rejects a request with no token', async () => {
      expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    });

    it('rejects a tampered token', async () => {
      const { token } = await makeUser();
      const res = await request(app).get('/api/v1/auth/me').set(auth(token + 'x'));
      expect(res.status).toBe(401);
    });

    it('rejects an expired token', async () => {
      const { user } = await makeUser();
      const expired = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      const res = await request(app).get('/api/v1/auth/me').set(auth(expired));
      expect(res.status).toBe(401);
    });

    it('accepts a valid token', async () => {
      const { token } = await makeUser();
      const res = await request(app).get('/api/v1/auth/me').set(auth(token));
      expect(res.status).toBe(200);
    });
  });
});
