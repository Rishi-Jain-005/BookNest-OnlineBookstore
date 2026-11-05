const crypto = require('crypto');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { fail } = require('../middleware/auth');
const { calculateTotal, toCurrency } = require('./cartService');
const { getGateway } = require('./paymentGateway');

/** US-10 / FR-008 — BN-YYYYMMDD-XXXXXXXX, random suffix; DB unique index is the backstop. */
function generateOrderNumber(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `BN-${day}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function releaseStock(reserved) {
  for (const r of reserved) await Book.updateOne({ _id: r.book_id }, { $inc: { stock_qty: r.quantity } });
}

/** Atomic per-book decrement; if any line cannot be met, undo the earlier ones. */
async function reserveStock(items) {
  const reserved = [];
  for (const item of items) {
    const book = await Book.findOneAndUpdate(
      { _id: item.book_id, is_active: true, stock_qty: { $gte: item.quantity } },
      { $inc: { stock_qty: -item.quantity } },
      { new: true }
    );
    if (!book) {
      await releaseStock(reserved);
      throw fail(409, 'INSUFFICIENT_STOCK', 'A book in your cart is no longer available in that quantity');
    }
    reserved.push({ book_id: item.book_id, quantity: item.quantity, title: book.title, unit_price: item.unit_price });
  }
  return reserved;
}

async function saveOrder(doc) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await Order.create({ ...doc, order_number: generateOrderNumber() });
    } catch (e) {
      if (!(e.code === 11000 && e.keyPattern && e.keyPattern.order_number)) throw e;
    }
  }
  throw fail(500, 'ORDER_NUMBER_FAILED', 'Could not allocate an order number');
}

/**
 * US-09 / US-17 — checkout. A repeated Idempotency-Key returns the original
 * order instead of creating a second one or charging twice.
 */
async function placeOrder({ user, idempotencyKey, paymentToken, gateway = getGateway() }) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ customer_id: user._id, idempotency_key: idempotencyKey });
    if (existing) return { order: existing, replayed: true };
  }

  const cart = await Cart.findOne({ customer_id: user._id });
  if (!cart || cart.items.length === 0) throw fail(400, 'EMPTY_CART', 'Your cart is empty');

  const total = toCurrency(calculateTotal(cart.items));
  const reserved = await reserveStock(cart.items);

  let result;
  try {
    result = await gateway.authorize({ amount: total, token: paymentToken });
  } catch (_e) {
    await releaseStock(reserved);
    throw fail(502, 'PAYMENT_UNAVAILABLE', 'Payment service unavailable, please retry');
  }

  if (result.status !== 'SUCCESS') {
    await releaseStock(reserved);
    throw fail(402, 'PAYMENT_FAILED', 'Payment was declined');
  }

  let order;
  try {
    order = await saveOrder({
      customer_id: user._id,
      items: reserved,
      total,
      status: 'RECEIVED',
      payment_status: 'SUCCESS',
      idempotency_key: idempotencyKey
    });
  } catch (e) {
    await releaseStock(reserved);
    throw e;
  }

  await Payment.create({ order_id: order._id, amount: total, status: 'SUCCESS', gateway_ref: result.gateway_ref });
  cart.items = [];
  await cart.save();

  return { order, replayed: false };
}

module.exports = { placeOrder, generateOrderNumber };
