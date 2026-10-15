const mongoose = require('mongoose');

// SRS Appendix B — Payment. SEC-005: only the gateway reference is stored,
// never a card number, CVV or expiry.
const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], required: true },
    gateway_ref: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
