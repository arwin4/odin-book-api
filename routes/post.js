const express = require('express');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const verifyAuth = require('../passport/verifyAuth');

const router = express.Router();

/* == POSTS == */
// Get 50 latest posts
router.get('/', verifyAuth, postController.getPosts);

// Post new post
router.post('/', verifyAuth, postController.postPost);

/* == COMMENTS == */

// Get all comments on a post
router.get('/:postId/comments', verifyAuth, commentController.getComments);

// Post new comment
router.post('/:postId/comments', verifyAuth, commentController.postComment);

module.exports = router;
