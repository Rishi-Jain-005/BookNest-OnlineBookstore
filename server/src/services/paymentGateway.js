const crypto = require('crypto');

// US-19 — mockable payment adapter. SEC-005: only a gateway token goes in and
// only a gateway reference comes out; no card data is handled or stored.
// Test tokens: 'tok_fail' is declined, 'tok_error' simulates a gateway outage.
class MockGatewayAdapter {
  async authorize({ amount, token }) {
    const gateway_ref = `mock_${crypto.randomBytes(6).toString('hex')}`;
    if (token === 'tok_error') throw new Error('Gateway unavailable');
    if (token === 'tok_fail' || !(amount > 0)) return { status: 'FAILED', gateway_ref };
    return { status: 'SUCCESS', gateway_ref };
  }
}

let current = new MockGatewayAdapter();

module.exports = {
  MockGatewayAdapter,
  getGateway: () => current,
  setGateway: g => {
    current = g;
  }
};
