// server/tests/unit/userModel.test.js - Unit tests for User model

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('User Model Unit Tests', () => {
    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.username).toBe(userData.username);
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.firstName).toBe(userData.firstName);
            expect(savedUser.lastName).toBe(userData.lastName);
            expect(savedUser.password).not.toBe(userData.password); // Should be hashed
            expect(savedUser.role).toBe('user'); // Default role
            expect(savedUser.isActive).toBe(true); // Default active
            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
        });

        it('should hash password before saving', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(20); // Hashed password is longer
        });

        it('should generate fullName virtual correctly', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            };

            const user = new User(userData);
            await user.save();

            expect(user.fullName).toBe('John Doe');
        });

        it('should fallback to username when no first/last name', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.fullName).toBe('testuser');
        });
    });

    describe('User Validation', () => {
        it('should fail validation without required fields', async () => {
            const user = new User({});

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.username).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        it('should fail validation with invalid email', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            };

            const user = new User(userData);

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.email).toBeDefined();
        });

        it('should fail validation with short password', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: '123' // Too short
            };

            const user = new User(userData);

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        it('should fail validation with invalid username', async () => {
            const userData = {
                username: 'ab', // Too short
                email: 'test@example.com',
                password: 'password123'
            };

            const user = new User(userData);

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.username).toBeDefined();
        });
    });

    describe('User Methods', () => {
        it('should compare passwords correctly', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            const isMatch = await user.comparePassword('password123');
            const isNotMatch = await user.comparePassword('wrongpassword');

            expect(isMatch).toBe(true);
            expect(isNotMatch).toBe(false);
        });

        it('should return public JSON without password', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            const publicUser = user.toPublicJSON();

            expect(publicUser.password).toBeUndefined();
            expect(publicUser.username).toBe('testuser');
            expect(publicUser.email).toBe('test@example.com');
        });

        it('should find user by credentials (email)', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            await User.create(userData);

            const foundUser = await User.findByCredentials('test@example.com');
            expect(foundUser).toBeDefined();
            expect(foundUser.email).toBe('test@example.com');
        });

        it('should find user by credentials (username)', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            await User.create(userData);

            const foundUser = await User.findByCredentials('testuser');
            expect(foundUser).toBeDefined();
            expect(foundUser.username).toBe('testuser');
        });

        it('should return null for non-existent user', async () => {
            const foundUser = await User.findByCredentials('nonexistent');
            expect(foundUser).toBeNull();
        });
    });

    describe('User Uniqueness', () => {
        it('should enforce unique username', async () => {
            const userData1 = {
                username: 'testuser',
                email: 'test1@example.com',
                password: 'password123'
            };

            const userData2 = {
                username: 'testuser', // Same username
                email: 'test2@example.com',
                password: 'password123'
            };

            await User.create(userData1);

            let error;
            try {
                await User.create(userData2);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // MongoDB duplicate key error
        });

        it('should enforce unique email', async () => {
            const userData1 = {
                username: 'testuser1',
                email: 'test@example.com',
                password: 'password123'
            };

            const userData2 = {
                username: 'testuser2',
                email: 'test@example.com', // Same email
                password: 'password123'
            };

            await User.create(userData1);

            let error;
            try {
                await User.create(userData2);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // MongoDB duplicate key error
        });
    });
});