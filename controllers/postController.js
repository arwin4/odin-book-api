const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const verifyAuth = require('../passport/verifyAuth');

async function getLatestPostsFromAllUsers(limit = 10) {
  return Post.aggregate([
    { $sort: { dateCreated: -1 } },
    { $limit: limit },
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

async function getLatestFilteredPosts(req) {
  let filter;
  if (req.query.filter?.followed) {
    filter = { followers: req.user._id };
  } else if (req.query.username) {
    filter = { normalizedUsername: req.query.username.toLowerCase() };
  }

  return User.aggregate([
    { $match: filter },
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
}

async function sendPosts(foundPosts, res) {
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
              avatarUrl: doc.author[0].avatarUrl,
            },
          },
        },
        likes: { data: likesArray },
      },
    });
  });
  return res.send(resObj);
}

exports.getPosts = [
  asyncHandler(async (req, res, next) => {
    const { query } = req;
    const limit = query.limit && parseFloat(query.limit);
    delete query.limit;

    // Check for queries other than limit
    const queryExists = Object.keys(query).length > 0;

    if (queryExists) {
      next();
    } else {
      const foundPosts = await getLatestPostsFromAllUsers(limit);
      sendPosts(foundPosts, res);
    }
  }),

  verifyAuth,

  asyncHandler(async (req, res) => {
    const foundPosts = await getLatestFilteredPosts(req);
    sendPosts(foundPosts, res);
  }),
];

exports.getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId).populate('author');

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
        author: {
          data: {
            type: 'users',
            id: post.author._id,
            attributes: {
              username: post.author.username,
              normalizedUsername: post.author.normalizedUsername,
              firstName: post.author.firstName,
              dateCreated: post.author.dateCreated,
              friends: post.author.friends,
              followers: post.author.followers,
              isBot: post.author.isBot,
              bio: post.author.bio,
              avatarUrl: post.author.avatarUrl,
            },
          },
        },
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
