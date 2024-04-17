const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const post = require('../routes/post');

const {
  startMemoryMongoServer,
  stopMemoryMongoServer,
} = require('./memoryMongoServer');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/', post);

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
