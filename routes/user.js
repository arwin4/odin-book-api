const express = require('express');
const userController = require('../controllers/userController');
const followerController = require('../controllers/followerController');
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

/* == Following == */
// Follow user
router.post('/:username/followers', verifyAuth, followerController.addFollower);

// Unfollow user
router.delete(
  '/:username/followers',
  verifyAuth,
  followerController.deleteFollower,
);

module.exports = router;
