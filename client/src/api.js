const BASE = '/api/v1';

export function getToken() {
  try { return localStorage.getItem('booknest_token'); } catch { return null; }
}
export function setSession(token, user) {
  try {
    if (token) localStorage.setItem('booknest_token', token);
    if (user) localStorage.setItem('booknest_user', JSON.stringify(user));
  } catch { /* storage unavailable */ }
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('booknest_user') || 'null'); } catch { return null; }
}
export function clearSession() {
  try { localStorage.removeItem('booknest_token'); localStorage.removeItem('booknest_user'); } catch { /* ignore */ }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || 'Request failed'), { status: res.status, body: data });
  return data;
}
