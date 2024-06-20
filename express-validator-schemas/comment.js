const commentSchema = {
  content: {
    exists: true,
    isString: true,
    isLength: {
      options: { min: 1, max: 500 },
      errorMessage: 'Comment must not exceed 500 characters',
    },
  },
};

module.exports = commentSchema;
