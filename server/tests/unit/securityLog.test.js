/**
 * SEC-006 / TC-SEC-02 — security event logging, and the 401/403 behaviour
 * of the auth middleware. No database needed: User is mocked.
 */
jest.mock('../../src/models/User', () => ({ findById: jest.fn() }));
jest.mock('../../src/services/securityLog', () => ({ logSecurityEvent: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { logSecurityEvent: mockedLog } = require('../../src/services/securityLog');
const { requireAuth, requireAdmin } = require('../../src/middleware/auth');

process.env.JWT_SECRET = 'unit-test-secret';

const run = (mw, req) =>
  new Promise(resolve => {
    mw(req, {}, err => resolve(err || null));
  });

beforeEach(() => jest.clearAllMocks());

describe('requireAdmin (SEC-002, SEC-006)', () => {
  it('returns 403 and logs UNAUTHORIZED_ACCESS for a customer', async () => {
    const err = await run(requireAdmin, {
      user: { _id: 'u1', role: 'customer' },
      method: 'POST',
      originalUrl: '/api/v1/admin/books'
    });
    expect(err.status).toBe(403);
    expect(mockedLog).toHaveBeenCalledWith('UNAUTHORIZED_ACCESS', {
      userId: 'u1',
      method: 'POST',
      path: '/api/v1/admin/books'
    });
  });

  it('returns 401 when there is no user', async () => {
    const err = await run(requireAdmin, {});
    expect(err.status).toBe(401);
  });

  it('lets an admin through without logging', async () => {
    const err = await run(requireAdmin, { user: { _id: 'a1', role: 'admin' } });
    expect(err).toBeNull();
    expect(mockedLog).not.toHaveBeenCalled();
  });
});

describe('requireAuth (SEC-004)', () => {
  it('returns 401 when the header is missing', async () => {
    const err = await run(requireAuth, { headers: {} });
    expect(err.status).toBe(401);
  });

  it('returns 401 for a tampered token', async () => {
    const good = jwt.sign({ sub: 'u1' }, process.env.JWT_SECRET);
    const err = await run(requireAuth, { headers: { authorization: `Bearer ${good}x` } });
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for an expired token', async () => {
    const old = jwt.sign({ sub: 'u1' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const err = await run(requireAuth, { headers: { authorization: `Bearer ${old}` } });
    expect(err.status).toBe(401);
  });

  it('returns 401 when the account no longer exists', async () => {
    User.findById.mockResolvedValue(null);
    const ok = jwt.sign({ sub: 'u1' }, process.env.JWT_SECRET);
    const err = await run(requireAuth, { headers: { authorization: `Bearer ${ok}` } });
    expect(err.status).toBe(401);
  });

  it('accepts a valid token and attaches the user', async () => {
    const user = { _id: 'u1', role: 'customer' };
    User.findById.mockResolvedValue(user);
    const ok = jwt.sign({ sub: 'u1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${ok}` } };
    expect(await run(requireAuth, req)).toBeNull();
    expect(req.user).toBe(user);
  });
});
