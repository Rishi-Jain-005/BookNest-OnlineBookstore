const { app, request, makeUser, makeBook, auth } = require('../helpers');
const Cart = require('../../src/models/Cart');
const Book = require('../../src/models/Book');
const Order = require('../../src/models/Order');
const Payment = require('../../src/models/Payment');

async function cartWith(user, book, quantity = 2) {
  return Cart.create({ customer_id: user._id, items: [{ book_id: book._id, quantity, unit_price: book.price }] });
}

const checkout = (token, body = { paymentToken: 'tok_ok' }, headers = {}) =>
  request(app).post('/api/v1/orders').set(auth(token)).set(headers).send(body);

describe('Checkout (US-09, US-10, US-17)', () => {
  test('IT-ORD-01 success creates an order, decrements stock and empties the cart', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ stock_qty: 5 });
    await cartWith(user, book, 2);

    const res = await checkout(token);

    expect(res.status).toBe(201);
    expect(res.body.data.order_number).toMatch(/^BN-\d{8}-[0-9A-F]{8}$/);
    expect(res.body.data.total).toBe(900);
    expect(res.body.data.payment_status).toBe('SUCCESS');
    expect((await Book.findById(book._id)).stock_qty).toBe(3);
    expect((await Cart.findOne({ customer_id: user._id })).items).toHaveLength(0);
    expect(await Payment.countDocuments()).toBe(1);
  });

  test('IT-ORD-02 empty cart is rejected with 400', async () => {
    const { token } = await makeUser();
    const res = await checkout(token);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_CART');
  });

  test('IT-ORD-03 declined payment returns 402, restores stock, keeps the cart, creates no order', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ stock_qty: 5 });
    await cartWith(user, book, 2);

    const res = await checkout(token, { paymentToken: 'tok_fail' });

    expect(res.status).toBe(402);
    expect((await Book.findById(book._id)).stock_qty).toBe(5);
    expect((await Cart.findOne({ customer_id: user._id })).items).toHaveLength(1);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('IT-ORD-04 same Idempotency-Key twice creates one order and charges once', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ stock_qty: 5 });
    await cartWith(user, book, 2);

    const first = await checkout(token, undefined, { 'Idempotency-Key': 'key-1' });
    const second = await checkout(token, undefined, { 'Idempotency-Key': 'key-1' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.replayed).toBe(true);
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(await Order.countDocuments()).toBe(1);
    expect(await Payment.countDocuments()).toBe(1);
    expect((await Book.findById(book._id)).stock_qty).toBe(3);
  });

  test('IT-ORD-05 stock that dropped below the cart quantity returns 409 and changes nothing', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ stock_qty: 5 });
    await cartWith(user, book, 4);
    await Book.updateOne({ _id: book._id }, { stock_qty: 1 });

    const res = await checkout(token);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect((await Book.findById(book._id)).stock_qty).toBe(1);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('IT-ORD-06 checkout without a token returns 401', async () => {
    const res = await request(app).post('/api/v1/orders').send({ paymentToken: 'tok_ok' });
    expect(res.status).toBe(401);
  });

  test('IT-ORD-07 two orders get different order numbers', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const book = await makeBook({ stock_qty: 10 });
    await cartWith(a.user, book, 1);
    await cartWith(b.user, book, 1);

    const [r1, r2] = await Promise.all([checkout(a.token), checkout(b.token)]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r1.body.data.order_number).not.toBe(r2.body.data.order_number);
  });

  test('IT-ORD-08 a customer cannot read another customer\'s order', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const book = await makeBook();
    await cartWith(a.user, book, 1);
    const placed = await checkout(a.token);

    const res = await request(app).get(`/api/v1/orders/${placed.body.data._id}`).set(auth(b.token));

    expect(res.status).toBe(404);
  });

  test('IT-ORD-09 a raw card number is rejected (SEC-005)', async () => {
    const { user, token } = await makeUser();
    await cartWith(user, await makeBook(), 1);
    const res = await checkout(token, { paymentToken: '4242 4242 4242 4242' });
    expect(res.status).toBe(400);
    expect(await Payment.countDocuments()).toBe(0);
  });

  test('IT-ORD-10 gateway outage returns 502 and restores stock', async () => {
    const { user, token } = await makeUser();
    const book = await makeBook({ stock_qty: 5 });
    await cartWith(user, book, 2);

    const res = await checkout(token, { paymentToken: 'tok_error' });

    expect(res.status).toBe(502);
    expect((await Book.findById(book._id)).stock_qty).toBe(5);
  });

    test('IT-ORD-11 missing paymentToken returns 400', async () => {
    const { token } = await makeUser();
    const res = await request(app).post('/api/v1/orders').set(auth(token)).send({});
    expect(res.status).toBe(400);
  });

  test('IT-ORD-12 customer lists only their own orders', async () => {
    const a = await makeUser({ email: 'a@test.com' });
    const b = await makeUser({ email: 'b@test.com' });
    const book = await makeBook({ stock_qty: 10 });
    await cartWith(a.user, book, 1);
    await checkout(a.token);

    const mine = await request(app).get('/api/v1/orders').set(auth(a.token));
    const theirs = await request(app).get('/api/v1/orders').set(auth(b.token));

    expect(mine.body.data).toHaveLength(1);
    expect(theirs.body.data).toHaveLength(0);
  });
});
