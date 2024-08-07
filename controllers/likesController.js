const asyncHandler = require('express-async-handler');
const Post = require('../models/post');

exports.addLike = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const post = await Post.findById(postId);

  if (post.likes.includes(userId)) {
    return res.sendStatus(409);
  }

  try {
    post.likes.push(userId);
    await post.save();
    return res.status(201).send({
      data: { type: 'likes', id: post.likes.at(-1) },
    });
  } catch (err) {
    return next(err);
  }
});

exports.deleteLike = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const post = await Post.findById(postId);

  if (!post.likes.includes(userId)) {
    return res.sendStatus(404);
  }

  try {
    post.likes = post.likes.filter(
      (like) => like.toString() !== userId.toString(),
    );
    await post.save();
    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
});
