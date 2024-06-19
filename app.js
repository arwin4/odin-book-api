/* eslint-disable no-console */

const createError = require('http-errors');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const User = require('./models/user');
const { seedProductionDb } = require('./scripts/seedDb');

// Dev imports
let startMemoryMongoServer;
if (process.env.NODE_ENV === 'development') {
  startMemoryMongoServer =
    // eslint-disable-next-line global-require
    require('./tests/memoryMongoServer').startMemoryMongoServer;
}

const app = express();

// Import secrets
require('dotenv').config();

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  maxAge: 7200,
};
app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

/* == Passport == */
const sessionSecret = process.env.SESSION_SECRET;
app.use(
  session({ secret: sessionSecret, resave: false, saveUninitialized: true }),
);
app.use(passport.initialize());
app.use(passport.session());

const jwtStrategy = require('./passport/strategies/jwt');

passport.use(jwtStrategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');
const autoPost = require('./scripts/autoPost');

app.use('/auth/', authRouter);
app.use('/users/', userRouter);
app.use('/posts/', postRouter);

/* == Error Handling == */
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/* == Connect to database == */
async function connectToMongoAtlas() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('Succesfully connected to MongoDB Atlas.');
  } catch (err) {
    throw new Error(`Unable to connect to MongoDB Atlas. ${err}`);
  }
}

if (process.env.NODE_ENV === 'development') {
  startMemoryMongoServer().then(() =>
    console.log('Server has finished starting.'),
  );
} else if (process.env.NODE_ENV === 'production') {
  connectToMongoAtlas()
    .then(async () => {
      await seedProductionDb();
    })
    .then(() => console.log('Server has finished starting.'));
}

autoPost();

module.exports = app;
