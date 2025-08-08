// server/src/middleware/errorHandler.js - Global error handling middleware

const { logger } = require('./requestLogger');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Set default error values
    let error = { ...err };
    error.message = err.message;

    // Log error details
    logger.error('Error occurred', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        user: req.user ? req.user._id : 'anonymous',
        timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new AppError(message, 400);
        error.field = field;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        const message = 'Validation failed';
        error = new AppError(message, 400);
        error.errors = err.errors;
        error.validationErrors = errors;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large';
        error = new AppError(message, 400);
    }

    // Rate limiting errors
    if (err.status === 429) {
        const message = 'Too many requests, please try again later';
        error = new AppError(message, 429);
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        const message = 'Database connection error';
        error = new AppError(message, 503);

        logger.error('Database connection error', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    }

    // Send error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    const errorResponse = {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err;
    }

    // Add field information for validation errors
    if (error.field) {
        errorResponse.field = error.field;
    }

    if (error.validationErrors) {
        errorResponse.error = error.validationErrors;
        errorResponse.errors = error.errors;
    }

    // Log critical errors
    if (statusCode >= 500) {
        logger.error('Critical error', {
            requestId: req.requestId,
            error: message,
            stack: err.stack,
            statusCode,
            timestamp: new Date().toISOString()
        });
    }

    res.status(statusCode).json(errorResponse);
};

// Not found middleware
const notFound = (req, res, next) => {
    const message = `Not Found - ${req.originalUrl}`;
    logger.warn('Route not found', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.status(404);
    next(new AppError(message, 404));
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
const healthCheck = (req, res) => {
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    };

    logger.info('Health check performed', {
        requestId: req.requestId,
        healthStatus,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        data: healthStatus
    });
};

module.exports = {
    AppError,
    errorHandler,
    notFound,
    asyncHandler,
    healthCheck
};