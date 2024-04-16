const userSchema = {
  username: {
    trim: true,
    escape: true,
    isLength: {
      options: { max: 20 },
      errorMessage: 'Username may be no longer than 20 characters',
    },
  },
  password: {
    trim: true,
    isLength: {
      options: { min: 3, max: 64 },
      errorMessage: 'Password must be between 3 and 64 characters long',
    },
  },
};

module.exports = userSchema;
