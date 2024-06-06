// eslint-disable-next-line import/no-unresolved
const { faker } = require('@faker-js/faker/locale/en');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const shuffleArray = require('../utils/shuffleArray');

function createRandomUser() {
  const firstName = faker.person.firstName();
  const username = faker.internet.userName({ firstName, lastName: '' });
  const id = faker.database.mongodbObjectId();
  const avatarUrl = `https://avatars.githubusercontent.com/u/${Math.floor(
    10 ** 7 + Math.random() * 10 ** 7,
  )}`;

  return {
    _id: id,
    firstName,
    username,
    normalizedUsername: username.toLowerCase(),
    bio: faker.lorem.sentence(),
    followers: [],
    avatarUrl,
    isBot: true,
  };
}

function createRandomPost(user) {
  return {
    _id: faker.database.mongodbObjectId(),
    imageUrl: faker.image.url(),
    author: user._id,
    description: faker.lorem.sentence(),
    likes: [],
    dateCreated: faker.date.past(),
  };
}

function createRandomComment(post, commentAuthor) {
  return {
    post: post._id,
    author: commentAuthor._id,
    content: faker.lorem.sentence(),
  };
}

function addRandomLikesToPost(post, users) {
  if (post.likes.length > 0) {
    throw new Error('Post must have no likes');
  }

  const numberOfLikes = randomIntFromInterval(0, users.length);
  const randomUsers = shuffleArray(users);

  // Limit the users to just the amount of likes needed
  const limitedUsers = randomUsers.slice(0, numberOfLikes);

  limitedUsers.forEach((user) => {
    post.likes.push(user._id);
  });

  return post;
}

function createRandomComments(posts, users) {
  const comments = [];
  const shuffledPosts = shuffleArray(posts);
  // TODO: Allow multiple comments per user
  const shuffledUsers = shuffleArray(users);

  for (let i = 0; i < users.length; i += 1) {
    comments.push(createRandomComment(shuffledPosts[i], shuffledUsers[i]));
  }

  return comments;
}

module.exports = {
  createRandomUser,
  createRandomPost,
  addRandomLikesToPost,
  createRandomComments,
  createRandomComment,
};
