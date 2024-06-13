const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const findUser = require('../utils/findUser');

exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;
  const normalizedUsername = username.toLowerCase();

  const user = await findUser(username);
  if (!user)
    return res.status(404).send({ errors: [{ title: 'User not found.' }] });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).send({ errors: [{ title: 'Wrong password.' }] });

  // Create and send token
  try {
    const secret = process.env.JWT_SECRET_KEY;

    const token = jwt.sign({ username: normalizedUsername }, secret, {
      expiresIn: '1d',
    });
    return res.status(200).json(token);
  } catch (error) {
    return next(error);
  }
});
