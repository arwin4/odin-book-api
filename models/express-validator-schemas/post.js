const postSchema = {
  imageUrl: {
    exists: true,
    trim: true,
    isLength: {
      options: { max: 200 },
      errorMessage: 'URL length must not exceed 200 characters',
    },
  },
  description: {
    exists: true,
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: 'Description may be no longer than 500 characters',
    },
  },
};

module.exports = postSchema;
