// eslint-disable-next-line import/no-unresolved
const { faker } = require('@faker-js/faker/locale/en');
const mongoose = require('mongoose');
const { mockUser1, mockUser2 } = require('../tests/mocks/users');
const Post = require('../models/post');

async function seedTestDb() {
  // Set up users. MongoDB creates the collection implicitly when referenced.
  const users = mongoose.connection.collection('users');

  await users.insertMany([mockUser1, mockUser2]);

  // Set up posts
  const posts = mongoose.connection.collection('posts');

  const insertedMockUser1 = await users.findOne({ username: 'testUser' });
  const insertedMockUser2 = await users.findOne({ username: 'testUser2' });

  const mockPost1 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser1._id,
    description: 'This post has 2 comments',
    likes: [insertedMockUser1._id],
  };
  const mockPost2 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser2._id,
    description: 'This post has no comments',
    likes: [insertedMockUser2._id],
  };
  await posts.insertMany([mockPost1, mockPost2]);

  // Set up comment
  const comments = mongoose.connection.collection('comments');

  const insertedMockPost1 = await Post.findOne({
    author: insertedMockUser1._id,
  });
  const mockComment1 = {
    post: insertedMockPost1._id,
    author: insertedMockUser1._id,
    content: 'Test comment 1',
  };
  const mockComment2 = {
    post: insertedMockPost1._id,
    author: insertedMockUser2._id,
    content: 'Test comment 2',
  };
  await comments.insertMany([mockComment1, mockComment2]);
}

async function seedProductionDb() {
  // Check if already seeded
  const collections = await mongoose.connection.listCollections();
  if (collections.length > 0) {
    // eslint-disable-next-line no-console
    console.log('The database has been seeded already.');
    return;
  }

  // Set up users. MongoDB creates the collection implicitly when referenced.
  const users = mongoose.connection.collection('users');

  await users.insertMany([mockUser1, mockUser2]);

  // Set up posts
  const posts = mongoose.connection.collection('posts');

  const insertedMockUser1 = await users.findOne({ username: 'testUser' });
  const insertedMockUser2 = await users.findOne({ username: 'testUser2' });

  const mockPost1 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser1._id,
    description: 'This post has 2 comments',
    likes: [insertedMockUser1._id],
  };
  const mockPost2 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser2._id,
    description: 'This post has no comments',
    likes: [insertedMockUser2._id],
  };
  await posts.insertMany([mockPost1, mockPost2]);

  // Set up comment
  const comments = mongoose.connection.collection('comments');

  const insertedMockPost1 = await Post.findOne({
    author: insertedMockUser1._id,
  });
  const mockComment1 = {
    post: insertedMockPost1._id,
    author: insertedMockUser1._id,
    content: 'Test comment 1',
  };
  const mockComment2 = {
    post: insertedMockPost1._id,
    author: insertedMockUser2._id,
    content: 'Test comment 2',
  };
  await comments.insertMany([mockComment1, mockComment2]);
}

module.exports = { seedTestDb, seedProductionDb };

/**
   * 100 users
   * 50 users with posts
   * 50 users without posts
   * 
   * users with posts:
   * 1-10 posts each
   
   */
