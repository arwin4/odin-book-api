const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { checkSchema } = require('express-validator');
const Comment = require('../models/comment');
const Post = require('../models/post');
const commentSchema = require('../express-validator-schemas/comment');
const respondOnValidationError = require('../utils/respondOnValidationError');

exports.getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  try {
    const foundComments = await Comment.aggregate([
      { $match: { post: new mongoose.Types.ObjectId(postId) } },
      { $sort: { dateCreated: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
    ]);

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
              id: comment.author._id,
              attributes: {
                username: comment.author.username,
                firstName: comment.author.firstName,
                avatarUrl: comment.author.avatarUrl,
              },
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

exports.postComment = [
  asyncHandler(async (req, res, next) => {
    // Set json to req.body for checkSchema
    const { attributes } = req.body.data;
    req.body = attributes;
    return next();
  }),

  checkSchema(commentSchema),

  asyncHandler(async (req, res, next) => {
    respondOnValidationError(req, res, next);
  }),

  asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    let comment;

    try {
      comment = new Comment({
        post: postId,
        content: req.body.content,
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
  }),
];

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

  return res.sendStatus(204);
});
