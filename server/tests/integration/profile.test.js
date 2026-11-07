jest.mock('../../src/services/securityLog', () => ({ logSecurityEvent: jest.fn() }));
const { logSecurityEvent } = require('../../src/services/securityLog');
const { app, request, makeUser, auth } = require('../helpers');

describe('US-24 / FR-016: profile and password', () => {
  let token, password;
  beforeEach(async () => {
    logSecurityEvent.mockClear();
    ({ token, password } = await makeUser({ email: 'me@test.com' }));
  });

  it('updates the name', async () => {
    const res = await request(app).put('/api/v1/auth/me').set(auth(token)).send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
  });

  it('refuses to change the email (SRS FR-016) and leaves it unchanged', async () => {
    const res = await request(app).put('/api/v1/auth/me').set(auth(token)).send({ email: 'other@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FIELD_NOT_ALLOWED');
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.body.user.email).toBe('me@test.com');
  });

  it('refuses to change the role', async () => {
    const res = await request(app).put('/api/v1/auth/me').set(auth(token)).send({ role: 'admin' });
    expect(res.status).toBe(400);
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.body.user.role).toBe('customer');
  });

  it('refuses an empty name', async () => {
    const res = await request(app).put('/api/v1/auth/me').set(auth(token)).send({ name: '   ' });
    expect(res.status).toBe(400);
  });



  it('requires authentication', async () => {
    expect((await request(app).put('/api/v1/auth/me').send({ name: 'X' })).status).toBe(401);
  });

  it('changes the password; the old one stops working and the new one logs in', async () => {
    const res = await request(app).put('/api/v1/auth/me/password').set(auth(token))
      .send({ currentPassword: password, newPassword: 'brandnew123' });
    expect(res.status).toBe(200);
    const oldLogin = await request(app).post('/api/v1/auth/login').send({ email: 'me@test.com', password });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/api/v1/auth/login').send({ email: 'me@test.com', password: 'brandnew123' });
    expect(newLogin.status).toBe(200);
  });

  it('refuses a wrong current password and logs a security event', async () => {
    const res = await request(app).put('/api/v1/auth/me/password').set(auth(token))
      .send({ currentPassword: 'wrong-password', newPassword: 'brandnew123' });
    expect(res.status).toBe(400);
    expect(logSecurityEvent).toHaveBeenCalledWith('PASSWORD_CHANGE_FAILED', expect.any(Object));
  });

  it('refuses a new password shorter than 8 characters', async () => {
    const res = await request(app).put('/api/v1/auth/me/password').set(auth(token))
      .send({ currentPassword: password, newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  // US-16 / SEC-006
  it('SEC-06: a failed login writes a LOGIN_FAILED security event without the password', async () => {
    await request(app).post('/api/v1/auth/login').send({ email: 'me@test.com', password: 'bad-password' });
    expect(logSecurityEvent).toHaveBeenCalledWith('LOGIN_FAILED', expect.objectContaining({ email: 'me@test.com' }));
    expect(JSON.stringify(logSecurityEvent.mock.calls)).not.toContain('bad-password');
  });
});
