// server/src/controllers/authController.js - Authentication controller

const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({
                success: false,
                error: 'User already exists',
                field
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName
        });

        // Generate token
        const token = generateToken(user);

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toPublicJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        // Find user by email or username
        const user = await User.findByCredentials(identifier);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        logger.info(`User logged in: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toPublicJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        res.status(200).json({
            success: true,
            data: {
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, bio, avatar } = req.body;
        const userId = req.user._id;

        const user = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, bio, avatar },
            { new: true, runValidators: true }
        ).select('-password');

        logger.info(`User profile updated: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Get user with password
        const user = await User.findById(userId);

        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);

        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        logger.info(`Password changed for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};