const asyncHandler = require('express-async-handler');
const Post = require('../models/post');

exports.getPosts = asyncHandler(async (req, res) => {
  const foundPosts = await Post.find().sort({ createdAt: -1 }).limit(50);

  const latestPosts = [];

  foundPosts.forEach((post) => {
    latestPosts.push({
      data: [
        {
          type: 'posts',
          id: post._id,
          attributes: {
            imageUrl: post.imageUrl,
            author: post.author,
            likes: post.likes,
            description: post.description,
            dateCreated: post.dateCreated,
          },
        },
      ],
    });
  });

  return res.send(latestPosts);
});

exports.postPost = asyncHandler(async (req, res, next) => {
  let post;
  try {
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
