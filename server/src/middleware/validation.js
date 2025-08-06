// server/src/middleware/validation.js - Input validation middleware

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: errors.array()
        });
    }

    next();
};

/**
 * User validation rules
 */
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

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

    handleValidationErrors
];

const validateUserLogin = [
    body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Username or email is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Post validation rules
 */
const validatePost = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),

    body('content')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters long'),

    body('category')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid category ID');
            }
            return true;
        }),

    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

    body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Each tag must be between 1 and 30 characters'),

    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status must be draft, published, or archived'),

    handleValidationErrors
];

/**
 * Category validation rules
 */
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),

    body('color')
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Color must be a valid hex color'),

    handleValidationErrors
];

/**
 * ObjectId validation
 */
const validateObjectId = (paramName = 'id') => [
    param(paramName)
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error(`Invalid ${paramName}`);
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validatePost,
    validateCategory,
    validateObjectId,
    validatePagination
};