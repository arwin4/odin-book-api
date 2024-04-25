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
          content: comment.content,
          dateCreated: comment.dateCreated,
        },
        relationships: {
          author: {
            data: {
              type: 'users',
              id: comment.author,
            },
          },
          post: {
            data: {
              type: 'posts',
              id: comment.post,
            },
          },
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
          content: comment.content,
          dateCreated: comment.dateCreated,
        },
        relationships: {
          author: {
            data: {
              type: 'users',
              id: comment.author,
            },
          },
          post: {
            data: {
              type: 'posts',
              id: comment.post,
            },
          },
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
