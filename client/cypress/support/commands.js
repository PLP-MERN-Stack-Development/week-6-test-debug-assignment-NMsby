// client/cypress/support/commands.js - Custom Cypress commands

// Add custom commands to the Cypress namespace
declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>
            register(userData: any): Chainable<void>
            createPost(postData: any): Chainable<void>
            cleanDatabase(): Chainable<void>
            getByTestId(testId: string): Chainable<Element>
            seedDatabase(): Chainable<void>
        }
    }
}

/**
 * Custom command to login
 * @example cy.login('test@example.com', 'password123')
 */
Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/login`,
        body: {
            identifier: email,
            password
        }
    }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;

        // Store token in localStorage
        window.localStorage.setItem('authToken', response.body.data.token);

        // Set authorization header for future requests
        cy.window().then((window) => {
            window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
        });
    });
});

/**
 * Custom command to register a new user
 * @example cy.register({ username: 'test', email: 'test@example.com', password: 'password123' })
 */
Cypress.Commands.add('register', (userData) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/register`,
        body: userData
    }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;

        return response.body.data;
    });
});

/**
 * Custom command to create a post (requires authentication)
 * @example cy.createPost({ title: 'Test Post', content: 'Test content' })
 */
Cypress.Commands.add('createPost', (postData) => {
    cy.window().then((window) => {
        const token = window.localStorage.getItem('authToken');

        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/posts`,
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: postData
        }).then((response) => {
            expect(response.status).to.eq(201);
            return response.body.data.post;
        });
    });
});

/**
 * Custom command to clean test database
 * @example cy.cleanDatabase()
 */
Cypress.Commands.add('cleanDatabase', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/test/cleanup`,
        failOnStatusCode: false
    });
});

/**
 * Custom command to seed database with test data
 * @example cy.seedDatabase()
 */
Cypress.Commands.add('seedDatabase', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/test/seed`,
        failOnStatusCode: false
    });
});

/**
 * Custom command to get element by test ID
 * @example cy.getByTestId('submit-button')
 */
Cypress.Commands.add('getByTestId', (testId) => {
    return cy.get(`[data-testid="${testId}"]`);
});

/**
 * Command to wait for element to be visible
 * @example cy.waitForElement('[data-testid="loading"]')
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
    cy.get(selector, { timeout }).should('be.visible');
});

/**
 * Command to wait for API call to complete
 * @example cy.waitForApi('GET', '/api/posts')
 */
Cypress.Commands.add('waitForApi', (method, url) => {
    cy.intercept(method, url).as('apiCall');
    cy.wait('@apiCall');
});

/**
 * Command to test accessibility
 * @example cy.testA11y()
 */
Cypress.Commands.add('testA11y', () => {
    cy.injectAxe();
    cy.checkA11y();
});

/**
 * Command to simulate typing with realistic delays
 * @example cy.realType('Hello World')
 */
Cypress.Commands.add('realType', (text, options = {}) => {
    const { delay = 50 } = options;

    for (let i = 0; i < text.length; i++) {
        cy.focused().type(text[i], { delay });
    }
});

/**
 * Command to upload file
 * @example cy.uploadFile('input[type="file"]', 'test-image.jpg')
 */
Cypress.Commands.add('uploadFile', (selector, fileName) => {
    cy.fixture(fileName, 'base64').then((fileContent) => {
        cy.get(selector).then(($input) => {
            const blob = Cypress.Blob.base64StringToBlob(fileContent);
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            $input[0].files = dataTransfer.files;

            // Trigger change event
            cy.wrap($input).trigger('change', { force: true });
        });
    });
});

/**
 * Command to check if element has CSS class
 * @example cy.hasClass('btn-primary')
 */
Cypress.Commands.add('hasClass', { prevSubject: true }, (subject, className) => {
    cy.wrap(subject).should('have.class', className);
});

/**
 * Command to wait for page to load completely
 * @example cy.waitForPageLoad()
 */
Cypress.Commands.add('waitForPageLoad', () => {
    cy.window().should('have.property', 'document');
    cy.document().should('have.property', 'readyState', 'complete');
});

/**
 * Command to test responsive design
 * @example cy.testResponsive()
 */
Cypress.Commands.add('testResponsive', () => {
    // Test desktop view
    cy.viewport(1280, 720);
    cy.wait(500);

    // Test tablet view
    cy.viewport(768, 1024);
    cy.wait(500);

    // Test mobile view
    cy.viewport(375, 667);
    cy.wait(500);

    // Return to desktop
    cy.viewport(1280, 720);
});