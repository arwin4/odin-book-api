const express = require('express');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const likesController = require('../controllers/likesController');
const verifyAuth = require('../passport/verifyAuth');
const checkPostExistence = require('../middleware/checkPostExistence');

const router = express.Router();

/* == POSTS == */
// Get 50 latest posts
router.get('/', verifyAuth, postController.getPosts);

// Get post by ID
router.get(
  '/:postId',
  verifyAuth,
  checkPostExistence,
  postController.getPostById,
);

// Post new post
router.post('/', verifyAuth, postController.postPost);

// Delete post and its comments
router.delete(
  '/:postId',
  verifyAuth,
  checkPostExistence,
  postController.deletePost,
);

/* == COMMENTS == */

// Get all comments on a post
router.get(
  '/:postId/comments',
  verifyAuth,
  checkPostExistence,
  commentController.getComments,
);

// Post new comment
router.post(
  '/:postId/comments',
  verifyAuth,
  checkPostExistence,
  commentController.postComment,
);

// Delete comment by ID
router.delete(
  '/:postId/comments/:commentId',
  verifyAuth,
  checkPostExistence,
  commentController.deleteComment,
);

/* == LIKES == */
// Like a post
router.post(
  '/:postId/likes',
  verifyAuth,
  checkPostExistence,
  likesController.addLike,
);

// Remove one's like from a post
// router.delete(
//   '/:postId/likes',
//   verifyAuth,
//   checkPostExistence,
//   likesController.deleteLike,
// );

module.exports = router;
