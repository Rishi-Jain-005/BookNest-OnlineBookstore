const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  // SEC-003: strip Mongo operators from user input before it reaches a query.
  app.use(mongoSanitize());

  app.use('/api/v1/health', healthRoutes);

  // Feature routers are mounted here by their owners:
  //   /api/v1/auth      US-01, US-02, US-16   Dhanush
  //   /api/v1/books     US-03, US-04          Sahaj
  //   /api/v1/cart      US-05, US-06          Rishi
  //   /api/v1/orders    US-09 – US-12, US-17  Rishi / Dhanush
  //   /api/v1/admin     US-07, US-08, US-13   Lokesh

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
