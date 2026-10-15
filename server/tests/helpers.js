const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const { issueToken } = require('../src/services/tokens');

const app = createApp();

async function makeUser({ role = 'customer', email = 'u@test.com', password = 'password123' } = {}) {
  const user = await User.create({
    name: 'Test User',
    email,
    password_hash: await User.hashPassword(password),
    role
  });
  return { user, token: issueToken(user), password };
}

function makeBook(overrides = {}) {
  return Book.create({
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Computer Science',
    price: 450,
    stock_qty: 10,
    is_active: true,
    ...overrides
  });
}

const auth = token => ({ Authorization: `Bearer ${token}` });

module.exports = { app, request, makeUser, makeBook, auth };
