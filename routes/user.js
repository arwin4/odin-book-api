const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ username: 'testUser' });
});

// Get user
router.get('/:username', userController.getUser);

router.post('/', userController.signUp);

module.exports = router;
