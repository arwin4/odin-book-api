const asyncHandler = require('express-async-handler');
const findUser = require('../utils/findUser');

exports.addFollower = asyncHandler(async (req, res, next) => {
  const normalizedUsernameOfUserToFollow = req.params.username.toLowerCase();
  const userToFollow = await findUser(normalizedUsernameOfUserToFollow);

  if (!userToFollow) {
    return res.status(404).send({ errors: [{ title: 'User does not exist' }] });
  }

  if (normalizedUsernameOfUserToFollow === req.user.normalizedUsername) {
    return res
      .status(400)
      .send({ errors: [{ title: 'Cannot follow oneself' }] });
  }

  const currentUserId = req.user._id;
  if (userToFollow.followers.includes(currentUserId)) {
    return res
      .status(409)
      .send({ errors: [{ title: 'User is already followed' }] });
  }

  try {
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();
  } catch (err) {
    return next(err);
  }

  return res.sendStatus(201);
});

exports.deleteFollower = asyncHandler(async (req, res, next) => {
  const normalizedUsernameOfUserToUnfollow = req.params.username.toLowerCase();
  const userToUnfollow = await findUser(normalizedUsernameOfUserToUnfollow);

  if (!userToUnfollow) {
    return res.status(404).send({ errors: [{ title: 'User does not exist' }] });
  }

  if (normalizedUsernameOfUserToUnfollow === req.user.normalizedUsername) {
    return res
      .status(400)
      .send({ errors: [{ title: 'Cannot (un)follow oneself' }] });
  }

  const currentUserId = req.user._id;
  if (!userToUnfollow.followers.includes(currentUserId)) {
    return res
      .status(404)
      .send({ errors: [{ title: 'User is not followed' }] });
  }

  try {
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (follower) => follower.toString() !== currentUserId.toString(),
    );
    await userToUnfollow.save();
    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
});
