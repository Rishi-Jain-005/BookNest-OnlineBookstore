/**
 * E-05 — repopulates a clean database.
 *   npm run seed
 *
 * Creates 51 books across 8 genres (4 deliberately out of stock so the
 * availability filter and the out-of-stock path can be demonstrated),
 * one admin account and one customer account.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const connectDb = require('../config/db');
const Book = require('../models/Book');
const User = require('../models/User');
const Cart = require('../models/Cart');
const books = require('./books.json');

const ADMIN = { name: 'Store Admin', email: 'admin@booknest.test', password: 'admin12345' };
const CUSTOMER = { name: 'Test Customer', email: 'customer@booknest.test', password: 'customer12345' };

async function seed() {
  await connectDb(process.env.MONGO_URI);

  await Promise.all([Book.deleteMany({}), User.deleteMany({}), Cart.deleteMany({})]);

  await Book.insertMany(books);

  await User.create({
    name: ADMIN.name,
    email: ADMIN.email,
    password_hash: await User.hashPassword(ADMIN.password),
    role: 'admin'
  });

  await User.create({
    name: CUSTOMER.name,
    email: CUSTOMER.email,
    password_hash: await User.hashPassword(CUSTOMER.password),
    role: 'customer'
  });

  console.log(`Seeded ${books.length} books.`);
  console.log(`Admin:    ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Customer: ${CUSTOMER.email} / ${CUSTOMER.password}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
