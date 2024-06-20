const express = require('express');
const request = require('supertest');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const post = require('../routes/post');
const Comment = require('../models/comment');
const Post = require('../models/post');
const { mockUser1 } = require('./mocks/users');

const app = express();

// Must use json middleware to deserialize (nested) json
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
            content: 'Test comment 1',
            dateCreated: expect.anything(),
          },
          relationships: {
            author: {
              data: {
                type: 'users',
                id: expect.anything(),
                attributes: {
                  username: expect.anything(),
                  firstName: expect.anything(),
                  avatarUrl: expect.anything(),
                },
              },
            },
            post: {
              data: {
                type: 'posts',
                id: expect.anything(),
              },
            },
          },
        },
        {
          type: 'comments',
          id: expect.anything(),
          attributes: {
            content: 'Test comment 2',
            dateCreated: expect.anything(),
          },
          relationships: {
            author: {
              data: {
                type: 'users',
                id: expect.anything(),
                attributes: {
                  username: expect.anything(),
                  firstName: expect.anything(),
                  avatarUrl: expect.anything(),
                },
              },
            },
            post: {
              data: {
                type: 'posts',
                id: expect.anything(),
              },
            },
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
    expect(await Comment.countDocuments()).toBe(2);

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
          content: 'This is a new comment',
          dateCreated: expect.anything(),
        },
        relationships: {
          author: {
            data: {
              type: 'users',
              id: expect.anything(),
            },
          },
          post: {
            data: {
              type: 'posts',
              id: postId,
            },
          },
        },
      },
    };

    expect(res.body).toEqual(expectedRes);
    expect(await Comment.countDocuments()).toBe(3);
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

describe('Delete comment by comment ID', () => {
  it('returns 403 if user is not the author', async () => {
    // Test comment 2 was left by mockUser2
    const comment = await Comment.findOne({ content: 'Test comment 2' });
    const postId = comment.post;
    const commentId = comment._id;
    expect(await Comment.find({ post: postId }).countDocuments()).toBe(2);

    const res = await request(app).delete(`/${postId}/comments/${commentId}`);
    expect(res.status).toBe(403);
    expect(await Comment.find({ post: postId }).countDocuments()).toBe(2);
  });
  it('returns 404 if post does not exist', async () => {
    const res = await request(app).delete(
      `/does-not-exist/comments/does-not-exist`,
    );
    expect(res.status).toBe(404);
  });
  it('returns 404 if comment does not exist (post does exist)', async () => {
    const comment = await Comment.findOne({ content: 'Test comment 1' });
    const postId = comment.post;

    const res = await request(app).delete(`/${postId}/comments/does-not-exist`);
    expect(res.status).toBe(404);
  });
  it('deletes the comment', async () => {
    const comment = await Comment.findOne({ content: 'Test comment 1' });
    const postId = comment.post;
    const commentId = comment._id;
    expect(await Comment.find({ post: postId }).countDocuments()).toBe(2);

    const res = await request(app).delete(`/${postId}/comments/${commentId}`);
    expect(res.status).toBe(204);
    expect(await Comment.find({ post: postId }).countDocuments()).toBe(1);
  });
});
