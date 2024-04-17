const express = require('express');
const postController = require('../controllers/postController');

const router = express.Router();

// Get 50 latest posts
router.get('/', postController.getPosts);

module.exports = router;
