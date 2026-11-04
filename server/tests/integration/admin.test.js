const { app, request, makeUser, makeBook, auth } = require('../helpers');

// US-07 / FR-011, US-08 / SEC-002
describe('Admin', () => {
  let adminToken, customerToken;

  beforeEach(async () => {
    ({ token: adminToken } = await makeUser({ role: 'admin', email: 'admin@test.com' }));
    ({ token: customerToken } = await makeUser({ role: 'customer', email: 'cust@test.com' }));
  });

  describe('US-08 / SEC-002: role-based access  [ST-SEC-05..08]', () => {
    it('refuses a customer token with 403, not 404 or 200', async () => {
      const res = await request(app).get('/api/v1/admin/books').set(auth(customerToken));
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a customer creating a book', async () => {
      const res = await request(app).post('/api/v1/admin/books')
        .set(auth(customerToken)).send({ title: 'X', author: 'Y', price: 1 });
      expect(res.status).toBe(403);
    });

    it('refuses a customer disabling a book', async () => {
      const book = await makeBook();
      const res = await request(app).delete(`/api/v1/admin/books/${book._id}`).set(auth(customerToken));
      expect(res.status).toBe(403);
    });

    it('refuses an unauthenticated request with 401', async () => {
      expect((await request(app).get('/api/v1/admin/books')).status).toBe(401);
    });

    it('allows an admin token', async () => {
      expect((await request(app).get('/api/v1/admin/books').set(auth(adminToken))).status).toBe(200);
    });
  });

  describe('US-07: catalog management  [IT-ADM-01..06]', () => {
    it('creates a listing', async () => {
      const res = await request(app).post('/api/v1/admin/books').set(auth(adminToken))
        .send({ title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', price: 599, stock_qty: 12 });

      expect(res.status).toBe(201);
      expect(res.body.data.is_active).toBe(true);
    });

    it('rejects a creation missing the title', async () => {
      const res = await request(app).post('/api/v1/admin/books').set(auth(adminToken))
        .send({ author: 'Nobody', price: 100 });
      expect(res.status).toBe(400);
    });

    it('rejects a negative price', async () => {
      const res = await request(app).post('/api/v1/admin/books').set(auth(adminToken))
        .send({ title: 'X', author: 'Y', price: -5 });
      expect(res.status).toBe(400);
    });

    it('updates stock quantity', async () => {
      const book = await makeBook({ stock_qty: 2 });
      const res = await request(app).patch(`/api/v1/admin/books/${book._id}`)
        .set(auth(adminToken)).send({ stock_qty: 40 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock_qty).toBe(40);
    });

    it('rejects a fractional stock quantity', async () => {
      const book = await makeBook();
      const res = await request(app).patch(`/api/v1/admin/books/${book._id}`)
        .set(auth(adminToken)).send({ stock_qty: 2.5 });
      expect(res.status).toBe(400);
    });

    it('disabling removes the book from customer search immediately', async () => {
      const book = await makeBook({ title: 'Disappearing Act' });
      expect((await request(app).get('/api/v1/books?q=Disappearing')).body.data).toHaveLength(1);

      await request(app).delete(`/api/v1/admin/books/${book._id}`).set(auth(adminToken));

      expect((await request(app).get('/api/v1/books?q=Disappearing')).body.data).toHaveLength(0);
    });

    it('still shows disabled books to the admin', async () => {
      const book = await makeBook();
      await request(app).delete(`/api/v1/admin/books/${book._id}`).set(auth(adminToken));

      const res = await request(app).get('/api/v1/admin/books').set(auth(adminToken));
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].is_active).toBe(false);
    });

    it('404s when updating an unknown book', async () => {
      const res = await request(app).patch('/api/v1/admin/books/64b7c0000000000000000000')
        .set(auth(adminToken)).send({ price: 10 });
      expect(res.status).toBe(404);
    });
  });
});
