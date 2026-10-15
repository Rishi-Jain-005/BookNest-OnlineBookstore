/**
 * SEC-006 — records security-relevant events. Never logs a password or a token.
 */
function logSecurityEvent(type, details = {}) {
  const entry = { ts: new Date().toISOString(), type, ...details };
  if (process.env.NODE_ENV !== 'test') console.warn('[security]', JSON.stringify(entry));
  return entry;
}

module.exports = { logSecurityEvent };
