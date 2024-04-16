const asyncHandler = require('express-async-handler');
const findUser = require('../utils/findUser');

exports.getUser = asyncHandler(async (req, res) => {
  try {
    const foundUser = await findUser(req.params.username);
    if (!foundUser) {
      return res
        .status(404)
        .send({ errors: [{ title: 'User does not exist' }] });
    }
    const user = {
      // _id: foundUser._id,
      username: foundUser.username,
      // dateCreated: foundUser.dateCreated,
      // friends: foundUser.friends,
      // isBot: foundUser.isBot,
    };
    return res.send(user);
  } catch (error) {
    return res
      .status(500)
      .send({ errors: [{ title: 'Internal server error' }] });
  }
});
