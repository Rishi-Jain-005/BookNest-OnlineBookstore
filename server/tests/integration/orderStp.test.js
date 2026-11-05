/**
 * Tests named with the Software Test Plan IDs (STP section 13.3) so the
 * test case document maps one to one: TC-TRK-*, TC-ORD-08/09/11, TC-SEC-04.
 */
const { app, request, makeUser, makeBook, auth } = require('../helpers');
const Order = require('../../src/models/Order');
const Payment = require('../../src/models/Payment');
const Cart = require('../../src/models/Cart');
const Book = require('../../src/models/Book');

let seq = 0;
async function makeOrder(user, book, overrides = {}) {
  seq += 1;
  return Order.create({
    order_number: `BN-20261105-${String(seq).padStart(8, '0')}`,
    customer_id: user._id,
    items: [{ book_id: book._id, title: book.title, quantity: 1, unit_price: book.price }],
    total: book.price,
    status: 'RECEIVED',
    payment_status: 'SUCCESS',
    ...overrides
  });
}

const cartWith = (user, book, quantity = 1) =>
  Cart.create({ customer_id: user._id, items: [{ book_id: book._id, quantity, unit_price: book.price }] });

const checkout = (token, body = { paymentToken: 'tok_ok' }) =>
  request(app).post('/api/v1/orders').set(auth(token)).send(body);

describe('Order tracking (UC-05, FR-009)', () => {
  test('TC-TRK-01 owner sees the status, items and total of an order', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook();
    const order = await makeOrder(user, book);

    const res = await request(app).get(`/api/v1/orders/${order._id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RECEIVED');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(450);
  });

  test('TC-TRK-02 another customer gets 404 for the order', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const order = await makeOrder(a.user, await makeBook());

    const res = await request(app).get(`/api/v1/orders/${order._id}`).set(auth(b.token));

    expect(res.status).toBe(404);
  });

  test('TC-TRK-03 malformed id is 400 and unknown id is 404', async () => {
    const { token } = await makeUser();

    const bad = await request(app).get('/api/v1/orders/123').set(auth(token));
    const unknown = await request(app).get('/api/v1/orders/000000000000000000000000').set(auth(token));

    expect(bad.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  test('TC-TRK-04 tracking without a token is 401', async () => {
    const { user } = await makeUser();
    const order = await makeOrder(user, await makeBook());

    const res = await request(app).get(`/api/v1/orders/${order._id}`);

    expect(res.status).toBe(401);
  });

  test('TC-TRK-06 an order keeps its original prices after the book price changes', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ price: 450 });
    const order = await makeOrder(user, book);
    await Book.updateOne({ _id: book._id }, { price: 250 });

    const res = await request(app).get(`/api/v1/orders/${order._id}`).set(auth(token));

    expect(res.body.data.items[0].unit_price).toBe(450);
    expect(res.body.data.total).toBe(450);
  });
});

describe('Order history (UC-08, FR-010)', () => {
  async function twelveOrdersFor(user, book) {
    for (let i = 0; i < 12; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await makeOrder(user, book, { createdAt: new Date(Date.UTC(2026, 9, 1, 0, 0, i)) });
    }
  }

  test('TC-TRK-07 history is own orders only, newest first, paged', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const book = await makeBook();
    await twelveOrdersFor(a.user, book);
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await makeOrder(b.user, book);
    }

    const res = await request(app).get('/api/v1/orders?page=1&limit=5').set(auth(a.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.total).toBe(12);
    const times = res.body.data.map(o => new Date(o.createdAt).getTime());
    expect(times).toEqual([...times].sort((x, y) => y - x));
    expect(res.body.data.every(o => String(o.customer_id) === String(a.user._id))).toBe(true);
  });

  test('TC-TRK-08 page 3 has the last 2 orders and page 4 is empty', async () => {
    const { user, token } = await makeUser();
    await twelveOrdersFor(user, await makeBook());

    const p3 = await request(app).get('/api/v1/orders?page=3&limit=5').set(auth(token));
    const p4 = await request(app).get('/api/v1/orders?page=4&limit=5').set(auth(token));

    expect(p3.body.data).toHaveLength(2);
    expect(p4.body.data).toHaveLength(0);
  });

  test('TC-TRK-09 a new customer has an empty history', async () => {
    const { token } = await makeUser();

    const res = await request(app).get('/api/v1/orders').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('TC-TRK-10 invalid page or limit is rejected with 400', async () => {
    const { token } = await makeUser();

    for (const q of ['page=0', 'page=abc', 'limit=0', 'limit=51']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get(`/api/v1/orders?${q}`).set(auth(token));
      expect(res.status).toBe(400);
    }
  });
});

describe('Checkout rules from the STP', () => {
  test('TC-ORD-08 two buyers of the last copy: one order, one refusal, stock never negative', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const book = await makeBook({ stock_qty: 1 });
    await cartWith(a.user, book);
    await cartWith(b.user, book);

    const [r1, r2] = await Promise.all([checkout(a.token), checkout(b.token)]);

    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
    expect((await Book.findById(book._id)).stock_qty).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
    expect(await Payment.countDocuments()).toBe(1);
  });

  test('TC-ORD-09 client-supplied price and total are ignored', async () => {
    const { user, token } = await makeUser();
    await cartWith(user, await makeBook({ price: 450 }), 1);

    const res = await checkout(token, { paymentToken: 'tok_ok', price: 1, total: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(450);
    expect((await Payment.findOne()).amount).toBe(450);
  });

  test('TC-ORD-11 a book disabled after being carted blocks checkout with 409', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook();
    await cartWith(user, book, 1);
    await Book.updateOne({ _id: book._id }, { is_active: false });

    const res = await checkout(token);

    expect(res.status).toBe(409);
    expect(await Payment.countDocuments()).toBe(0);
    expect(await Order.countDocuments()).toBe(0);
  });
});

describe('Payment data (SEC-005)', () => {
  test('TC-SEC-04 only status and gateway reference are stored, no card data or token', async () => {
    const { user, token } = await makeUser();
    await cartWith(user, await makeBook(), 1);

    const res = await checkout(token, { paymentToken: 'tok_secret_value' });

    expect(res.status).toBe(201);
    const payment = (await Payment.findOne()).toObject();
    const allowed = ['_id', 'order_id', 'amount', 'status', 'gateway_ref', 'createdAt', 'updatedAt', '__v'];
    expect(Object.keys(payment).every(k => allowed.includes(k))).toBe(true);
    expect(JSON.stringify(payment)).not.toContain('tok_secret_value');
    expect(JSON.stringify(res.body)).not.toContain('tok_secret_value');
  });
});
