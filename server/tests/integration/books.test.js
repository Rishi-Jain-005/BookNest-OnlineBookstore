const { app, request, makeBook } = require('../helpers');

// US-03 / FR-003, US-04 / FR-004
describe('Catalog', () => {
  describe('GET /api/v1/books  [IT-CAT-01..05]', () => {
    it('lists active books', async () => {
      await makeBook({ title: 'Dune', author: 'Frank Herbert' });
      const res = await request(app).get('/api/v1/books');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it('US-07: never shows a disabled listing to customers', async () => {
      await makeBook({ title: 'Hidden', is_active: false });
      const res = await request(app).get('/api/v1/books');
      expect(res.body.data).toHaveLength(0);
    });

    it('searches by title', async () => {
      await makeBook({ title: 'Dune', author: 'Frank Herbert' });
      await makeBook({ title: 'Neuromancer', author: 'William Gibson' });
      const res = await request(app).get('/api/v1/books?q=dune');
      expect(res.body.data.map(b => b.title)).toEqual(['Dune']);
    });

    it('searches by author, case-insensitively', async () => {
      await makeBook({ title: 'Dune', author: 'Frank Herbert' });
      const res = await request(app).get('/api/v1/books?q=HERBERT');
      expect(res.body.data).toHaveLength(1);
    });

    it('returns an empty set rather than an error when nothing matches', async () => {
      await makeBook();
      const res = await request(app).get('/api/v1/books?q=zzzznothing');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('treats regex characters in a query as literal text', async () => {
      await makeBook({ title: 'C++ Primer', author: 'Stanley Lippman' });
      const res = await request(app).get('/api/v1/books?q=' + encodeURIComponent('C++'));
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('US-04: filters  [IT-CAT-06..10]', () => {
    beforeEach(async () => {
      await makeBook({ title: 'Cheap', price: 100, stock_qty: 5, genre: 'Fiction' });
      await makeBook({ title: 'Mid', price: 500, stock_qty: 0, genre: 'Fiction' });
      await makeBook({ title: 'Dear', price: 900, stock_qty: 2, genre: 'Poetry' });
    });

    it('filters by minimum price', async () => {
      const res = await request(app).get('/api/v1/books?minPrice=500');
      expect(res.body.data.map(b => b.title).sort()).toEqual(['Dear', 'Mid']);
    });

    it('filters by maximum price', async () => {
      const res = await request(app).get('/api/v1/books?maxPrice=500');
      expect(res.body.data.map(b => b.title).sort()).toEqual(['Cheap', 'Mid']);
    });

    it('filters by a price range', async () => {
      const res = await request(app).get('/api/v1/books?minPrice=200&maxPrice=800');
      expect(res.body.data.map(b => b.title)).toEqual(['Mid']);
    });

    it('excludes out-of-stock books when inStock is on', async () => {
      const res = await request(app).get('/api/v1/books?inStock=true');
      expect(res.body.data.map(b => b.title).sort()).toEqual(['Cheap', 'Dear']);
    });

    it('combines a search with a filter rather than replacing it', async () => {
      const res = await request(app).get('/api/v1/books?genre=Fiction&inStock=true');
      expect(res.body.data.map(b => b.title)).toEqual(['Cheap']);
    });

    it('rejects a non-numeric price filter with 400', async () => {
      const res = await request(app).get('/api/v1/books?minPrice=abc');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/books/:id', () => {
    it('returns one book', async () => {
      const book = await makeBook();
      const res = await request(app).get(`/api/v1/books/${book._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Clean Code');
    });

    it('404s on an unknown id', async () => {
      expect((await request(app).get('/api/v1/books/64b7c0000000000000000000')).status).toBe(404);
    });

    it('404s on a malformed id instead of throwing a 500', async () => {
      expect((await request(app).get('/api/v1/books/not-an-id')).status).toBe(404);
    });
  });
});
