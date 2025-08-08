// jest.config.js - Jest configuration file for a MERN stack application

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
                '!server/src/**/*.config.js',
                '!**/node_modules/**',
                '!**/coverage/**',
                '!**/dist/**'
            ],
            coverageReporters: ['text', 'lcov', 'clover', 'html'],
            coverageThreshold: {
                global: {
                    statements: 70,
                    branches: 60,
                    functions: 70,
                    lines: 70,
                },
                './server/src/controllers/': {
                    statements: 80,
                    branches: 70,
                    functions: 80,
                    lines: 80,
                },
                './server/src/models/': {
                    statements: 85,
                    branches: 75,
                    functions: 85,
                    lines: 85,
                },
                './server/src/utils/': {
                    statements: 90,
                    branches: 80,
                    functions: 90,
                    lines: 90,
                }
            },
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
                'node_modules/(?!(axios|@testing-library)/)',
            ],
            coverageDirectory: '<rootDir>/coverage/client',
            collectCoverageFrom: [
                'client/src/**/*.{js,jsx}',
                '!client/src/main.jsx',
                '!client/src/vite-env.d.ts',
                '!client/src/tests/**',
                '!client/src/**/*.config.{js,jsx}',
                '!client/src/**/*.stories.{js,jsx}',
                '!**/node_modules/**',
                '!**/coverage/**',
                '!**/dist/**'
            ],
            coverageReporters: ['text', 'lcov', 'clover', 'html'],
            coverageThreshold: {
                global: {
                    statements: 70,
                    branches: 60,
                    functions: 70,
                    lines: 70,
                },
                './client/src/components/': {
                    statements: 80,
                    branches: 70,
                    functions: 80,
                    lines: 80,
                },
                './client/src/utils/': {
                    statements: 85,
                    branches: 75,
                    functions: 85,
                    lines: 85,
                }
            },
            rootDir: '.',
            roots: ['<rootDir>/client']
        },
    ],

    // Global configuration
    testTimeout: 30000,
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'clover', 'html', 'json-summary'],
    coverageDirectory: '<rootDir>/coverage',

    // Combined coverage thresholds
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70,
        },
    },

    // Performance settings
    maxWorkers: '50%',

    // File patterns to ignore
    modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/dist/'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/build/',
        '<rootDir>/dist/',
        '<rootDir>/client/cypress/'
    ],

    // Watch mode settings
    watchPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/coverage/',
        '<rootDir>/build/',
        '<rootDir>/dist/'
    ],

    // Reporters for CI/CD
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: '<rootDir>/coverage',
            outputName: 'junit.xml',
            ancestorSeparator: ' › ',
            uniqueOutputName: 'false',
            suiteNameTemplate: '{filepath}',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}'
        }]
    ],

    // Error handling
    errorOnDeprecated: true,

    // Global setup and teardown
    globalSetup: '<rootDir>/jest.global-setup.js',
    globalTeardown: '<rootDir>/jest.global-teardown.js'
};