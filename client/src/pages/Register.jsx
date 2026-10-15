import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setSession } from '../api';

// US-01 / FR-001
export default function Register({ onSession }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(''); setFieldErrors({}); setBusy(true);
    try {
      const { token, user } = await api('/auth/register', { method: 'POST', body: form, auth: false });
      setSession(token, user);
      onSession(user);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.body?.error?.details || {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Create an account</h1>
      <p className="sub">You need an account to build a cart and place orders.</p>
      {error && <div className="alert error">{error}</div>}
      <form className="panel" onSubmit={submit}>
        <label>Name<input value={form.name} onChange={set('name')} required />
          {fieldErrors.name && <small style={{ color: '#a32020' }}>{fieldErrors.name}</small>}</label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required />
          {fieldErrors.email && <small style={{ color: '#a32020' }}>{fieldErrors.email}</small>}</label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required />
          {fieldErrors.password && <small style={{ color: '#a32020' }}>{fieldErrors.password}</small>}</label>
        <button disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <span style={{ fontSize: '0.88rem' }}>Already registered? <Link to="/login">Sign in</Link></span>
      </form>
    </>
  );
}
