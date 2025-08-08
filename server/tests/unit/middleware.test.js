// server/tests/unit/middleware.test.js - Unit tests for middleware functions

const { authenticate, authorize, checkOwnership } = require('../../src/middleware/auth');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');
const { getUserFromToken } = require('../../src/utils/auth');

// Mock dependencies
jest.mock('../../src/utils/auth');

describe('Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null,
            body: {},
            resource: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('Authentication Middleware', () => {
        it('should authenticate user with valid token', async () => {
            const mockUser = {
                _id: '507f1f77bcf86cd799439011',
                username: 'testuser',
                isActive: true
            };

            req.headers.authorization = 'Bearer valid.jwt.token';
            getUserFromToken.mockResolvedValue(mockUser);

            await authenticate(req, res, next);

            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject request without authorization header', async () => {
            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'No token provided'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token format', async () => {
            req.headers.authorization = 'Invalid token format';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'No token provided'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request when user not found', async () => {
            req.headers.authorization = 'Bearer valid.jwt.token';
            getUserFromToken.mockResolvedValue(null);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'Invalid token or user not found'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request for inactive user', async () => {
            const mockUser = {
                _id: '507f1f77bcf86cd799439011',
                username: 'testuser',
                isActive: false
            };

            req.headers.authorization = 'Bearer valid.jwt.token';
            getUserFromToken.mockResolvedValue(mockUser);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'User account is deactivated'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle token verification errors', async () => {
            req.headers.authorization = 'Bearer invalid.jwt.token';
            getUserFromToken.mockRejectedValue(new Error('Token verification failed'));

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'Token verification failed'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Authorization Middleware', () => {
        it('should allow access for user with correct role', () => {
            req.user = { role: 'admin' };
            const authorizeAdmin = authorize('admin');

            authorizeAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for user with one of multiple roles', () => {
            req.user = { role: 'moderator' };
            const authorizeMultiple = authorize('admin', 'moderator');

            authorizeMultiple(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for user without correct role', () => {
            req.user = { role: 'user' };
            const authorizeAdmin = authorize('admin');

            authorizeAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access for unauthenticated user', () => {
            const authorizeAdmin = authorize('admin');

            authorizeAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'Authentication required'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow access when no roles specified', () => {
            req.user = { role: 'user' };
            const authorizeAny = authorize();

            authorizeAny(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Ownership Check Middleware', () => {
        it('should allow admin access to any resource', () => {
            req.user = {
                role: 'admin',
                _id: '507f1f77bcf86cd799439011'
            };
            req.resource = {
                author: '507f1f77bcf86cd799439012' // Different user
            };

            const checkAuthorOwnership = checkOwnership('author');

            checkAuthorOwnership(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow resource owner access', () => {
            const userId = '507f1f77bcf86cd799439011';
            req.user = {
                role: 'user',
                _id: userId
            };
            req.resource = {
                author: userId
            };

            const checkAuthorOwnership = checkOwnership('author');

            checkAuthorOwnership(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access to non-owner non-admin', () => {
            req.user = {
                role: 'user',
                _id: '507f1f77bcf86cd799439011'
            };
            req.resource = {
                author: '507f1f77bcf86cd799439012' // Different user
            };

            const checkAuthorOwnership = checkOwnership('author');

            checkAuthorOwnership(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Forbidden',
                message: 'You can only access your own resources'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should check ownership from request body when no resource', () => {
            const userId = '507f1f77bcf86cd799439011';
            req.user = {
                role: 'user',
                _id: userId
            };
            req.body = {
                author: userId
            };

            const checkAuthorOwnership = checkOwnership('author');

            checkAuthorOwnership(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Error Handler Middleware', () => {
        it('should handle generic errors', () => {
            const error = new Error('Something went wrong');
            const req = { method: 'GET', path: '/test' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Something went wrong'
            });
        });

        it('should handle Mongoose CastError', () => {
            const error = {
                name: 'CastError',
                message: 'Cast to ObjectId failed'
            };
            const req = { method: 'GET', path: '/test' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Resource not found'
            });
        });

        it('should handle MongoDB duplicate key error', () => {
            const error = {
                code: 11000,
                keyValue: { email: 'test@example.com' }
            };
            const req = { method: 'POST', path: '/users' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'email already exists',
                field: 'email'
            });
        });

        it('should handle Mongoose ValidationError', () => {
            const error = {
                name: 'ValidationError',
                errors: {
                    email: { message: 'Email is required' },
                    password: { message: 'Password is too short' }
                }
            };
            const req = { method: 'POST', path: '/users' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: ['Email is required', 'Password is too short'],
                errors: error.errors
            });
        });

        it('should handle JWT errors', () => {
            const error = {
                name: 'JsonWebTokenError',
                message: 'invalid signature'
            };
            const req = { method: 'GET', path: '/protected' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid token'
            });
        });

        it('should handle expired JWT errors', () => {
            const error = {
                name: 'TokenExpiredError',
                message: 'jwt expired'
            };
            const req = { method: 'GET', path: '/protected' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token expired'
            });
        });
    });

    describe('Not Found Middleware', () => {
        it('should create 404 error for non-existent routes', () => {
            req.originalUrl = '/non-existent-route';

            notFound(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(next).toHaveBeenCalledWith(expect.any(Error));

            const error = next.mock.calls[0][0];
            expect(error.message).toBe('Not Found - /non-existent-route');
        });
    });
});