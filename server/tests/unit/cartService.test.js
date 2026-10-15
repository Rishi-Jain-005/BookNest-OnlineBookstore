const { calculateTotal, toCurrency } = require('../../src/services/cartService');

// US-06 / FR-006 — pure unit tests, no database. NFR-005 / NFR-006.
describe('cartService.calculateTotal  [UT-CART-01..07]', () => {
  it('returns 0 for an empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('handles a missing items argument', () => {
    expect(calculateTotal()).toBe(0);
  });

  it('calculates a single line', () => {
    expect(calculateTotal([{ quantity: 2, unit_price: 100 }])).toBe(200);
  });

  it('sums multiple lines', () => {
    expect(calculateTotal([
      { quantity: 2, unit_price: 100 },
      { quantity: 1, unit_price: 349.5 }
    ])).toBe(549.5);
  });

  it('rejects a negative quantity', () => {
    expect(() => calculateTotal([{ quantity: -1, unit_price: 100 }])).toThrow();
  });

  it('rejects a negative price', () => {
    expect(() => calculateTotal([{ quantity: 1, unit_price: -5 }])).toThrow();
  });

  it('rejects a non-numeric quantity', () => {
    expect(() => calculateTotal([{ quantity: 'two', unit_price: 100 }])).toThrow();
  });
});

describe('cartService.toCurrency  [UT-CART-08..09]', () => {
  it('rounds to two decimal places', () => {
    expect(toCurrency(10.005)).toBe(10.01);
  });

  it('removes floating point drift', () => {
    expect(toCurrency(0.1 + 0.2)).toBe(0.3);
  });
});
