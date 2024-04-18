const express = require('express');
const userController = require('../controllers/userController');
const verifyAuth = require('../passport/verifyAuth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ username: 'testUser' });
});

// Get user
router.get('/:username', verifyAuth, userController.getUser);

// Sign up user
router.post('/', userController.signUp);

module.exports = router;
