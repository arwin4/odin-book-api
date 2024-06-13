const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const findUser = require('../../utils/findUser');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET_KEY;

module.exports = new JwtStrategy(opts, async (jwtPayload, done) => {
  const { username } = jwtPayload;
  const user = await findUser(username);

  if (username === user?.normalizedUsername) return done(null, user);
  return done(null, false);
});
