// server/src/utils/auth.js - JWT authentication utilities

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRE,
            issuer: 'mern-testing-app',
            audience: 'mern-testing-users'
        }
    );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET, {
        issuer: 'mern-testing-app',
        audience: 'mern-testing-users'
    });
};

/**
 * Extract token from authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7); // Remove 'Bearer ' prefix
};

/**
 * Get user from token
 * @param {String} token - JWT token
 * @returns {Object} User object
 */
const getUserFromToken = async (token) => {
    try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        return user;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    generateToken,
    verifyToken,
    extractToken,
    getUserFromToken
};