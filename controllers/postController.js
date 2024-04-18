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
