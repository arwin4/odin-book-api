const { checkSchema } = require('express-validator');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const findUser = require('../utils/findUser');
const respondOnValidationError = require('../utils/respondOnValidationError');
const User = require('../models/user');
const userSchema = require('../models/express-validator-schemas/user');

exports.getUser = asyncHandler(async (req, res) => {
  try {
    const foundUser = await findUser(req.params.username.toLowerCase());
    if (!foundUser) {
      return res
        .status(404)
        .send({ errors: [{ title: 'User does not exist' }] });
    }
    const user = {
      _id: foundUser._id,
      username: foundUser.username,
      normalizedUsername: foundUser.normalizedUsername,
      firstName: foundUser.firstName,
      dateCreated: foundUser.dateCreated,
      friends: foundUser.friends,
      followers: foundUser.followers,
      isBot: foundUser.isBot,
    };
    return res.send(user);
  } catch (error) {
    return res
      .status(500)
      .send({ errors: [{ title: 'Internal server error' }] });
  }
});

exports.signUp = [
  checkSchema(userSchema),

  asyncHandler(async (req, res, next) => {
    const normalizedUsername = req.body.username.toLowerCase();
    const foundUser = await findUser(normalizedUsername);

    if (foundUser)
      return res
        .status(409)
        .send({ errors: [{ title: 'Username is already taken.' }] });
    return next();
  }),

  asyncHandler(async (req, res, next) => {
    respondOnValidationError(req, res, next);
  }),

  asyncHandler(async (req, res, next) => {
    const user = new User({
      username: req.body.username,
      normalizedUsername: req.body.username.toLowerCase(),
      firstName: req.body.firstName,
    });

    // Encrypt password
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
      await user.save();
    } catch (error) {
      next(error);
    }
    res.send();
  }),
];
