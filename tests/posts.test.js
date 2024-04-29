// eslint-disable-next-line import/no-unresolved
const { faker } = require('@faker-js/faker/locale/en');
const express = require('express');
const request = require('supertest');
const post = require('../routes/post');
const Post = require('../models/post');
const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');
const { mockUser1 } = require('./mocks/users');
const Comment = require('../models/comment');

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

describe('Verify test db setup', () => {
  it('finds the 2 inserted test posts in the db', async () => {
    expect(await Post.countDocuments({})).toBe(2);
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
        description: expect.anything(),
        dateCreated: expect.anything(),
      },
      relationships: {
        author: {
          data: { type: 'users', id: expect.anything() },
        },
        likes: {
          data: [{ type: 'likes', id: expect.anything() }],
        },
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
          description: expect.anything(),
          dateCreated: expect.anything(),
        },
        relationships: {
          author: {
            data: { type: 'users', id: expect.anything() },
          },
          likes: {
            data: [{ type: 'likes', id: expect.anything() }],
          },
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
    const fakerImageUrl = faker.image.url();

    const res = await request(app)
      .post('/')
      .send({
        data: {
          type: 'posts',
          attributes: {
            imageUrl: fakerImageUrl,
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
          imageUrl: fakerImageUrl,
          description: 'Test description',
          dateCreated: expect.anything(),
        },
        relationships: {
          author: {
            data: { type: 'users', id: expect.anything() },
          },
          likes: { data: [] },
        },
      },
    };

    expect(res.body).toEqual(expectedRes);
    expect(await Post.countDocuments({})).toBe(3);
  });
});

describe('Delete post', () => {
  it('returns 403 if user is not the author', async () => {
    // This post was by mockUser2, not mockUser1
    const postToDelete = await Post.findOne({
      description: 'This post has no comments',
    });
    const postId = postToDelete._id;
    expect(await Post.findById(postId)).toBeTruthy();

    const res = await request(app).delete(`/${postId}`);
    expect(res.status).toBe(403);
    expect(await Post.findById(postId)).toBeTruthy();
  });
  it('returns 404 if post does not exist', async () => {
    const res = await request(app).delete('/does-not-exist');
    expect(res.status).toBe(404);
  });
  it('deletes the post and its comments', async () => {
    const postToDelete = await Post.findOne({
      description: 'This post has 2 comments',
    });
    const postId = postToDelete._id;

    expect(await Post.findById(postId)).toBeTruthy();
    expect(await Comment.find({ post: postId }).countDocuments()).not.toBe(0);

    const res = await request(app).delete(`/${postId}`);
    expect(res.status).toBe(204);
    expect(await Post.findById(postId)).toBeFalsy();
    expect(await Comment.find({ post: postId }).countDocuments()).toBe(0);
  });
});
