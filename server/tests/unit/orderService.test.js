const { MockGatewayAdapter } = require('../../src/services/paymentGateway');
const { generateOrderNumber } = require('../../src/services/orderService');

describe('MockGatewayAdapter (US-19)', () => {
  const gw = new MockGatewayAdapter();

  test('UT-PAY-01 approves a normal token and returns a gateway reference only', async () => {
    const r = await gw.authorize({ amount: 100, token: 'tok_ok' });
    expect(r.status).toBe('SUCCESS');
    expect(r.gateway_ref).toMatch(/^mock_/);
    expect(Object.keys(r).sort()).toEqual(['gateway_ref', 'status']);
  });

  test('UT-PAY-02 declines tok_fail', async () => {
    expect((await gw.authorize({ amount: 100, token: 'tok_fail' })).status).toBe('FAILED');
  });

  test('UT-PAY-03 declines a zero amount', async () => {
    expect((await gw.authorize({ amount: 0, token: 'tok_ok' })).status).toBe('FAILED');
  });

  test('UT-PAY-04 tok_error throws to simulate an outage', async () => {
    await expect(gw.authorize({ amount: 10, token: 'tok_error' })).rejects.toThrow();
  });
});

describe('generateOrderNumber (US-10)', () => {
  test('UT-ORD-01 matches BN-YYYYMMDD-XXXXXXXX', () => {
    expect(generateOrderNumber(new Date('2026-11-05T10:00:00Z'))).toMatch(/^BN-20261105-[0-9A-F]{8}$/);
  });

  test('UT-ORD-02 successive numbers differ', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateOrderNumber()));
    expect(set.size).toBe(200);
  });
});
