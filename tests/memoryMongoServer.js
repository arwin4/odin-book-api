const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function startMemoryMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const { collections } = mongoose.connection;
  mongoose.connection.createCollection('users');
  const mockUser = {
    username: 'testUser',
  };

  const { users } = collections;
  await users.insertOne(mockUser);

  return mongoServer;
}

async function stopMemoryMongoServer() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

module.exports = { startMemoryMongoServer, stopMemoryMongoServer };
