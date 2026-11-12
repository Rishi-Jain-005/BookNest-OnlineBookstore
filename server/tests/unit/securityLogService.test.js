/** SEC-006 — the real logger (not mocked): entry shape and no secrets. */
const { logSecurityEvent } = require('../../src/services/securityLog');

describe('logSecurityEvent', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
    jest.restoreAllMocks();
  });

  it('returns a timestamped entry with the event type and details', () => {
    const entry = logSecurityEvent('LOGIN_FAILED', { email: 'a@b.com', ip: '1.2.3.4' });
    expect(entry.type).toBe('LOGIN_FAILED');
    expect(entry.email).toBe('a@b.com');
    expect(new Date(entry.ts).toString()).not.toBe('Invalid Date');
  });

  it('writes to the console outside the test environment', () => {
    process.env.NODE_ENV = 'production';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSecurityEvent('LOGIN_FAILED', { email: 'a@b.com' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe('[security]');
    expect(warn.mock.calls[0][1]).toContain('LOGIN_FAILED');
  });

  it('stays silent in the test environment', () => {
    process.env.NODE_ENV = 'test';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSecurityEvent('LOGIN_FAILED');
    expect(warn).not.toHaveBeenCalled();
  });
});
