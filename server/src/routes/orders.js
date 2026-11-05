const express = require('express');
const Order = require('../models/Order');
const { requireAuth, fail } = require('../middleware/auth');
const { placeOrder } = require('../services/orderService');

const router = express.Router();
router.use(requireAuth);

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

router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find({ customer_id: req.user._id }).sort({ createdAt: -1 });
    return res.json({ data: orders });
  } catch (e) {
    return next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer_id: req.user._id }).catch(() => null);
    if (!order) return next(fail(404, 'ORDER_NOT_FOUND', 'No such order'));
    return res.json({ data: order });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
