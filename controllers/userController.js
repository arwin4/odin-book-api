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

    return res.send({
      data: {
        type: 'users',
        id: foundUser._id,
        attributes: {
          username: foundUser.username,
          normalizedUsername: foundUser.normalizedUsername,
          firstName: foundUser.firstName,
          dateCreated: foundUser.dateCreated,
          friends: foundUser.friends,
          followers: foundUser.followers,
          isBot: foundUser.isBot,
          bio: foundUser.bio,
          avatarUrl: foundUser.avatarUrl,
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .send({ errors: [{ title: 'Internal server error' }] });
  }
});

exports.getCurrentUser = asyncHandler(async (req, res) =>
  res.send({
    data: {
      type: 'users',
      id: req.user._id,
      attributes: {
        username: req.user.username,
        normalizedUsername: req.user.normalizedUsername,
        firstName: req.user.firstName,
        dateCreated: req.user.dateCreated,
        friends: req.user.friends,
        followers: req.user.followers,
        avatarUrl: req.user.avatarUrl,
      },
    },
  }),
);

exports.signUp = [
  asyncHandler(async (req, res, next) => {
    // Set json to req.body for checkSchema
    const { attributes } = req.body.data;
    req.body = attributes;
    return next();
  }),

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
    // Assign random avatar
    const avatarUrl = `https://avatars.githubusercontent.com/u/${Math.floor(
      10 ** 7 + Math.random() * 10 ** 7,
    )}`;

    const user = new User({
      username: req.body.username,
      normalizedUsername: req.body.username.toLowerCase(),
      firstName: req.body.firstName,
      avatarUrl,
    });

    // Encrypt password
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
      await user.save();
    } catch (error) {
      next(error);
    }

    res.status(201).send({
      data: {
        type: 'users',
        id: user._id,
        attributes: {
          username: user.username,
          normalizedUsername: user.normalizedUsername,
          firstName: user.firstName,
          followers: user.followers,
          friends: user.friends,
          dateCreated: user.dateCreated,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  }),
];

exports.setAvatar = asyncHandler(async (req, res) => {
  const { publicId } = req.body.data.attributes;
  const croppedAvatarUrl = `https://res.cloudinary.com/dg2fuzzhq/image/upload/t_crop-avatar/${publicId}.avif`;

  const user = await findUser(req.user.username);
  user.avatarUrl = croppedAvatarUrl;
  await user.save();

  res.status(200).send({
    data: {
      type: 'users',
      id: user._id,
      attributes: {
        username: user.username,
        normalizedUsername: user.normalizedUsername,
        firstName: user.firstName,
        followers: user.followers,
        friends: user.friends,
        dateCreated: user.dateCreated,
        avatarUrl: user.avatarUrl,
      },
    },
  });
});
