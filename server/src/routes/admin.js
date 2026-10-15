const express = require('express');
const Book = require('../models/Book');
const { requireAuth, requireAdmin, fail } = require('../middleware/auth');
const { validateBody, required, isPositiveNumber, compose } = require('../middleware/validate');

const router = express.Router();

// US-08 / SEC-002 — every route below is admin-only, enforced server-side.
router.use(requireAuth, requireAdmin);

/** US-07 / FR-011 — admin sees inactive listings too. */
router.get('/books', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const [data, total] = await Promise.all([
      Book.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Book.countDocuments()
    ]);
    return res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return next(e);
  }
});

router.post(
  '/books',
  validateBody({
    title: required('Title'),
    author: required('Author'),
    price: compose(required('Price'), isPositiveNumber('Price')),
    stock_qty: isPositiveNumber('Stock quantity')
  }),
  async (req, res, next) => {
    try {
      const { title, author, genre, price, stock_qty, isbn, description, low_stock_threshold } = req.body;
      const book = await Book.create({
        title, author, genre, isbn, description,
        price: Number(price),
        stock_qty: Number(stock_qty ?? 0),
        low_stock_threshold: Number(low_stock_threshold ?? 5),
        is_active: true
      });
      return res.status(201).json({ data: book });
    } catch (e) {
      return next(e);
    }
  }
);

router.patch('/books/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'author', 'genre', 'price', 'stock_qty', 'isbn', 'description', 'is_active', 'low_stock_threshold'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

    if (updates.price !== undefined && (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
      return next(fail(400, 'VALIDATION_ERROR', 'Price must be a number of 0 or more'));
    }
    if (updates.stock_qty !== undefined && (!Number.isInteger(Number(updates.stock_qty)) || Number(updates.stock_qty) < 0)) {
      return next(fail(400, 'VALIDATION_ERROR', 'Stock quantity must be a whole number of 0 or more'));
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).catch(() => null);
    if (!book) return next(fail(404, 'BOOK_NOT_FOUND', 'No such book'));
    return res.json({ data: book });
  } catch (e) {
    return next(e);
  }
});

/** US-07 — disabling is a soft delete; the listing leaves customer search. */
router.delete('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true }).catch(() => null);
    if (!book) return next(fail(404, 'BOOK_NOT_FOUND', 'No such book'));
    return res.json({ data: book });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
