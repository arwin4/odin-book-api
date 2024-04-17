const User = require('../models/user');

async function findUser(normalizedUsername) {
  const currentUser = await User.findOne({ normalizedUsername }).exec();

  if (!currentUser) return false;
  return currentUser;
}

module.exports = findUser;
