import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';

import { api, getUser, getToken, clearSession } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import './styles.css';

function Nav({ user, cartCount, onSignOut }) {
  const navigate = useNavigate();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">BookNest</NavLink>
        <NavLink to="/">Catalogue</NavLink>
        {user && <NavLink to="/cart">Cart{cartCount > 0 && <span className="badge">{cartCount}</span>}</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Inventory</NavLink>}
        <span className="spacer" />
        {user
          ? <><span style={{ color: '#5c6472', fontSize: '0.9rem' }}>{user.name}</span>
              <button className="ghost" onClick={() => { onSignOut(); navigate('/'); }}>Sign out</button></>
          : <><NavLink to="/login">Sign in</NavLink><NavLink to="/register">Register</NavLink></>}
      </div>
    </nav>
  );
}

function RequireAuth({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!getToken()) { setCartCount(0); return; }
    try {
      const { data } = await api('/cart');
      setCartCount(data.items.reduce((n, i) => n + i.quantity, 0));
    } catch { setCartCount(0); }
  }, []);

  useEffect(() => { refreshCart(); }, [user, refreshCart]);

  function signOut() { clearSession(); setUser(null); setCartCount(0); }

  return (
    <BrowserRouter>
      <Nav user={user} cartCount={cartCount} onSignOut={signOut} />
      <main>
        <Routes>
          <Route path="/" element={<Catalog onCartChange={refreshCart} />} />
          <Route path="/login" element={<Login onSession={setUser} />} />
          <Route path="/register" element={<Register onSession={setUser} />} />
          <Route path="/cart" element={<RequireAuth user={user}><Cart onCartChange={refreshCart} /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth user={user}><Admin /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
