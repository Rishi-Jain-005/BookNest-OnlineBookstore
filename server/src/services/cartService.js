/**
 * US-06 / FR-006 — cart total. Kept as a pure function so it can be unit
 * tested without a database, which is what NFR-005 and NFR-006 ask for.
 */
function calculateTotal(items = []) {
  return items.reduce((sum, item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unit_price);
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty < 0 || price < 0) {
      throw Object.assign(new Error('Invalid cart item'), { status: 400, code: 'INVALID_CART_ITEM' });
    }
    return sum + qty * price;
  }, 0);
}

/** Rounds to 2 decimal places without floating point drift. */
function toCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = { calculateTotal, toCurrency };
