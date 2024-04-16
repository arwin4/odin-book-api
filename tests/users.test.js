const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const user = require('../routes/user');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/', user);

// Completely tear down and set up between every test
beforeEach(async () => {
  await startMemoryMongoServer();
});

afterEach(async () => {
  await stopMemoryMongoServer();
});

const { users } = mongoose.connection.collections;

describe('Verify test db setup', () => {
  describe('Users collection', () => {
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

  describe('Signup', () => {
    test('creates user', async () => {
      const res = await request(app)
        .post('/')
        .type('form')
        .send({ username: 'signup' })
        .send({ password: 'abc' });

      expect(res.statusCode).toBe(200);

      // const signedUpUser = await users.findOne({ username: 'signup' });
      // console.log(signedUpUser);
      // expect(await users.countDocuments({})).toBe(2);
    });
  });
});
