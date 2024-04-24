const express = require('express');
const request = require('supertest');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const post = require('../routes/post');
const Comment = require('../models/comment');
const Post = require('../models/post');
const mockUser = require('./mocks/user');

const app = express();

// Must use json middleware to deserialize (nested) json
app.use(express.json());
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

describe('Verify test db setup', () => {
  it('finds the inserted test comments in the db', async () => {
    expect(await Comment.countDocuments({})).toBe(2);
  });
});

describe('Get comment by post ID', () => {
  it('gets all 2 comments', async () => {
    const currentPost = await Post.findOne({
      description: 'This post has 2 comments',
    });
    const postId = currentPost._id;
    const res = await request(app).get(`/${postId}/comments`);

    expect(res.status).toBe(200);

    const expectedRes = {
      data: [
        {
          type: 'comments',
          id: expect.anything(),
          attributes: {
            post: expect.anything(),
            author: expect.anything(),
            likes: [],
            content: 'Test comment 1',
            dateCreated: expect.anything(),
          },
        },
        {
          type: 'comments',
          id: expect.anything(),
          attributes: {
            post: expect.anything(),
            author: expect.anything(),
            likes: [],
            content: 'Test comment 2',
            dateCreated: expect.anything(),
          },
        },
      ],
    };
    expect(res.body).toEqual(expectedRes);
  });
  it('gets empty array on a post without comments', async () => {
    const currentPost = await Post.findOne({
      description: 'This post has no comments',
    });
    const postId = currentPost._id;

    const res = await request(app).get(`/${postId}/comments`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe('Post comment', () => {
  it('saves a new comment', async () => {
    const currentPost = await Post.findOne({
      description: 'This post has no comments',
    });
    const postId = currentPost.id;

    const res = await request(app)
      .post(`/${postId}/comments`)
      .send({
        data: {
          type: 'comments',
          attributes: {
            content: 'This is a new comment',
          },
        },
      });

    expect(res.statusCode).toBe(201);

    const expectedRes = {
      data: {
        type: 'comments',
        id: expect.anything(),
        attributes: {
          post: postId,
          content: 'This is a new comment',
          author: expect.anything(),
          likes: [],
          dateCreated: expect.anything(),
        },
      },
    };

    expect(res.body).toEqual(expectedRes);
    expect(
      await Post.countDocuments({
        description: 'This post has no comments',
      }),
    ).toBe(1);
  });
  it('returns 404 for nonexistent post', async () => {
    const res = await request(app)
      .post('/non-existent/comments')
      .send({
        data: {
          type: 'comments',
          attributes: {
            content: 'This is a new comment',
          },
        },
      });

    expect(res.status).toBe(404);
  });
});
