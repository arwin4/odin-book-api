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
    expect(await User.countDocuments({})).toBe(3);
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
          followers: [expect.any(String)],
          isBot: false,
          bio: expect.any(String),
          avatarUrl: expect.any(String),
        },
      },
    };

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expectedRes);
  });
  it('gets the current user', async () => {
    const res = await request(app).get('/');

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
          avatarUrl: expect.any(String),
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
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  it('fails if no password is provided', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  it('fails if no first name is provided', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  it('fails if password too short', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  it('fails if password too long', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  it('fails if username too long', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
    expect(await User.countDocuments({})).toBe(3);
  });

  describe('Refuses duplicate usernames', () => {
    it('same case', async () => {
      expect(await User.countDocuments({})).toBe(3);
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
      expect(await User.countDocuments({})).toBe(3);
    });

    it('uppercase', async () => {
      expect(await User.countDocuments({})).toBe(3);
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
      expect(await User.countDocuments({})).toBe(3);
    });

    it('lowercase', async () => {
      expect(await User.countDocuments({})).toBe(3);
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
      expect(await User.countDocuments({})).toBe(3);
    });
  });

  it('accepts new user', async () => {
    expect(await User.countDocuments({})).toBe(3);
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
          avatarUrl: expect.any(String),
        },
      },
    };
    expect(res.body).toEqual(expectedItem);

    expect(await User.countDocuments({})).toBe(4);
  });
});

describe('Followers', () => {
  describe('Following', () => {
    test('non-existent user causes 404', async () => {
      const res = await request(app).post('/i-dont-exist/followers');
      expect(res.statusCode).toBe(404);
    });
    it('gets 400 if the requested user is the current user ', async () => {
      const usernameToFollow = 'testuser';

      let userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(1);

      const res = await request(app).post(`/${usernameToFollow}/followers`);
      expect(res.statusCode).toBe(400);

      userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(1);
    });
    it('already followed user causes 409', async () => {
      const usernameToFollow = 'testuser2';
      let userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(1);

      const res = await request(app).post(`/${usernameToFollow}/followers`);
      expect(res.statusCode).toBe(409);

      userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(1);
    });
    it('follows the requested user', async () => {
      const usernameToFollow = 'testuser3';
      let userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(0);

      const res = await request(app).post(`/${usernameToFollow}/followers`);
      expect(res.statusCode).toBe(201);

      userToFollow = await User.findOne({
        normalizedUsername: usernameToFollow,
      });
      expect(userToFollow.followers.length).toBe(1);
    });
  });
  describe('Unfollowing', () => {
    test('non-existent user causes 404', async () => {
      const res = await request(app).delete('/i-dont-exist/followers');
      expect(res.statusCode).toBe(404);
    });
    it('not-followed user causes 404', async () => {
      const usernameToUnfollow = 'testuser3';
      const res = await request(app).delete(`/${usernameToUnfollow}/followers`);
      expect(res.statusCode).toBe(404);
    });
    it('gets 400 if the requested user is the current user ', async () => {
      const usernameToUnfollow = 'testuser';
      const res = await request(app).delete(`/${usernameToUnfollow}/followers`);
      expect(res.statusCode).toBe(400);
    });
    it('unfollows the requested user', async () => {
      const usernameToUnfollow = 'testuser2';
      let userToUnfollow = await User.findOne({
        normalizedUsername: usernameToUnfollow,
      });
      expect(userToUnfollow.followers.length).toBe(1);

      const res = await request(app).delete(`/${usernameToUnfollow}/followers`);
      expect(res.statusCode).toBe(204);

      userToUnfollow = await User.findOne({
        normalizedUsername: usernameToUnfollow,
      });
      expect(userToUnfollow.followers.length).toBe(0);
    });
  });
});

describe('Avatar', () => {});
