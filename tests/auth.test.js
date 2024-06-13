const express = require('express');
const request = require('supertest');
const auth = require('../routes/auth');
const user = require('../routes/user');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/auth', auth);
app.use('/user', user);

const username = 'jwt-testuser';
const password = 'password123';

// Completely tear down and set up between every test
beforeEach(async () => {
  await startMemoryMongoServer();

  process.env.JWT_SECRET_KEY = 'testKey';

  // Create a user to use in the tests
  await request(app)
    .post('/user/')
    .send({
      data: {
        type: 'users',
        attributes: {
          username,
          firstName: 'Jay Double-U Tee',
          password,
        },
      },
    });
});

afterEach(async () => {
  await stopMemoryMongoServer();
});

describe('Login', () => {
  it('fails on login with bad username', async () => {
    const res = await request(app)
      .post('/auth/')
      .type('form')
      .send({ username: 'does-not-exist' })
      .send({ password });

    expect(res.statusCode).toBe(404);
  });

  it('fails on login with bad password', async () => {
    const res = await request(app)
      .post('/auth/')
      .type('form')
      .send({ username })
      .send({ password: 'this-isnt-the-password' });

    expect(res.statusCode).toBe(401);
  });

  it('gets JWT on valid login', async () => {
    const res = await request(app)
      .post('/auth/')
      .type('form')
      .send({ username })
      .send({ password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(163); // Generated JWT should have this length
  });

  it('gets JWT on valid login with different username case', async () => {
    const usernameWithDifferentCase = username.toUpperCase();

    const res = await request(app)
      .post('/auth/')
      .type('form')
      .send({ username: usernameWithDifferentCase })
      .send({ password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(163); // Generated JWT should have this length
  });
});
