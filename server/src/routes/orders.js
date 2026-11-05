const express = require('express');
const Order = require('../models/Order');
const { requireAuth, fail } = require('../middleware/auth');
const { placeOrder } = require('../services/orderService');

const router = express.Router();
router.use(requireAuth);

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** US-09 / US-17 — checkout with a gateway token and optional Idempotency-Key header. */
router.post('/', async (req, res, next) => {
  try {
    const { paymentToken } = req.body || {};
    if (typeof paymentToken !== 'string' || !paymentToken.trim()) {
      return next(fail(400, 'VALIDATION_ERROR', 'paymentToken is required'));
    }
    if (/^\d{12,19}$/.test(paymentToken.replace(/[\s-]/g, ''))) {
      return next(fail(400, 'VALIDATION_ERROR', 'Card numbers are not accepted; send a gateway token'));
    }
    const idempotencyKey = req.get('Idempotency-Key') || undefined;
    const { order, replayed } = await placeOrder({ user: req.user, idempotencyKey, paymentToken });
    return res.status(replayed ? 200 : 201).json({ data: order, replayed });
  } catch (e) {
    return next(e);
  }
});

/** US-12 / FR-010 — own order history, newest first, paged (default 12, max 50). */
router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return next(fail(400, 'VALIDATION_ERROR', 'page and limit must be whole numbers (limit 1-50)'));
    }
    const filter = { customer_id: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter)
    ]);
    return res.json({ data: orders, page, limit, total });
  } catch (e) {
    return next(e);
  }
});

/** US-11 / FR-009 — one of the customer's own orders; another customer's id is a 404. */
router.get('/:id', async (req, res, next) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) {
      return next(fail(400, 'VALIDATION_ERROR', 'Malformed order id'));
    }
    const order = await Order.findOne({ _id: req.params.id, customer_id: req.user._id });
    if (!order) return next(fail(404, 'ORDER_NOT_FOUND', 'No such order'));
    return res.json({ data: order });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
