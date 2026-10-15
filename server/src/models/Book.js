const mongoose = require('mongoose');

// SRS Appendix B — Book.
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    author: { type: String, required: true, trim: true, maxlength: 100 },
    genre: { type: String, trim: true, maxlength: 50, index: true },
    price: { type: Number, required: true, min: 0 },
    stock_qty: { type: Number, required: true, min: 0, default: 0 },
    is_active: { type: Boolean, required: true, default: true },
    isbn: { type: String, trim: true },
    description: { type: String, maxlength: 2000 },
    low_stock_threshold: { type: Number, default: 5, min: 0 }
  },
  { timestamps: true }
);

// US-03 / NFR-001: text index so search by title or author stays fast.
bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
