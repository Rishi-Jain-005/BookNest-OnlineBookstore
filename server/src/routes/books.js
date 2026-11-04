const express = require('express');
const Book = require('../models/Book');
const { fail } = require('../middleware/auth');

const router = express.Router();

/**
 * US-03 / FR-003 — browse and search by title, author or genre.
 * US-04 / FR-004 — filter by price range and availability.
 * NFR-001 — paginated and index-backed so response time stays bounded.
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, genre, minPrice, maxPrice, inStock } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

    // Inactive books are never visible to customers (US-07 acceptance criteria).
    const filter = { is_active: true };

    if (q) {
      const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ title: rx }, { author: rx }, { genre: rx }];
    }
    if (genre) filter.genre = new RegExp(`^${String(genre).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
      if (Object.values(filter.price).some(v => !Number.isFinite(v))) {
        return next(fail(400, 'VALIDATION_ERROR', 'Price filters must be numbers'));
      }
    }

    if (inStock === 'true') filter.stock_qty = { $gt: 0 };

    const [data, total] = await Promise.all([
      Book.find(filter).sort({ title: 1 }).skip((page - 1) * limit).limit(limit),
      Book.countDocuments(filter)
    ]);

    return res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return next(e);
  }
});

router.get('/genres', async (_req, res, next) => {
  try {
    return res.json({ data: (await Book.distinct('genre', { is_active: true })).filter(Boolean).sort() });
  } catch (e) {
    return next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, is_active: true });
    if (!book) return next(fail(404, 'BOOK_NOT_FOUND', 'No such book'));
    return res.json({ data: book });
  } catch (_e) {
    return next(fail(404, 'BOOK_NOT_FOUND', 'No such book'));
  }
});

module.exports = router;
