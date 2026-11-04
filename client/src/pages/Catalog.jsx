import React, { useEffect, useState, useCallback } from 'react';
import { api, getToken } from '../api';

// US-03 / FR-003 — browse and search.  US-04 / FR-004 — filter.
export default function Catalog({ onCartChange }) {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (genre) params.set('genre', genre);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', 'true');
    params.set('limit', '24');
    try {
      const res = await api(`/books?${params}`, { auth: false });
      setBooks(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [q, genre, minPrice, maxPrice, inStock]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api('/books/genres', { auth: false }).then(r => setGenres(r.data)).catch(() => {}); }, []);

  async function addToCart(book) {
    if (!getToken()) { setMessage({ type: 'error', text: 'Sign in to add books to your cart.' }); return; }
    try {
      await api('/cart/items', { method: 'POST', body: { bookId: book._id, quantity: 1 } });
      setMessage({ type: 'ok', text: `Added “${book.title}” to your cart.` });
      onCartChange?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <>
      <h1>Catalogue</h1>
      <p className="sub">Search by title, author or genre, then narrow by price and availability.</p>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="filters">
        <input type="search" placeholder="Search title, author or genre…" value={q}
               onChange={e => setQ(e.target.value)} aria-label="Search the catalogue" />
        <select value={genre} onChange={e => setGenre(e.target.value)} aria-label="Genre">
          <option value="">All genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <input type="number" min="0" placeholder="Min ₹" value={minPrice}
               onChange={e => setMinPrice(e.target.value)} style={{ width: 100 }} aria-label="Minimum price" />
        <input type="number" min="0" placeholder="Max ₹" value={maxPrice}
               onChange={e => setMaxPrice(e.target.value)} style={{ width: 100 }} aria-label="Maximum price" />
        <label className="check">
          <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
          In stock only
        </label>
      </div>

      {loading ? <p className="empty">Loading…</p>
        : books.length === 0 ? <p className="empty">No books match that search.</p>
        : (
          <div className="grid">
            {books.map(b => (
              <article className="card" key={b._id}>
                <span className="genre">{b.genre}</span>
                <h3>{b.title}</h3>
                <span className="author">{b.author}</span>
                <span className="price">₹{b.price.toFixed(2)}</span>
                <span className={`stock${b.stock_qty === 0 ? ' out' : ''}`}>
                  {b.stock_qty === 0 ? 'Out of stock' : `${b.stock_qty} in stock`}
                </span>
                <button disabled={b.stock_qty === 0} onClick={() => addToCart(b)}>Add to cart</button>
              </article>
            ))}
          </div>
        )}
    </>
  );
}
