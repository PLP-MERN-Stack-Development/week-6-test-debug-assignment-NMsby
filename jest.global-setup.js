// jest.global-setup.js - Global Jest setup

module.exports = async () => {
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRE = '1h';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/mern_testing_test';

    // Suppress console output during tests unless debugging
    if (!process.env.DEBUG_TESTS) {
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
    }

    // Global test timeout
    jest.setTimeout(30000);

    console.log('🧪 Jest Global Setup Complete');
};