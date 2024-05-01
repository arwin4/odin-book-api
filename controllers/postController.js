const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');

exports.getPosts = asyncHandler(async (req, res) => {
  let foundPosts;

  if (req.query?.filter?.followed) {
    // Filter by only followed users
    foundPosts = await User.aggregate([
      { $match: { followers: req.user._id } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'post',
        },
      },
      { $project: { post: 1 } },
      { $unwind: '$post' },
      { $sort: { 'post.dateCreated': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'post.author',
          foreignField: '_id',
          as: 'author',
        },
      },
    ]);
  } else {
    // Latest posts made by all users
    foundPosts = await Post.aggregate([
      { $sort: { dateCreated: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'post',
        },
      },
      { $project: { post: 1 } },
      { $unwind: '$post' },
      {
        $lookup: {
          from: 'users',
          localField: 'post.author',
          foreignField: '_id',
          as: 'author',
        },
      },
    ]);
  }

  const resObj = { data: [] };
  foundPosts.forEach((doc) => {
    const likesArray = [];
    doc.post.likes.forEach((like) =>
      likesArray.push({ type: 'likes', id: like }),
    );

    resObj.data.push({
      type: 'posts',
      id: doc.post._id,
      attributes: {
        imageUrl: doc.post.imageUrl,
        description: doc.post.description,
        dateCreated: doc.post.dateCreated,
      },
      relationships: {
        author: {
          data: {
            type: 'users',
            id: doc.post.author,
            attributes: {
              username: doc.author[0].username,
              normalizedUsername: doc.author[0].normalizedUsername,
              firstName: doc.author[0].firstName,
              isBot: doc.author[0].isBot,
            },
          },
        },
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
