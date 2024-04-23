const asyncHandler = require('express-async-handler');
const Post = require('../models/post');

exports.getPosts = asyncHandler(async (req, res) => {
  const foundPosts = await Post.find().sort({ createdAt: -1 }).limit(50);

  const resObj = { data: [] };
  foundPosts.forEach((post) => {
    resObj.data.push({
      type: 'posts',
      id: post._id,
      attributes: {
        imageUrl: post.imageUrl,
        author: post.author,
        likes: post.likes,
        description: post.description,
        dateCreated: post.dateCreated,
      },
    });
  });
  return res.send(resObj);
});

exports.getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    res.sendStatus(404);
  }

  res.send({
    data: {
      type: 'posts',
      id: post.id,
      attributes: {
        imageUrl: post.imageUrl,
        author: post.author,
        likes: post.likes,
        description: post.description,
        dateCreated: post.dateCreated,
      },
    },
  });
});

exports.postPost = asyncHandler(async (req, res, next) => {
  let post;
  try {
    // TODO: add validation & sanitization
    post = new Post({
      imageUrl: req.body.imageUrl,
      author: req.user._id,
      description: req.body.description,
    });
    await post.save();
  } catch (error) {
    next(error);
  }

  res.status(201).send({
    data: {
      type: 'posts',
      id: post._id,
      attributes: {
        imageUrl: post.imageUrl,
        author: post.author,
        description: post.description,
        likes: post.likes,
        dateCreated: post.dateCreated,
      },
    },
  });
});
