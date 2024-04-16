const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const user = require('../routes/user');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/', user);

let mongoServer;

// Completely tear down and set up between every test
beforeEach(async () => {
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
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const { users } = mongoose.connection.collections;

describe('Verify that the db and collections are set up as intended', () => {
  describe('[Users collection]', () => {
    it('finds the inserted test user in the db', async () => {
      expect(await users.findOne({ username: 'testUser' })).toHaveProperty(
        'username',
        'testUser',
      );
    });

    it('finds no other documents other than the inserted one', async () => {
      expect(await users.countDocuments({})).toBe(1);
    });
  });
});

describe('Users API', () => {
  it('gets the test user', async () => {
    const res = await request(app).get('/testUser');

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testUser');
  });

  test.skip('signup works', async () => {
    await request(app)
      .post('/')
      .type('form')
      .send({ username: 'hello', password: 'abc' })
      .expect(200);
  });
});
