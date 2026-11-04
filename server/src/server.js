require('dotenv').config();
const createApp = require('./app');
const connectDb = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDb(process.env.MONGO_URI);
  createApp().listen(PORT, () => {
    console.log(`BookNest API listening on port ${PORT}`);
  });
})();
