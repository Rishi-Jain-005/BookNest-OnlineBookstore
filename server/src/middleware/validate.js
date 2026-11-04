const { fail } = require('./auth');

/**
 * SEC-003 — minimal schema validation. Each rule returns an error string or null.
 */
function validateBody(rules) {
  return function (req, _res, next) {
    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const message = rule(req.body?.[field], req.body);
      if (message) errors[field] = message;
    }
    if (Object.keys(errors).length) {
      const err = fail(400, 'VALIDATION_ERROR', 'One or more fields are invalid');
      err.details = errors;
      return next(err);
    }
    return next();
  };
}

const required = label => v =>
  v === undefined || v === null || String(v).trim() === '' ? `${label} is required` : null;

const minLength = (label, n) => v =>
  v !== undefined && String(v).length < n ? `${label} must be at least ${n} characters` : null;

const isEmail = v =>
  v !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? 'Must be a valid email address' : null;

const isPositiveNumber = label => v =>
  v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0) ? `${label} must be a number of 0 or more` : null;

const compose = (...rules) => (v, body) => {
  for (const r of rules) {
    const msg = r(v, body);
    if (msg) return msg;
  }
  return null;
};

module.exports = { validateBody, required, minLength, isEmail, isPositiveNumber, compose };
