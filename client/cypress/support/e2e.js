// client/cypress/support/e2e.js - Global E2E support file

// Import commands.js using ES2015 syntax:
import './commands';

// Import cypress code coverage support
import '@cypress/code-coverage/support';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
    // Prevent Cypress from failing the test on unhandled exceptions
    // that we expect (like network errors, etc.)
    if (err.message.includes('Network Error')) {
        return false;
    }
    if (err.message.includes('Loading chunk')) {
        return false;
    }
    if (err.message.includes('Non-Error promise rejection captured')) {
        return false;
    }

    // Return false to prevent the error from failing the test
    return false;
});

// Global before hook for all tests
beforeEach(() => {
    // Clear local storage
    cy.clearLocalStorage();

    // Clear cookies
    cy.clearCookies();

    // Set viewport for consistent testing
    cy.viewport(1280, 720);
});

// Global after hook
afterEach(() => {
    // Clean up any test data
    cy.task('cleanupTestData', null, { failOnStatusCode: false });
});

// Custom assertions
chai.use((chai, utils) => {
    // Add custom chai assertions if needed
    chai.Assertion.addMethod('validEmail', function() {
        const obj = this._obj;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        this.assert(
            emailRegex.test(obj),
            'expected #{this} to be a valid email',
            'expected #{this} not to be a valid email'
        );
    });
});