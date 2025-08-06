// server/src/models/index.js - Models index file

const mongoose = require('mongoose');
const User = require('./User');
const Category = require('./Category');
const Post = require('./Post');

// Export all models
module.exports = {
    User,
    Category,
    Post,
    mongoose
};