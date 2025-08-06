// jest.config.js - Configuration file for Jest testing framework

module.exports = {
    // Base configuration for all tests
    projects: [
        // Server-side tests configuration
        {
            displayName: 'server',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/server/tests/**/*.test.js',
                '<rootDir>/server/tests/**/*.spec.js'
            ],
            moduleFileExtensions: ['js', 'json', 'node'],
            setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
            coverageDirectory: '<rootDir>/coverage/server',
            collectCoverageFrom: [
                'server/src/**/*.js',
                '!server/src/config/**',
                '!server/src/server.js',
                '!**/node_modules/**',
            ],
            rootDir: '.',
            roots: ['<rootDir>/server']
        },

        // Client-side tests configuration
        {
            displayName: 'client',
            testEnvironment: 'jest-environment-jsdom',
            testMatch: [
                '<rootDir>/client/src/**/*.test.{js,jsx}',
                '<rootDir>/client/src/**/*.spec.{js,jsx}'
            ],
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
            rootDir: '.',
            roots: ['<rootDir>/client']
        },
    ],

    // Global configuration
    testTimeout: 30000,
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
    modulePathIgnorePatterns: ['<rootDir>/build/'],
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
};