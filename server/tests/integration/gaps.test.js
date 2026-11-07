const { app, request, makeUser, makeBook, auth } = require('../helpers');

describe('Gap-closing tests', () => {
  let adminToken;
  beforeEach(async () => {
    ({ token: adminToken } = await makeUser({ role: 'admin', email: 'admin@test.com' }));
  });

  // TC-CAT-03 (FR-003)
  it('CAT-03: filters by genre, case-insensitively', async () => {
    await makeBook({ title: 'Fiction One', genre: 'Fiction' });
    await makeBook({ title: 'Poetry One', genre: 'Poetry' });
    const res = await request(app).get('/api/v1/books?genre=fiction');
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain('Fiction One');
    expect(body).not.toContain('Poetry One');
  });

  // TC-CAT-08 (SEC-003)
  it('CAT-08: operator objects in query are not executed and do not leak data', async () => {
    await makeBook({ title: 'Secret Title A', genre: 'Fiction' });
    for (const url of [
      '/api/v1/books?q[$ne]=x',
      '/api/v1/books?genre[$gt]=',
      '/api/v1/books?q=.*'
    ]) {
      const res = await request(app).get(url);
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) expect(JSON.stringify(res.body)).not.toContain('Secret Title A');
    }
  });

  // TC-SEC-05 (SEC-003)
  it('SEC-05: operator injection in login is refused', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: { $ne: '' }, password: { $ne: '' } });
    expect([400, 401]).toContain(res.status);
    expect(res.body.token).toBeUndefined();
  });

  // TC-ADM-03 (FR-011)
  it('ADM-03: admin edits a price and customers see the new price', async () => {
    const book = await makeBook({ title: 'Price Edit', price: 299 });
    const res = await request(app).patch(`/api/v1/admin/books/${book._id}`)
      .set(auth(adminToken)).send({ price: 349 });
    expect(res.status).toBe(200);
    const detail = await request(app).get(`/api/v1/books/${book._id}`);
    expect(JSON.stringify(detail.body)).toContain('349');
  });

  // TC-ADM-05 (SAF-002)  ASSUMPTION: negative stock_qty is rejected with 400
  it('ADM-05: stock cannot be set below zero', async () => {
    const book = await makeBook({ title: 'Stock Floor', stock_qty: 3 });
    const res = await request(app).patch(`/api/v1/admin/books/${book._id}`)
      .set(auth(adminToken)).send({ stock_qty: -1 });
    expect(res.status).toBe(400);
    const ok = await request(app).patch(`/api/v1/admin/books/${book._id}`)
      .set(auth(adminToken)).send({ stock_qty: 0 });
    expect(ok.status).toBe(200);
  });

  // TC-ADM-07 (FR-011)  ASSUMPTION: PATCH accepts { is_active: true }
  it('ADM-07: a disabled book can be re-enabled', async () => {
    const book = await makeBook({ title: 'Back Again' });
    await request(app).delete(`/api/v1/admin/books/${book._id}`).set(auth(adminToken));
    expect(JSON.stringify((await request(app).get('/api/v1/books')).body)).not.toContain('Back Again');
    const res = await request(app).patch(`/api/v1/admin/books/${book._id}`)
      .set(auth(adminToken)).send({ is_active: true });
    expect(res.status).toBe(200);
    expect(JSON.stringify((await request(app).get('/api/v1/books')).body)).toContain('Back Again');
  });
});