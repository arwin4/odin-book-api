const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function startMemoryMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Set up users. MongoDB creates the collection implicitly when referenced.
  const { users } = mongoose.connection.collections;

  const mockUser = {
    username: 'testUser',
    normalizedUsername: 'testuser',
    firstName: 'Paula',
  };
  await users.insertOne(mockUser);

  // Set up posts
  const posts = mongoose.connection.collection('posts');

  const insertedMockUser = await users.findOne({});
  const mockPost1 = {
    imageUrl: 'https://i.postimg.cc/mr8Y9svB/frankfurt-gardens.webp',
    author: insertedMockUser._id,
    description: 'Frankfurt Botanical Gardens',
  };
  const mockPost2 = {
    imageUrl: 'https://i.postimg.cc/ZRMwQ5kK/alpine.webp',
    author: insertedMockUser._id,
    description: 'Alpine stream',
  };
  await posts.insertMany([mockPost1, mockPost2]);

  return { mockUser };
}

async function stopMemoryMongoServer() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

module.exports = { startMemoryMongoServer, stopMemoryMongoServer };
