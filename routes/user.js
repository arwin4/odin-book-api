const express = require('express');

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({ name: 'test' });
});

module.exports = router;
