const express = require('express');
const postController = require('../controllers/postController');
const verifyAuth = require('../passport/verifyAuth');

const router = express.Router();

// Get 50 latest posts
router.get('/', verifyAuth, postController.getPosts);

// Post new post
router.post('/', verifyAuth, postController.postPost);

module.exports = router;
