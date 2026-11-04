const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');      // US-01, US-02  — Dhanush
const bookRoutes = require('./routes/books');     // US-03, US-04  — Sahaj
const cartRoutes = require('./routes/cart');      // US-05, US-06  — Rishi
const adminRoutes = require('./routes/admin');    // US-07, US-08  — Lokesh

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  // SEC-003: strip Mongo operators from user input before it reaches a query.
  app.use(mongoSanitize());

  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/books', bookRoutes);
  app.use('/api/v1/cart', cartRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Sprint 2 mounts /api/v1/orders here.

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
