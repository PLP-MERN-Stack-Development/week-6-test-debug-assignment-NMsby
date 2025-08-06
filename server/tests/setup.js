// server/tests/setup.js - Server-side test setup

// Set test environment
process.env.NODE_ENV = 'test';

// Set longer timeout for integration tests
jest.setTimeout(30000);

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