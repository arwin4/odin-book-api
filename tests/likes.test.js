const express = require('express');
const request = require('supertest');
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

describe('Like a post', () => {
  it('returns 404 if post does not exist', async () => {
    const res = await request(app).post('/does-not-exist/likes');
    expect(res.status).toBe(404);
  });
  it('returns 409 if user has already liked post', async () => {
    let alreadyLikedPost = await Post.findOne({
      description: 'This post has 2 comments',
    });
    expect(alreadyLikedPost.likes.length).toBe(1);

    const res = await request(app).post(`/${alreadyLikedPost._id}/likes`);
    expect(res.status).toBe(409);

    alreadyLikedPost = await Post.findOne({
      description: 'This post has 2 comments',
    });
    expect(alreadyLikedPost.likes.length).toBe(1);
  });
  it('adds the like', async () => {
    const notYetLikedPost = await Post.findOne({
      description: 'This post has no comments',
    });
    expect(notYetLikedPost.likes.length).toBe(1);

    const res = await request(app).post(`/${notYetLikedPost._id}/likes`);
    expect(res.status).toBe(201);

    const expectedRes = {
      data: {
        type: 'likes',
        id: expect.anything(),
      },
    };
    expect(res.body).toEqual(expectedRes);

    const nowLikedPost = await Post.findOne({
      description: 'This post has no comments',
    });
    expect(nowLikedPost.likes.length).toBe(2);
  });
});

describe('Delete like from a post', () => {
  it('returns 404 if post does not exist', async () => {
    const res = await request(app).delete('/does-not-exist/likes');
    expect(res.status).toBe(404);
  });
  it('returns 404 if user has not liked the post', async () => {
    const notLikedPost = await Post.findOne({
      description: 'This post has no comments',
    });

    const res = await request(app).delete(`/${notLikedPost._id}/likes`);
    expect(res.status).toBe(404);
  });
  it('deletes the like', async () => {
    let likedPost = await Post.findOne({
      description: 'This post has 2 comments',
    });
    expect(likedPost.likes.length).toBe(1);

    const res = await request(app).delete(`/${likedPost._id}/likes`);
    expect(res.status).toBe(204);

    likedPost = await Post.findOne({
      description: 'This post has 2 comments',
    });
    expect(likedPost.likes.length).toBe(0);
  });
});
