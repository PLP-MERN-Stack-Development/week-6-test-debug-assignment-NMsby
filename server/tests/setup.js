// server/tests/setup.js - Jest setup file for server-side tests

// Set test environment
process.env.NODE_ENV = 'test';

// REMOVE this line - jest.setTimeout(30000); - timeout is now set globally in jest.config.js

// Suppress mongoose deprecation warnings during tests
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception:', error);
});

// Clean up environment after tests
afterAll(() => {
    // Any global cleanup can go here
});