/**
 * Test database.
 *
 * Uses MONGO_URI when it is set — which is how CI runs (a MongoDB service
 * container) and how you run locally (`docker compose up -d mongo`).
 * Falls back to an in-memory MongoDB when it is not.
 */
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-ci-only';
  process.env.NODE_ENV = 'test';

  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }

  await mongoose.connect(uri);
});

afterEach(async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
