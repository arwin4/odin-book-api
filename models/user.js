const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    maxLength: [30, 'Username must not exceed 30 characters'],
    required: true,
  },
  normalizedUsername: {
    type: String,
    maxLength: [30, 'Username must not exceed 30 characters'],
    required: true,
  },
  firstName: {
    type: String,
    maxLength: [20, 'First name must not exceed 20 characters'],
    required: true,
  },
  password: {
    type: String,
    minLength: [3, 'Password must be at least 3 characters long'],
    maxLength: [64, 'Password must be not exceed 64 characters'],
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  bio: {
    type: String,
    maxLength: [200, 'Bio must not exceed 200 characters'],
  },
  avatarUrl: {
    type: String,
    maxLength: [500, 'URL length must not exceed 500 characters'],
  },
  isBot: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model('User', UserSchema);
