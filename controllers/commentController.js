const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');
const Post = require('../models/post');

exports.getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  try {
    const foundComments = await Comment.find().where('post', postId);
    const resObj = { data: [] };
    foundComments.forEach((comment) => {
      resObj.data.push({
        type: 'comments',
        id: comment._id,
        attributes: {
          post: comment.post,
          author: comment.author,
          likes: comment.likes,
          content: comment.content,
          dateCreated: comment.dateCreated,
        },
      });
    });
    return res.send(resObj);
  } catch (err) {
    return next(err);
  }
});

exports.postComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  let comment;

  try {
    await Post.findById(postId);
  } catch (err) {
    res.sendStatus(404);
  }

  try {
    // TODO: add validation & sanitization
    comment = new Comment({
      post: postId,
      content: req.body.data.attributes.content,
      author: req.user._id,
    });
    await comment.save();

    res.status(201).send({
      data: {
        type: 'comments',
        id: comment._id,
        attributes: {
          post: comment.post,
          author: comment.author,
          content: comment.content,
          likes: comment.likes,
          dateCreated: comment.dateCreated,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;
  let comment;

  try {
    await Post.findById(postId);
    comment = await Comment.findById(commentId);
  } catch (err) {
    return res.sendStatus(404);
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.sendStatus(403);
  }

  try {
    await comment.deleteOne();
  } catch (err) {
    return next(err);
  }

  return res.sendStatus(200);
});
