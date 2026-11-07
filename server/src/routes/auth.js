const express = require('express');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const { issueToken } = require('../services/tokens');
const { logSecurityEvent } = require('../services/securityLog');
const { requireAuth, fail } = require('../middleware/auth');
const { validateBody, required, minLength, isEmail, compose } = require('../middleware/validate');

const router = express.Router();

// SEC-006 — blunt the obvious credential-stuffing path.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * US-01 / FR-001 — register. SEC-001: bcrypt hash, never plaintext.
 */
router.post(
  '/register',
  validateBody({
    name: required('Name'),
    email: compose(required('Email'), isEmail),
    password: compose(required('Password'), minLength('Password', 8))
  }),
  async (req, res, next) => {
    try {
      const email = String(req.body.email).toLowerCase().trim();

      if (await User.exists({ email })) {
        return next(fail(409, 'EMAIL_TAKEN', 'An account with that email already exists'));
      }

      const user = await User.create({
        name: req.body.name,
        email,
        password_hash: await User.hashPassword(req.body.password),
        // A client cannot promote itself to admin by sending role in the body.
        role: 'customer'
      });

      return res.status(201).json({ user, token: issueToken(user) });
    } catch (e) {
      return next(e);
    }
  }
);

/**
 * US-02 / FR-002 — login, returns a signed JWT.
 */
router.post(
  '/login',
  loginLimiter,
  validateBody({
    email: compose(required('Email'), isEmail),
    password: required('Password')
  }),
  async (req, res, next) => {
    try {
      const email = String(req.body.email).toLowerCase().trim();
      const user = await User.findOne({ email });
      const ok = user && (await user.verifyPassword(req.body.password));

      if (!ok) {
        logSecurityEvent('LOGIN_FAILED', { email, ip: req.ip });
        return next(fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect'));
      }

      return res.json({ user, token: issueToken(user) });
    } catch (e) {
      return next(e);
    }
  }
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

/**
 * US-24 / FR-016 — update own profile (name only; email and role cannot be changed).
 */
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    // FR-016: only the name can be changed here; email and role are fixed.
    if (req.body.email !== undefined || req.body.role !== undefined) {
      return next(fail(400, 'FIELD_NOT_ALLOWED', 'Email and role cannot be changed here'));
    }
    const name = req.body.name === undefined ? '' : String(req.body.name).trim();
    if (!name || name.length > 100) {
      return next(fail(400, 'VALIDATION_ERROR', 'Name is required (1-100 characters)'));
    }
    const user = await User.findById(req.user._id || req.user.id);
    user.name = name;
    await user.save();
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/**
 * US-24 / FR-016 — change password. The current password is required.
 */
router.put(
  '/me/password',
  requireAuth,
  validateBody({
    currentPassword: required('Current password'),
    newPassword: compose(required('New password'), minLength('New password', 8))
  }),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id || req.user.id);
      if (!(await user.verifyPassword(req.body.currentPassword))) {
        logSecurityEvent('PASSWORD_CHANGE_FAILED', { userId: String(user._id), ip: req.ip });
        return next(fail(400, 'INVALID_PASSWORD', 'Current password is incorrect'));
      }
      user.password_hash = await User.hashPassword(req.body.newPassword);
      await user.save();
      return res.json({ message: 'Password updated' });
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
