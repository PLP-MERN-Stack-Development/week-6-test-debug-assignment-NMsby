// server/src/controllers/postController.js - Post controller

const Post = require('../models/Post');
const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * @desc    Get all posts
 * @route   GET /api/posts
 * @access  Public
 */
const getAllPosts = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            author,
            tags,
            status = 'published',
            search
        } = req.query;

        const skip = (page - 1) * limit;
        let query = {};

        // Build query
        if (status && status !== 'all') {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        if (author) {
            query.author = author;
        }

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // Get posts with pagination
        const posts = await Post.find(query)
            .populate('author', 'username fullName avatar')
            .populate('category', 'name slug color')
            .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Post.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single post
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate('author', 'username fullName avatar bio')
            .populate('category', 'name slug color');

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Increment views (don't await to avoid slowing down response)
        Post.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

        res.status(200).json({
            success: true,
            data: { post }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res, next) => {
    try {
        const { title, content, category, tags, status, excerpt, featuredImage } = req.body;
        const author = req.user._id;

        // Verify category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                error: 'Category not found'
            });
        }

        const post = await Post.create({
            title,
            content,
            author,
            category,
            tags,
            status,
            excerpt,
            featuredImage
        });

        // Populate the created post
        await post.populate('author', 'username fullName avatar');
        await post.populate('category', 'name slug color');

        logger.info(`New post created: ${post.title} by ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update post
 * @route   PUT /api/posts/:id
 * @access  Private
 */
const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags, status, excerpt, featuredImage } = req.body;

        // Find post
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Check ownership
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this post'
            });
        }

        // Verify category exists if provided
        if (category && category !== post.category.toString()) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Category not found'
                });
            }
        }

        // Update post
        const updatedPost = await Post.findByIdAndUpdate(
            id,
            {
                title,
                content,
                category,
                tags,
                status,
                excerpt,
                featuredImage
            },
            { new: true, runValidators: true }
        )
            .populate('author', 'username fullName avatar')
            .populate('category', 'name slug color');

        logger.info(`Post updated: ${updatedPost.title} by ${req.user.username}`);

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            data: { post: updatedPost }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete post
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find post
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Check ownership
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this post'
            });
        }

        await Post.findByIdAndDelete(id);

        logger.info(`Post deleted: ${post.title} by ${req.user.username}`);

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle like on post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            success: true,
            message: isLiked ? 'Post unliked' : 'Post liked',
            data: {
                isLiked: !isLiked,
                likeCount: post.likes.length
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    toggleLike
};