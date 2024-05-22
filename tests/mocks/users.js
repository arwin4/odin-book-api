const { faker } = require('@faker-js/faker');

const mockUser1 = {
  username: 'testUser',
  normalizedUsername: 'testuser',
  dateCreated: faker.date.past(),
  followers: [],
  friends: [],
  firstName: 'Paula',
  bio: 'Bio of testUser',
  avatarUrl: faker.image.avatar(),
};

const mockUser2 = {
  username: 'testUser2',
  normalizedUsername: 'testuser2',
  firstName: 'Jeff',
  bio: 'Bio of testUser2',
  avatarUrl: faker.image.avatar(),
};

const mockUser3 = {
  username: 'testUser3',
  normalizedUsername: 'testuser3',
  firstName: 'Poo',
  bio: 'Bio of testUser3',
  avatarUrl: faker.image.avatar(),
};

module.exports = { mockUser1, mockUser2, mockUser3 };
