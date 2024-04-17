const userSchema = {
  username: {
    exists: true,
    trim: true,
    escape: true,
    isLength: {
      options: { max: 20 },
      errorMessage: 'Username may be no longer than 20 characters',
    },
  },
  firstName: {
    exists: true,
    trim: true,
    escape: true,
    isLength: {
      options: { max: 20 },
      errorMessage: 'First name may be no longer than 20 characters',
    },
  },
  password: {
    exists: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 64 },
      errorMessage: 'Password must be between 3 and 64 characters long',
    },
  },
};

module.exports = userSchema;
