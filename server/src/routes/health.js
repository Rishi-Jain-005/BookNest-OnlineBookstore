const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'booknest-api', version: '0.1.0' });
});

module.exports = router;
