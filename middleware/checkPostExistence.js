const Post = require('../models/post');

async function checkPostExistence(req, res, next) {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error();
    }
  } catch (err) {
    return res.status(404).send({ errors: [{ title: 'Post not found.' }] });
  }

  return next();
}

module.exports = checkPostExistence;
