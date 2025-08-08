// server/tests/setup.js - Jest setup for server-side tests

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Increase timeout for tests
jest.setTimeout(30000);

// Global test database instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
    // Close database connection
    await mongoose.disconnect();

    // Stop MongoDB server
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Cleanup between tests
afterEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

// Global test utilities
global.testUtils = {
    // Helper to create test user
    createTestUser: async (userData = {}) => {
        const User = require('../src/models/User');
        const defaultUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            ...userData
        };

        return await User.create(defaultUser);
    },

    // Helper to create test post
    createTestPost: async (userId, postData = {}) => {
        const Post = require('../src/models/Post');
        const Category = require('../src/models/Category');

        // Create default category if needed
        let category = await Category.findOne({ name: 'Test Category' });
        if (!category) {
            category = await Category.create({
                name: 'Test Category',
                description: 'Test category for testing',
                color: '#3b82f6'
            });
        }

        const defaultPost = {
            title: 'Test Post',
            content: 'This is a test post content',
            author: userId,
            category: category._id,
            status: 'published',
            tags: ['test'],
            ...postData
        };

        return await Post.create(defaultPost);
    },

    // Helper to generate JWT token
    generateTestToken: (user) => {
        const { generateToken } = require('../src/utils/auth');
        return generateToken(user);
    },

    // Helper to wait for async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};