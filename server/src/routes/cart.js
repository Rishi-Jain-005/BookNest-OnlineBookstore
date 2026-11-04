const express = require('express');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { requireAuth, fail } = require('../middleware/auth');
const { calculateTotal, toCurrency } = require('../services/cartService');

const router = express.Router();
router.use(requireAuth);

async function loadCart(userId) {
  let cart = await Cart.findOne({ customer_id: userId });
  if (!cart) cart = await Cart.create({ customer_id: userId, items: [] });
  return cart;
}

async function present(cart) {
  await cart.populate('items.book_id', 'title author price stock_qty is_active');
  return {
    id: cart._id,
    items: cart.items.map(i => ({
      itemId: i._id,
      book: i.book_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: toCurrency(i.quantity * i.unit_price)
    })),
    total: toCurrency(calculateTotal(cart.items))
  };
}

router.get('/', async (req, res, next) => {
  try {
    return res.json({ data: await present(await loadCart(req.user._id)) });
  } catch (e) {
    return next(e);
  }
});

/**
 * US-05 / FR-005 — add an available book. Business rule: only active,
 * in-stock books, and never more than available stock.
 */
router.post('/items', async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const quantity = Number(req.body.quantity ?? 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return next(fail(400, 'VALIDATION_ERROR', 'Quantity must be a whole number of 1 or more'));
    }

    const book = await Book.findOne({ _id: bookId, is_active: true }).catch(() => null);
    if (!book) return next(fail(404, 'BOOK_NOT_FOUND', 'No such book'));
    if (book.stock_qty < 1) return next(fail(409, 'OUT_OF_STOCK', 'That book is out of stock'));

    const cart = await loadCart(req.user._id);
    const existing = cart.items.find(i => String(i.book_id) === String(book._id));
    const desired = (existing?.quantity || 0) + quantity;

    if (desired > book.stock_qty) {
      return next(fail(409, 'INSUFFICIENT_STOCK', `Only ${book.stock_qty} in stock`));
    }

    if (existing) existing.quantity = desired;
    else cart.items.push({ book_id: book._id, quantity, unit_price: book.price });

    await cart.save();
    return res.status(201).json({ data: await present(cart) });
  } catch (e) {
    return next(e);
  }
});

/** US-05 — change quantity. Zero is rejected; removal is an explicit DELETE. */
router.patch('/items/:itemId', async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return next(fail(400, 'VALIDATION_ERROR', 'Quantity must be a whole number of 1 or more'));
    }

    const cart = await loadCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) return next(fail(404, 'ITEM_NOT_FOUND', 'No such cart item'));

    const book = await Book.findById(item.book_id);
    if (!book || !book.is_active) return next(fail(409, 'BOOK_UNAVAILABLE', 'That book is no longer available'));
    if (quantity > book.stock_qty) return next(fail(409, 'INSUFFICIENT_STOCK', `Only ${book.stock_qty} in stock`));

    item.quantity = quantity;
    await cart.save();
    return res.json({ data: await present(cart) });
  } catch (e) {
    return next(e);
  }
});

router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const cart = await loadCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) return next(fail(404, 'ITEM_NOT_FOUND', 'No such cart item'));
    item.deleteOne();
    await cart.save();
    return res.json({ data: await present(cart) });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
