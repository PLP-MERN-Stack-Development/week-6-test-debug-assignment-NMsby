// server/src/routes/auth.js - Authentication routes

const express = require('express');
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
    authenticate,
    [
        body('firstName')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('First name cannot exceed 50 characters'),

        body('lastName')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Last name cannot exceed 50 characters'),

        body('bio')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio cannot exceed 500 characters'),

        body('avatar')
            .optional()
            .isURL()
            .withMessage('Avatar must be a valid URL'),

        handleValidationErrors
    ],
    updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password',
    authenticate,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),

        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long'),

        handleValidationErrors
    ],
    changePassword
);

module.exports = router;