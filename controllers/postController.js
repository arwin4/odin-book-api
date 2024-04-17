const { checkSchema } = require('express-validator');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const findUser = require('../utils/findUser');
const respondOnValidationError = require('../utils/respondOnValidationError');
const Post = require('../models/post');
const userSchema = require('../models/express-validator-schemas/user');

exports.getPosts = asyncHandler(async (req, res) => {});
