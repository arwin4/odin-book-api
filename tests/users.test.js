const express = require('express');
const request = require('supertest');
const user = require('../routes/user');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const User = require('../models/user');
const { mockUser1 } = require('./mocks/users');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', user);

// Mock auth
jest.mock('../passport/verifyAuth', () =>
  jest.fn((req, res, next) => {
    req.user = mockUser1;
    return next();
  }),
);

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

  it('finds no other documents other than the inserted ones', async () => {
    expect(await User.countDocuments({})).toBe(2);
  });
});

describe('Get user', () => {
  it('gets the test user', async () => {
    const res = await request(app).get('/testUser');

    const expectedRes = {
      data: {
        type: 'users',
        id: expect.anything(),
        attributes: {
          username: 'testUser',
          normalizedUsername: 'testuser',
          firstName: 'Paula',
          dateCreated: expect.anything(),
          friends: [],
          followers: [],
          isBot: false,
        },
      },
    };

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expectedRes);
  });
  test('non-existent user causes 404', async () => {
    const res = await request(app).get('/i-dont-exist');
    expect(res.statusCode).toBe(404);
  });
});

describe('Signup', () => {
  it('fails if no username is provided', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            firstName: 'Ness',
            password: 'abc',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  it('fails if no password is provided', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'signup',
            firstName: 'Ness',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  it('fails if no first name is provided', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'signup',
            password: 'abc',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  it('fails if password too short', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'signup',
            firstName: 'Ness',
            password: 'ab',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  it('fails if password too long', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'signup',
            firstName: 'Ness',
            password:
              'this-password-is-over-64-characters-long-oh-noooooooooooooooooooo',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  it('fails if username too long', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'this-username-is-over-twenty-characters-long',
            firstName: 'Ness',
            password: 'abc',
          },
        },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments({})).toBe(2);
  });

  describe('Refuses duplicate usernames', () => {
    it('same case', async () => {
      expect(await User.countDocuments({})).toBe(2);
      const res = await request(app)
        .post('/')
        .send({
          data: {
            type: 'users',
            attributes: {
              username: 'testUser',
              firstName: 'Ness',
              password: 'abc',
            },
          },
        });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(2);
    });

    it('uppercase', async () => {
      expect(await User.countDocuments({})).toBe(2);
      const res = await request(app)
        .post('/')
        .send({
          data: {
            type: 'users',
            attributes: {
              username: 'TESTUSER',
              firstName: 'Ness',
              password: 'abc',
            },
          },
        });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(2);
    });

    it('lowercase', async () => {
      expect(await User.countDocuments({})).toBe(2);
      const res = await request(app)
        .post('/')
        .send({
          data: {
            type: 'users',
            attributes: {
              username: 'testuser',
              firstName: 'Ness',
              password: 'abc',
            },
          },
        });

      expect(res.statusCode).toBe(409);
      expect(await User.countDocuments({})).toBe(2);
    });
  });

  it('accepts new user', async () => {
    expect(await User.countDocuments({})).toBe(2);
    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'users',
          attributes: {
            username: 'signup',
            firstName: 'Ness',
            password: 'abc',
          },
        },
      });

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

    expect(await User.countDocuments({})).toBe(3);
  });
});
