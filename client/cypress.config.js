// client/cypress.config.js - Cypress configuration

const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        apiUrl: 'http://localhost:5000',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.js',
        videosFolder: 'cypress/videos',
        screenshotsFolder: 'cypress/screenshots',
        fixturesFolder: 'cypress/fixtures',

        // Browser settings
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        pageLoadTimeout: 30000,

        // Viewport settings
        viewportWidth: 1280,
        viewportHeight: 720,

        // Video and screenshot settings
        video: true,
        screenshot: true,
        screenshotOnRunFailure: true,

        // Test isolation
        testIsolation: true,

        setupNodeEvents(on, config) {
            // implement node event listeners here
            require('@cypress/code-coverage/task')(on, config);

            // Set environment variables based on NODE_ENV
            if (config.env.NODE_ENV === 'development') {
                config.baseUrl = 'http://localhost:3000';
                config.env.apiUrl = 'http://localhost:5000';
            }

            return config;
        },

        env: {
            // Environment variables for tests
            apiUrl: 'http://localhost:5000',
            coverage: true
        }
    },

    component: {
        devServer: {
            framework: 'create-react-app',
            bundler: 'webpack',
        },
        specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/component.js',
    },
});