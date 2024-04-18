const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const user = require('../routes/user');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const User = require('../models/user');

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

describe('Verify test db setup', () => {
  it('finds the inserted test user in the db', async () => {
    expect(await User.findOne({ username: 'testUser' })).toHaveProperty(
      'username',
      'testUser',
    );
  });

  it('finds no other documents other than the inserted one', async () => {
    expect(await User.countDocuments({})).toBe(1);
  });
});

describe('Get user', () => {
  it('gets the test user', async () => {
    const res = await request(app).get('/testUser');

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testUser');
    expect(res.body.normalizedUsername).toBe('testuser');
    expect(res.body.firstName).toBe('Paula');
    expect(mongoose.isValidObjectId(res.body._id)).toBeTruthy();
    expect(res.body.friends).toBeTruthy();
    expect(res.body.followers).toBeTruthy();
    expect(res.body.isBot).toBe(false);
  });
  test('inexistent user causes 404 ', async () => {
    const res = await request(app).get('/i-dont-exist');
    expect(res.statusCode).toBe(404);
  });
});

describe('Signup', () => {
  it('fails if no username is provided', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ firstName: 'Ness' })
      .send({ password: 'abc' });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  it('fails if no password is provided', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'signup' })
      .send({ firstName: 'Ness' });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  it('fails if no first name is provided', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'signup' })
      .send({ password: 'abc' });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  it('fails if password too short', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'signup' })
      .send({ password: 'ab' });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  it('fails if password too long', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'signup' })
      .send({
        password:
          'this-password-is-over-64-characters-long-oh-noooooooooooooooooooo',
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  it('fails if username too long', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'this-username-is-over-twenty-characters-long' })
      .send({ password: 'abc' });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(1);
  });

  describe('Refuses duplicate usernames', () => {
    it('same case', async () => {
      expect(await User.countDocuments({})).toBe(1);
      const res = await request(app)
        .post('/')
        .type('form')
        .send({ username: 'testUser' })
        .send({ password: 'abc' });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(1);
    });

    it('uppercase', async () => {
      expect(await User.countDocuments({})).toBe(1);
      const res = await request(app)
        .post('/')
        .type('form')
        .send({ username: 'TESTUSER' })
        .send({ password: 'abc' });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(1);
    });

    it('lowercase', async () => {
      expect(await User.countDocuments({})).toBe(1);
      const res = await request(app)
        .post('/')
        .type('form')
        .send({ username: 'testuser' })
        .send({ password: 'abc' });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(1);
    });
  });

  it('accepts new user', async () => {
    expect(await User.countDocuments({})).toBe(1);
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ username: 'signup' })
      .send({ firstName: 'Ness' })
      .send({ password: 'abc' });

    expect(res.statusCode).toBe(201);

    const expectedItem = {
      data: {
        type: 'users',
        id: expect.anything(),
        attributes: {
          username: expect.anything(),
          normalizedUsername: expect.anything(),
          firstName: expect.anything(),
          followers: expect.anything(),
          friends: expect.anything(),
          dateCreated: expect.anything(),
          password: undefined,
        },
      },
    };
    expect(res.body).toEqual(expectedItem);

    expect(await User.countDocuments({})).toBe(2);
  });
});
