import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setSession } from '../api';

// US-02 / FR-002
export default function Login({ onSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
      setSession(token, user);
      onSession(user);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Sign in</h1>
      <p className="sub">Welcome back to BookNest.</p>
      {error && <div className="alert error">{error}</div>}
      <form className="panel" onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <span style={{ fontSize: '0.88rem' }}>No account? <Link to="/register">Create one</Link></span>
      </form>
    </>
  );
}
