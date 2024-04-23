const mongoose = require('mongoose');

const CommentSchema = mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  content: {
    type: String,
    maxLength: [500, 'Comment must not exceed 500 characters'],
    required: true,
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', CommentSchema);
