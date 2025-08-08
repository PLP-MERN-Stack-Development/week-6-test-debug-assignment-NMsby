// server/tests/unit/authUtils.test.js - Unit tests for authentication utilities

const jwt = require('jsonwebtoken');
const {
    generateToken,
    verifyToken,
    extractToken,
    getUserFromToken
} = require('../../src/utils/auth');
const User = require('../../src/models/User');

// Mock User model
jest.mock('../../src/models/User');

describe('Authentication Utilities Unit Tests', () => {
    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const token = generateToken(mockUser);

            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

            // Verify token content
            const decoded = jwt.decode(token);
            expect(decoded.id).toBe(mockUser._id);
            expect(decoded.username).toBe(mockUser.username);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
            expect(decoded.iss).toBe('mern-testing-app');
            expect(decoded.aud).toBe('mern-testing-users');
        });

        it('should generate different tokens for different users', () => {
            const user1 = { ...mockUser };
            const user2 = { ...mockUser, _id: '507f1f77bcf86cd799439012' };

            const token1 = generateToken(user1);
            const token2 = generateToken(user2);

            expect(token1).not.toBe(token2);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const token = generateToken(mockUser);
            const decoded = verifyToken(token);

            expect(decoded.id).toBe(mockUser._id);
            expect(decoded.username).toBe(mockUser.username);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => verifyToken(invalidToken)).toThrow();
        });

        it('should throw error for expired token', () => {
            // Create token with very short expiry
            const shortExpiryToken = jwt.sign(
                { id: mockUser._id, username: mockUser.username },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1ms' }
            );

            // Wait for token to expire
            setTimeout(() => {
                expect(() => verifyToken(shortExpiryToken)).toThrow();
            }, 10);
        });

        it('should throw error for token with wrong issuer', () => {
            const wrongIssuerToken = jwt.sign(
                { id: mockUser._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { issuer: 'wrong-issuer' }
            );

            expect(() => verifyToken(wrongIssuerToken)).toThrow();
        });
    });

    describe('extractToken', () => {
        it('should extract token from valid Authorization header', () => {
            const token = 'valid.jwt.token';
            const authHeader = `Bearer ${token}`;

            const extracted = extractToken(authHeader);
            expect(extracted).toBe(token);
        });

        it('should return null for invalid Authorization header format', () => {
            const invalidHeaders = [
                'Token valid.jwt.token',
                'valid.jwt.token',
                'Bearer',
                ''
            ];

            invalidHeaders.forEach(header => {
                expect(extractToken(header)).toBeNull();
            });
        });

        it('should return null for undefined header', () => {
            expect(extractToken(undefined)).toBeNull();
            expect(extractToken(null)).toBeNull();
        });
    });

    describe('getUserFromToken', () => {
        it('should return user for valid token', async () => {
            const token = generateToken(mockUser);
            const mockUserDoc = {
                ...mockUser,
                select: jest.fn().mockReturnThis()
            };

            User.findById.mockResolvedValue(mockUserDoc);

            const user = await getUserFromToken(token);

            expect(User.findById).toHaveBeenCalledWith(mockUser._id);
            expect(mockUserDoc.select).toHaveBeenCalledWith('-password');
            expect(user).toBe(mockUserDoc);
        });

        it('should throw error for invalid token', async () => {
            const invalidToken = 'invalid.token';

            await expect(getUserFromToken(invalidToken)).rejects.toThrow('Invalid token');
        });

        it('should throw error when user not found', async () => {
            const token = generateToken(mockUser);
            User.findById.mockResolvedValue(null);

            await expect(getUserFromToken(token)).rejects.toThrow('Invalid token');
        });
    });
});