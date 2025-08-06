// server/src/routes/users.js - User routes

const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', authenticate, authorize('admin'), validatePagination, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, role, isActive } = req.query;
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', validateObjectId(), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email')
            .populate('posts', 'title slug createdAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;