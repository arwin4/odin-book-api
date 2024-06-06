const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const {
  createRandomPost,
  addRandomLikesToPost,
  createRandomComment,
} = require('./generateData');
const randomIntFromInterval = require('../utils/randomIntFromInterval');

/**
 * Add a new post by a random bot user every 10 minutes on average, with likes
 * and comments.
 */
function autoPost() {
  setInterval(async () => {
    if (Math.random() < 0.1) {
      const randomAuthorArray = await User.aggregate([
        { $match: { isBot: true } },
        { $sample: { size: 1 } },
      ]);
      const randomAuthor = randomAuthorArray[0];

      const randomBotUsers = await User.aggregate([
        { $match: { isBot: true } },
        { $sample: { size: randomIntFromInterval(5, 50) } },
      ]);

      const post = createRandomPost(randomAuthor);
      post.dateCreated = new Date();

      addRandomLikesToPost(post, randomBotUsers);

      const comments = [];
      const numberOfComments = randomIntFromInterval(1, randomBotUsers.length);
      for (let i = 0; i < numberOfComments; i += 1) {
        comments.push(createRandomComment(post, randomBotUsers[i]));
      }

      try {
        await Promise.all([
          Post.insertMany([post]),
          Comment.insertMany(comments),
        ]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    }
  }, 60000);
}

module.exports = autoPost;
