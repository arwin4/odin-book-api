const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const post = require('../routes/post');
const Post = require('../models/post');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const { mockUser1 } = require('./mocks/users');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', post);

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

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data).toContainEqual(expectedRes);
  });
  it('gets post by ID', async () => {
    const currentPost = await Post.findOne();
    const postId = currentPost.id;

    const res = await request(app).get(`/${postId}`);
    expect(res.status).toBe(200);

    const expectedRes = {
      data: {
        type: 'posts',
        id: expect.anything(),
        attributes: {
          imageUrl: expect.anything(),
          author: expect.anything(),
          likes: expect.anything(),
          description: expect.anything(),
          dateCreated: expect.anything(),
        },
      },
    };

    expect(res.body).toEqual(expectedRes);
  });
  it('returns 404 for nonexistent post', async () => {
    const res = await request(app).get('/non-existent');
    expect(res.status).toBe(404);
  });
});

describe('Post post', () => {
  it('saves a new post', async () => {
    expect(await Post.countDocuments({})).toBe(2);

    // frontend:
    // TODO: must correctly handle <10MiB files and warn for bigger ones
    //  Await upload to cloudinary
    // https://cloudinary.com/documentation/client_side_uploading#code_explorer_upload_multiple_files_using_a_form_unsigned
    // then forward url and other info to post('/')

    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'posts',
          attributes: {
            imageUrl: 'https://i.postimg.cc/mr8Y9svB/frankfurt-gardens.webp',
            description: 'Test description',
          },
        },
      });

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
