const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../services/securityLog');

function fail(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/**
 * SEC-004 — rejects a missing, malformed, expired or tampered JWT with 401.
 */
async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(fail(401, 'UNAUTHENTICATED', 'Authentication required'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(fail(401, 'UNAUTHENTICATED', 'Account no longer exists'));
    req.user = user;
    return next();
  } catch (_e) {
    return next(fail(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

/**
 * SEC-002 — server-side role check. A customer token on an admin route is 403,
 * never merely hidden in the UI.
 */
function requireAdmin(req, _res, next) {
  if (!req.user) return next(fail(401, 'UNAUTHENTICATED', 'Authentication required'));
  if (req.user.role !== 'admin') {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      userId: String(req.user._id),
      method: req.method,
      path: req.originalUrl
    });
    return next(fail(403, 'FORBIDDEN', 'Administrator access required'));
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, fail };
