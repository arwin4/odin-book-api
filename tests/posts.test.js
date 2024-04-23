const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const post = require('../routes/post');
const Post = require('../models/post');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const mockUser = require('./mocks/user');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/', post);

// Mock auth
jest.mock('../passport/verifyAuth', () =>
  jest.fn((req, res, next) => {
    req.user = mockUser;
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

const { posts } = mongoose.connection.collections;

describe('Verify test db setup', () => {
  it('finds the 2 inserted test posts in the db', async () => {
    expect(await posts.countDocuments({})).toBe(2);
  });
});

describe('Get post', () => {
  it('gets test posts', async () => {
    const res = await request(app).get('/');

    const expectedRes = {
      type: 'posts',
      id: expect.anything(),
      attributes: {
        imageUrl: expect.anything(),
        author: expect.anything(),
        likes: expect.anything(),
        description: expect.anything(),
        dateCreated: expect.anything(),
      },
    };

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data).toContainEqual(expectedRes);
  });
  it('saves a new post', async () => {
    expect(await Post.countDocuments({})).toBe(2);

    // frontend:
    // TODO: must correctly handle <10MiB files and warn for bigger ones
    //  Await upload to cloudinary
    // https://cloudinary.com/documentation/client_side_uploading#code_explorer_upload_multiple_files_using_a_form_unsigned
    // then forward url and other info to post('/')

    const res = await request(app)
      .post('/')
      .type('form')
      .send({
        imageUrl: 'https://i.postimg.cc/mr8Y9svB/frankfurt-gardens.webp',
      })
      .send({ description: 'Test description' });

    expect(res.statusCode).toBe(201);

    const expectedRes = {
      data: {
        type: 'posts',
        id: expect.anything(),
        attributes: {
          imageUrl: 'https://i.postimg.cc/mr8Y9svB/frankfurt-gardens.webp',
          author: expect.anything(),
          likes: [],
          description: 'Test description',
          dateCreated: expect.anything(),
        },
      },
    };

    expect(res.body).toEqual(expectedRes);
    expect(await Post.countDocuments({})).toBe(3);
  });
});
