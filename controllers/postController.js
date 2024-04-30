const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');

exports.getPosts = asyncHandler(async (req, res) => {
  let followedUserFilter = {};
  if (req.query?.filter?.followed) {
    followedUserFilter = { followers: req.user._id };
  }

  // Get latest 50 posts, filtering by only followed users if requested
  const foundPosts = await User.aggregate([
    { $match: followedUserFilter },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        as: 'post',
      },
    },
    { $project: { post: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'post.author',
        foreignField: '_id',
        as: 'author',
      },
    },
    // { $unwind: '$post' },
    { $sort: { 'post.dateCreated': -1 } },
    { $limit: 50 },
  ]);

  const resObj = { data: [] };
  foundPosts.forEach((doc) => {
    const likesArray = [];
    doc.post[0].likes.forEach((like) =>
      likesArray.push({ type: 'likes', id: like }),
    );

    resObj.data.push({
      type: 'posts',
      id: doc.post[0]._id,
      attributes: {
        imageUrl: doc.post[0].imageUrl,
        description: doc.post[0].description,
        dateCreated: doc.post[0].dateCreated,
      },
      relationships: {
        author: { data: { type: 'users', id: doc.post[0].author } },
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
