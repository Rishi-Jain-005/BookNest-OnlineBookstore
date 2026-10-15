const mongoose = require('mongoose');

/**
 * Connects to MongoDB. Models are defined by the schema owner (E-02).
 */
async function connectDb(uri) {
  if (!uri) throw new Error('MONGO_URI is not set');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDb;
