// server/src/middleware/auth.js - Authentication middleware

const { extractToken, getUserFromToken } = require('../utils/auth');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
        }

        const user = await getUserFromToken(token);

        if (!user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token or user not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'User account is deactivated'
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'Token verification failed'
        });
    }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractToken(authHeader);

        if (token) {
            const user = await getUserFromToken(token);
            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or is admin
 */
const checkOwnership = (resourceField = 'author') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        // Check ownership based on resource field
        const resource = req.resource || req.body;

        if (resource && resource[resourceField]) {
            const resourceOwnerId = resource[resourceField].toString();
            const userId = req.user._id.toString();

            if (resourceOwnerId !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only access your own resources'
                });
            }
        }

        next();
    };
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    checkOwnership
};