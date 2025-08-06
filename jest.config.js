// jest.config.js - Jest configuration for both server and client-side tests

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
            testTimeout: 30000,
        },

        // Client-side tests configuration
        {
            displayName: 'client',
            testEnvironment: 'jsdom',
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
            testTimeout: 10000,
        },
    ],

    // Global configuration
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
};