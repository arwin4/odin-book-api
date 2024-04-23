const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');

exports.getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  try {
    const foundComments = await Comment.find().where('post', postId);
    const resObj = { data: [] };
    foundComments.forEach((comment) => {
      resObj.data.push({
        type: 'comments',
        id: comment._id,
        attributes: {
          post: comment.post,
          author: comment.author,
          likes: comment.likes,
          content: comment.content,
          dateCreated: comment.dateCreated,
        },
      });
    });
    return res.send(resObj);
  } catch (err) {
    return next(err);
  }
});
