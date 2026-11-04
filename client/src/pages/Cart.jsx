import React, { useEffect, useState } from 'react';
import { api } from '../api';

// US-05 / FR-005 — quantities.  US-06 / FR-006 — total.
export default function Cart({ onCartChange }) {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try { setCart((await api('/cart')).data); } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function change(itemId, quantity) {
    setError('');
    try {
      setCart((await api(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } })).data);
      onCartChange?.();
    } catch (err) { setError(err.message); }
  }

  async function remove(itemId) {
    setError('');
    try {
      setCart((await api(`/cart/items/${itemId}`, { method: 'DELETE' })).data);
      onCartChange?.();
    } catch (err) { setError(err.message); }
  }

  if (!cart) return <p className="empty">Loading your cart…</p>;

  return (
    <>
      <h1>Your cart</h1>
      <p className="sub">Quantities are capped at available stock.</p>
      {error && <div className="alert error">{error}</div>}

      {cart.items.length === 0 ? <p className="empty">Your cart is empty.</p> : (
        <>
          <table>
            <thead>
              <tr><th>Book</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Line total</th><th /></tr>
            </thead>
            <tbody>
              {cart.items.map(i => (
                <tr key={i.itemId}>
                  <td><strong>{i.book?.title}</strong><br /><span className="author">{i.book?.author}</span></td>
                  <td className="num">₹{i.unit_price.toFixed(2)}</td>
                  <td className="num">
                    <input type="number" min="1" value={i.quantity} style={{ width: 70 }}
                           aria-label={`Quantity for ${i.book?.title}`}
                           onChange={e => change(i.itemId, Number(e.target.value))} />
                  </td>
                  <td className="num">₹{i.line_total.toFixed(2)}</td>
                  <td className="num"><button className="danger" onClick={() => remove(i.itemId)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total"><span>Total</span><span>₹{cart.total.toFixed(2)}</span></div>
          <p className="sub" style={{ textAlign: 'right' }}>Checkout arrives in Sprint 2.</p>
        </>
      )}
    </>
  );
}
