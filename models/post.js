const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
  imageUrl: {
    type: String,
    maxLength: [200, 'URL length must not exceed 200 characters'],
    required: true,
  },
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
  description: {
    type: String,
    minLength: [1, 'Description must be at least 1 character long'],
    maxLength: [500, 'Description must not exceed 500 characters'],
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', PostSchema);
