// server/src/routes/posts.js - Post routes

const express = require('express');
const {
    getAllPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    toggleLike
} = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
    validatePost,
    validateObjectId,
    validatePagination
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts with filtering and pagination
// @access  Public
router.get('/', validatePagination, optionalAuth, getAllPosts);

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', validateObjectId(), getPost);

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post('/', authenticate, validatePost, createPost);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', authenticate, validateObjectId(), validatePost, updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', authenticate, validateObjectId(), deletePost);

// @route   POST /api/posts/:id/like
// @desc    Toggle like on post
// @access  Private
router.post('/:id/like', authenticate, validateObjectId(), toggleLike);

module.exports = router;