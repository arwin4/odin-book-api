const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const seedDb = require('../scripts/seedDb');

let mongoServer;

async function startMemoryMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  await seedDb();
}

async function stopMemoryMongoServer() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

module.exports = { startMemoryMongoServer, stopMemoryMongoServer };
