const { app, request, makeUser, makeBook, auth } = require('../helpers');

// US-05 / FR-005, US-06 / FR-006
describe('Cart', () => {
  let token, book;

  beforeEach(async () => {
    ({ token } = await makeUser({ email: 'shopper@test.com' }));
    book = await makeBook({ price: 450, stock_qty: 3 });
  });

  it('requires authentication  [ST-SEC-04]', async () => {
    expect((await request(app).get('/api/v1/cart')).status).toBe(401);
  });

  it('starts empty with a zero total', async () => {
    const res = await request(app).get('/api/v1/cart').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('adds an available book  [IT-CART-01]', async () => {
    const res = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(900);
  });

  it('snapshots the price at the time of adding', async () => {
    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ bookId: book._id, quantity: 1 });
    book.price = 999;
    await book.save();

    const res = await request(app).get('/api/v1/cart').set(auth(token));
    expect(res.body.data.total).toBe(450);
  });

  it('merges a repeat add into the existing line', async () => {
    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ bookId: book._id, quantity: 1 });
    const res = await request(app).post('/api/v1/cart/items').set(auth(token)).send({ bookId: book._id, quantity: 1 });

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
  });

  it('refuses to exceed available stock  [IT-CART-02]', async () => {
    const res = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 4 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('refuses an out-of-stock book  [IT-CART-03]', async () => {
    const empty = await makeBook({ title: 'Sold Out', stock_qty: 0 });
    const res = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: empty._id, quantity: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('refuses a disabled book', async () => {
    const hidden = await makeBook({ title: 'Hidden', is_active: false });
    const res = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: hidden._id, quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('rejects a quantity of zero  [UT-CART-10]', async () => {
    const res = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('updates a quantity and recalculates the total', async () => {
    const add = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 1 });
    const itemId = add.body.data.items[0].itemId;

    const res = await request(app).patch(`/api/v1/cart/items/${itemId}`)
      .set(auth(token)).send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1350);
  });

  it('refuses an update above available stock', async () => {
    const add = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 1 });

    const res = await request(app).patch(`/api/v1/cart/items/${add.body.data.items[0].itemId}`)
      .set(auth(token)).send({ quantity: 99 });

    expect(res.status).toBe(409);
  });

  it('removes an item', async () => {
    const add = await request(app).post('/api/v1/cart/items')
      .set(auth(token)).send({ bookId: book._id, quantity: 1 });

    const res = await request(app).delete(`/api/v1/cart/items/${add.body.data.items[0].itemId}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it('keeps one customer cart separate from another', async () => {
    const other = await makeUser({ email: 'other@test.com' });
    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ bookId: book._id, quantity: 1 });

    const res = await request(app).get('/api/v1/cart').set(auth(other.token));
    expect(res.body.data.items).toEqual([]);
  });
});
