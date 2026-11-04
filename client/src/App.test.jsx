import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

function mockFetch(routes) {
  return vi.fn(async url => {
    const path = String(url).replace('/api/v1', '').split('?')[0];
    const body = routes[path] ?? { data: [] };
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  });
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = mockFetch({
      '/books': { data: [{ _id: '1', title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', price: 599, stock_qty: 4 }] },
      '/books/genres': { data: ['Science Fiction'] }
    });
  });

  it('renders the brand', async () => {
    render(<App />);
    expect(screen.getAllByText(/booknest/i).length).toBeGreaterThan(0);
  });

  it('shows books returned by the catalogue API', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
  });

  it('shows sign-in rather than a cart when signed out', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/sign in/i)).toBeInTheDocument());
    expect(screen.queryByText(/^Cart/)).not.toBeInTheDocument();
  });
});
