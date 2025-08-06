// jest.config.js - Configuration file for Jest testing framework

module.exports = {
    // Base configuration for all tests
    projects: [
        // Server-side tests configuration
        {
            displayName: 'server',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/server/tests/**/*.test.js'],
            moduleFileExtensions: ['js', 'json', 'node'],
            setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
            coverageDirectory: '<rootDir>/coverage/server',
            collectCoverageFrom: [
                'server/src/**/*.js',
                '!server/src/config/**',
                '!server/src/server.js',
                '!**/node_modules/**',
            ],
            // Remove testTimeout from here - it goes at global level
        },

        // Client-side tests configuration
        {
            displayName: 'client',
            testEnvironment: 'jest-environment-jsdom', // Specify full package name
            testMatch: ['<rootDir>/client/src/**/*.test.{js,jsx}'],
            moduleFileExtensions: ['js', 'jsx', 'json'],
            moduleNameMapper: {
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
                '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/tests/__mocks__/fileMock.js',
                '^@/(.*)$': '<rootDir>/client/src/$1',
            },
            setupFilesAfterEnv: ['<rootDir>/client/src/tests/setup.js'],
            transform: {
                '^.+\\.(js|jsx)$': 'babel-jest',
            },
            transformIgnorePatterns: [
                'node_modules/(?!(axios)/)',
            ],
            coverageDirectory: '<rootDir>/coverage/client',
            collectCoverageFrom: [
                'client/src/**/*.{js,jsx}',
                '!client/src/main.jsx',
                '!client/src/vite-env.d.ts',
                '!**/node_modules/**',
            ],
            // Remove testTimeout from here - it goes at global level
        },
    ],

    // Global configuration
    testTimeout: 30000, // Move testTimeout here at global level
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70,
        },
    },
    maxWorkers: '50%',

    // Additional React 19 compatibility settings
    modulePathIgnorePatterns: ['<rootDir>/build/'],
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
};