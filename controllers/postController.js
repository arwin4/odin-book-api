const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const Comment = require('../models/comment');

exports.getPosts = asyncHandler(async (req, res) => {
  const foundPosts = await Post.find().sort({ dateCreated: -1 }).limit(50);

  const resObj = { data: [] };
  foundPosts.forEach((post) => {
    const likesArray = [];
    post.likes.forEach((like) => likesArray.push({ type: 'likes', id: like }));

    resObj.data.push({
      type: 'posts',
      id: post._id,
      attributes: {
        imageUrl: post.imageUrl,
        description: post.description,
        dateCreated: post.dateCreated,
      },
      relationships: {
        author: { data: { type: 'users', id: post.author } },
        likes: { data: likesArray },
      },
    });
  });
  return res.send(resObj);
});

exports.getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  const likesArray = [];
  post.likes.forEach((like) => likesArray.push({ type: 'likes', id: like }));

  res.send({
    data: {
      type: 'posts',
      id: post._id,
      attributes: {
        imageUrl: post.imageUrl,
        description: post.description,
        dateCreated: post.dateCreated,
      },
      relationships: {
        author: { data: { type: 'users', id: post.author } },
        likes: { data: likesArray },
      },
    },
  });
});

exports.postPost = asyncHandler(async (req, res, next) => {
  let post;
  try {
    // TODO: add validation & sanitization
    post = new Post({
      imageUrl: req.body.data.attributes.imageUrl,
      author: req.user._id,
      description: req.body.data.attributes.description,
    });
    await post.save();
  } catch (error) {
    next(error);
  }

  const likesArray = [];
  post.likes.forEach((like) => likesArray.push({ type: 'likes', id: like }));

  res.status(201).send({
    data: {
      type: 'posts',
      id: post._id,
      attributes: {
        imageUrl: post.imageUrl,
        description: post.description,
        dateCreated: post.dateCreated,
      },
      relationships: {
        author: {
          data: { type: 'users', id: post.author },
        },
        likes: { data: likesArray },
      },
    },
  });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (post.author.toString() !== req.user._id.toString()) {
    return res.sendStatus(403);
  }

  try {
    await post.deleteOne();
    await Comment.deleteMany({ post: postId });
  } catch (err) {
    return next(err);
  }

  return res.sendStatus(204);
});
