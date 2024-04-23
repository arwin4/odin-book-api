const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const mockUser = require('./mocks/user');
const Post = require('../models/post');

let mongoServer;

async function startMemoryMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Set up users. MongoDB creates the collection implicitly when referenced.
  const users = mongoose.connection.collection('users');

  await users.insertOne(mockUser);

  // Set up posts
  const posts = mongoose.connection.collection('posts');

  const insertedMockUser = await users.findOne({});
  const mockPost1 = {
    imageUrl: 'https://i.postimg.cc/mr8Y9svB/frankfurt-gardens.webp',
    author: insertedMockUser._id,
    description: 'This post has 2 comments',
    likes: [insertedMockUser._id],
  };
  const mockPost2 = {
    imageUrl: 'https://i.postimg.cc/ZRMwQ5kK/alpine.webp',
    author: insertedMockUser._id,
    description: 'This post has no comments',
  };
  await posts.insertMany([mockPost1, mockPost2]);

  // Set up comment
  const comments = mongoose.connection.collection('comments');

  const insertedMockPost1 = await Post.findOne({
    author: insertedMockUser._id,
  });
  const mockComment1 = {
    post: insertedMockPost1._id,
    author: insertedMockUser._id,
    content: 'Test comment 1',
  };
  const mockComment2 = {
    post: insertedMockPost1._id,
    author: insertedMockUser._id,
    content: 'Test comment 2',
  };
  await comments.insertMany([mockComment1, mockComment2]);

  return { mockUser };
}

async function stopMemoryMongoServer() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

module.exports = { startMemoryMongoServer, stopMemoryMongoServer };
