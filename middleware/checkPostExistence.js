const Post = require('../models/post');

async function checkPostExistence(req, res, next) {
  const { postId } = req.params;

  try {
    await Post.findById(postId);
  } catch (err) {
    return res.sendStatus(404);
  }

  return next();
}

module.exports = checkPostExistence;
