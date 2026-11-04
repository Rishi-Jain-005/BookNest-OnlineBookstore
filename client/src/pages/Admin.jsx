import React, { useEffect, useState } from 'react';
import { api } from '../api';

// US-07 / FR-011 — catalogue and stock management.  US-08 / SEC-002 — admin only.
const BLANK = { title: '', author: '', genre: '', price: '', stock_qty: '' };

export default function Admin() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      setBooks((await api('/admin/books?limit=100')).data);
    } catch (err) {
      setMessage({ type: 'error', text: err.status === 403 ? 'Administrator access required.' : err.message });
    }
  }
  useEffect(() => { load(); }, []);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api('/admin/books', {
        method: 'POST',
        body: { ...form, price: Number(form.price), stock_qty: Number(form.stock_qty || 0) }
      });
      setMessage({ type: 'ok', text: `“${form.title}” added to the catalogue.` });
      setForm(BLANK);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function setStock(book, stock_qty) {
    try { await api(`/admin/books/${book._id}`, { method: 'PATCH', body: { stock_qty } }); load(); }
    catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  async function toggle(book) {
    try {
      if (book.is_active) await api(`/admin/books/${book._id}`, { method: 'DELETE' });
      else await api(`/admin/books/${book._id}`, { method: 'PATCH', body: { is_active: true } });
      load();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  return (
    <>
      <h1>Inventory</h1>
      <p className="sub">Add listings, adjust stock, and disable books. Disabled books leave customer search immediately.</p>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <form className="panel wide" onSubmit={create} style={{ marginBottom: 26 }}>
        <label>Title<input value={form.title} onChange={set('title')} required /></label>
        <label>Author<input value={form.author} onChange={set('author')} required /></label>
        <label>Genre<input value={form.genre} onChange={set('genre')} /></label>
        <label>Price ₹<input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required /></label>
        <label>Stock<input type="number" min="0" value={form.stock_qty} onChange={set('stock_qty')} /></label>
        <button>Add book</button>
      </form>

      <table>
        <thead>
          <tr><th>Title</th><th>Author</th><th>Genre</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {books.map(b => (
            <tr key={b._id} style={{ opacity: b.is_active ? 1 : 0.5 }}>
              <td><strong>{b.title}</strong></td>
              <td>{b.author}</td>
              <td>{b.genre}</td>
              <td className="num">₹{b.price.toFixed(2)}</td>
              <td className="num">
                <input type="number" min="0" defaultValue={b.stock_qty} style={{ width: 76 }}
                       aria-label={`Stock for ${b.title}`}
                       onBlur={e => setStock(b, Number(e.target.value))} />
              </td>
              <td>{b.is_active ? 'Active' : 'Disabled'}</td>
              <td><button className="ghost" onClick={() => toggle(b)}>{b.is_active ? 'Disable' : 'Enable'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
