/* eslint-disable no-console */
// eslint-disable-next-line import/no-unresolved
const { faker } = require('@faker-js/faker/locale/en');
const mongoose = require('mongoose');
const { mockUser1, mockUser2, mockUser3 } = require('../tests/mocks/users');
const {
  createRandomUser,
  createRandomPost,
  addRandomLikesToPost,
  createRandomComments,
} = require('./generateData');
const Post = require('../models/post');
const User = require('../models/user');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const Comment = require('../models/comment');
const shuffleArray = require('../utils/shuffleArray');

async function seedTestDb() {
  // Set up users. MongoDB creates the collection implicitly when referenced.
  const users = mongoose.connection.collection('users');

  await users.insertMany([mockUser1, mockUser2, mockUser3]);

  const insertedMockUser1 = await User.findOne({ username: 'testUser' });
  const insertedMockUser2 = await User.findOne({ username: 'testUser2' });
  const insertedMockUser3 = await User.findOne({ username: 'testUser3' });

  insertedMockUser1.followers = [insertedMockUser2._id];
  insertedMockUser2.followers = [insertedMockUser1._id];

  await Promise.all([insertedMockUser1.save(), insertedMockUser2.save()]);

  // Set up posts
  const posts = mongoose.connection.collection('posts');

  const mockPost1 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser1._id,
    description: 'This post has 2 comments',
    likes: [insertedMockUser1._id],
    dateCreated: faker.date.past(),
  };
  const mockPost2 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser2._id,
    description: 'This post has no comments',
    likes: [insertedMockUser2._id],
    dateCreated: faker.date.past(),
  };
  const mockPost3 = {
    imageUrl: faker.image.url(),
    author: insertedMockUser3._id,
    description: 'This is mock post 3',
    likes: [insertedMockUser2._id],
    dateCreated: faker.date.past(),
  };
  await posts.insertMany([mockPost1, mockPost2, mockPost3]);

  // Set up comment
  const comments = mongoose.connection.collection('comments');

  const insertedMockPost1 = await Post.findOne({
    author: insertedMockUser1._id,
  });
  const mockComment1 = {
    post: insertedMockPost1._id,
    author: insertedMockUser1._id,
    content: 'Test comment 1',
    dateCreated: faker.date.future(),
  };
  const mockComment2 = {
    post: insertedMockPost1._id,
    author: insertedMockUser2._id,
    content: 'Test comment 2',
    dateCreated: faker.date.past(),
  };
  await comments.insertMany([mockComment1, mockComment2]);
}

async function seedProductionDb() {
  // Check if already seeded
  const collections = await mongoose.connection.listCollections();
  if (collections.length > 0) {
    // eslint-disable-next-line no-console
    console.log('The database has been seeded already, skipping seeding.');
    return;
  }

  console.log('Database is empty. Seeding database...');

  // Generate users
  const numberOfUsersToGenerate = 500;
  const usersToInsert = [];

  for (let i = 0; i < numberOfUsersToGenerate; i += 1) {
    let duplicateUsername = true;
    let newUser;
    while (duplicateUsername) {
      newUser = createRandomUser();
      // eslint-disable-next-line no-loop-func
      if (usersToInsert.find((user) => user.username === newUser.username)) {
        duplicateUsername = true;
      } else {
        duplicateUsername = false;
      }
    }
    usersToInsert.push(newUser);
  }

  // Generate posts for half of the created users
  const postsToInsert = [];
  const usersToAssignPostsTo = usersToInsert.slice(usersToInsert.length / 2);

  usersToAssignPostsTo.forEach((user) => {
    // Generate 1-10 posts for each user
    const numberOfPosts = randomIntFromInterval(1, 10);
    for (let i = 0; i < numberOfPosts; i += 1) {
      const post = createRandomPost(user);
      addRandomLikesToPost(post, usersToInsert);
      postsToInsert.push(post);
    }
  });

  // Generate comments for random posts. Number of comments = number of users.
  const commentsToInsert = createRandomComments(postsToInsert, usersToInsert);

  // Assign 0-200 followers to every user
  usersToInsert.forEach((user) => {
    const allUsersExceptCurrent = usersToInsert.filter(
      (curUser) => curUser !== user,
    );
    const allUsersExceptCurrentShuffled = shuffleArray(allUsersExceptCurrent);
    const numberOfFollowers = randomIntFromInterval(0, 200);
    for (let i = 0; i < numberOfFollowers; i += 1) {
      user.followers.push(allUsersExceptCurrentShuffled[i]);
    }
  });

  await Promise.all[
    (User.insertMany(usersToInsert),
    Post.insertMany(postsToInsert),
    Comment.insertMany(commentsToInsert))
  ];

  console.log('Database has been seeded.');
}

module.exports = { seedTestDb, seedProductionDb };
