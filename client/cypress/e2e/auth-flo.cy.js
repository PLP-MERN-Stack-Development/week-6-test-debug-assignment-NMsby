// client/cypress/e2e/auth-flow.cy.js - E2E tests for authentication flow

describe('Authentication Flow', () => {
    beforeEach(() => {
        // Clean database before each test
        cy.cleanDatabase();

        // Visit the application
        cy.visit('/');
    });

    describe('User Registration', () => {
        it('should register a new user successfully', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                // Navigate to registration page
                cy.getByTestId('register-link').click();
                cy.url().should('include', '/register');

                // Fill registration form
                cy.getByTestId('username-input').type(validUser.username);
                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);
                cy.getByTestId('firstName-input').type(validUser.firstName);
                cy.getByTestId('lastName-input').type(validUser.lastName);

                // Submit form
                cy.getByTestId('register-submit').click();

                // Should redirect to dashboard
                cy.url().should('include', '/dashboard');

                // Should show success message
                cy.getByTestId('success-message').should('contain', 'Registration successful');

                // Should show user info
                cy.getByTestId('user-name').should('contain', validUser.firstName);
            });
        });

        it('should show validation errors for invalid input', () => {
            cy.fixture('users').then((users) => {
                const { invalidUser } = users;

                cy.getByTestId('register-link').click();

                // Fill form with invalid data
                cy.getByTestId('username-input').type(invalidUser.username);
                cy.getByTestId('email-input').type(invalidUser.email);
                cy.getByTestId('password-input').type(invalidUser.password);

                cy.getByTestId('register-submit').click();

                // Should show validation errors
                cy.getByTestId('username-error').should('contain', 'at least 3 characters');
                cy.getByTestId('email-error').should('contain', 'valid email');
                cy.getByTestId('password-error').should('contain', 'at least 6 characters');

                // Should stay on registration page
                cy.url().should('include', '/register');
            });
        });

        it('should prevent registration with duplicate email', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                // Register user first via API
                cy.register(validUser);

                // Try to register same user via UI
                cy.getByTestId('register-link').click();

                cy.getByTestId('username-input').type('differentuser');
                cy.getByTestId('email-input').type(validUser.email); // Same email
                cy.getByTestId('password-input').type(validUser.password);

                cy.getByTestId('register-submit').click();

                // Should show error message
                cy.getByTestId('error-message').should('contain', 'already exists');
            });
        });

        it('should toggle password visibility', () => {
            cy.getByTestId('register-link').click();

            // Password should be hidden by default
            cy.getByTestId('password-input').should('have.attr', 'type', 'password');

            // Click toggle button
            cy.getByTestId('password-toggle').click();

            // Password should be visible
            cy.getByTestId('password-input').should('have.attr', 'type', 'text');

            // Click toggle again
            cy.getByTestId('password-toggle').click();

            // Password should be hidden again
            cy.getByTestId('password-input').should('have.attr', 'type', 'password');
        });
    });

    describe('User Login', () => {
        beforeEach(() => {
            // Create a user for login tests
            cy.fixture('users').then((users) => {
                cy.register(users.validUser);
            });
        });

        it('should login with valid credentials', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('login-link').click();
                cy.url().should('include', '/login');

                // Fill login form
                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);

                cy.getByTestId('login-submit').click();

                // Should redirect to dashboard
                cy.url().should('include', '/dashboard');

                // Should show user info
                cy.getByTestId('user-name').should('contain', validUser.firstName);

                // Should show logout button
                cy.getByTestId('logout-button').should('be.visible');
            });
        });

        it('should login with username instead of email', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('login-link').click();

                // Use username instead of email
                cy.getByTestId('email-input').type(validUser.username);
                cy.getByTestId('password-input').type(validUser.password);

                cy.getByTestId('login-submit').click();

                cy.url().should('include', '/dashboard');
            });
        });

        it('should show error for invalid credentials', () => {
            cy.getByTestId('login-link').click();

            cy.getByTestId('email-input').type('nonexistent@example.com');
            cy.getByTestId('password-input').type('wrongpassword');

            cy.getByTestId('login-submit').click();

            // Should show error message
            cy.getByTestId('error-message').should('contain', 'Invalid credentials');

            // Should stay on login page
            cy.url().should('include', '/login');
        });

        it('should show error for empty fields', () => {
            cy.getByTestId('login-link').click();

            cy.getByTestId('login-submit').click();

            // Should show validation errors
            cy.getByTestId('email-error').should('contain', 'required');
            cy.getByTestId('password-error').should('contain', 'required');
        });

        it('should show loading state during login', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('login-link').click();

                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);

                // Intercept login request to add delay
                cy.intercept('POST', '/api/auth/login', (req) => {
                    req.reply((res) => {
                        return new Promise((resolve) => {
                            setTimeout(() => resolve(res), 1000);
                        });
                    });
                }).as('loginRequest');

                cy.getByTestId('login-submit').click();

                // Should show loading spinner
                cy.getByTestId('loading-spinner').should('be.visible');

                // Submit button should be disabled
                cy.getByTestId('login-submit').should('be.disabled');

                cy.wait('@loginRequest');

                cy.url().should('include', '/dashboard');
            });
        });
    });

    describe('User Logout', () => {
        beforeEach(() => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;
                cy.register(validUser);
                cy.login(validUser.email, validUser.password);
                cy.visit('/dashboard');
            });
        });

        it('should logout successfully', () => {
            // Should be on dashboard
            cy.url().should('include', '/dashboard');
            cy.getByTestId('logout-button').should('be.visible');

            // Click logout
            cy.getByTestId('logout-button').click();

            // Should redirect to home page
            cy.url().should('not.include', '/dashboard');
            cy.url().should('eq', `${Cypress.config().baseUrl}/`);

            // Should show login/register links again
            cy.getByTestId('login-link').should('be.visible');
            cy.getByTestId('register-link').should('be.visible');

            // Should not show user info
            cy.getByTestId('user-name').should('not.exist');
        });

        it('should clear user data on logout', () => {
            cy.getByTestId('logout-button').click();

            // Check that localStorage is cleared
            cy.window().then((window) => {
                expect(window.localStorage.getItem('authToken')).to.be.null;
                expect(window.localStorage.getItem('user')).to.be.null;
            });
        });

        it('should redirect to login when accessing protected route after logout', () => {
            cy.getByTestId('logout-button').click();

            // Try to access protected route
            cy.visit('/dashboard');

            // Should redirect to login
            cy.url().should('include', '/login');
        });
    });

    describe('Protected Routes', () => {
        it('should redirect unauthenticated users to login', () => {
            // Try to access protected route without authentication
            cy.visit('/dashboard');

            // Should redirect to login
            cy.url().should('include', '/login');

            // Should show message about authentication required
            cy.getByTestId('auth-required-message').should('contain', 'login to continue');
        });

        it('should allow authenticated users to access protected routes', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;
                cy.register(validUser);
                cy.login(validUser.email, validUser.password);

                // Should be able to access dashboard
                cy.visit('/dashboard');
                cy.url().should('include', '/dashboard');

                // Should be able to access profile
                cy.visit('/profile');
                cy.url().should('include', '/profile');
            });
        });

        it('should persist authentication across page refreshes', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;
                cy.register(validUser);
                cy.login(validUser.email, validUser.password);

                cy.visit('/dashboard');

                // Refresh page
                cy.reload();

                // Should still be authenticated
                cy.url().should('include', '/dashboard');
                cy.getByTestId('user-name').should('contain', validUser.firstName);
            });
        });
    });

    describe('Remember Me Functionality', () => {
        beforeEach(() => {
            cy.fixture('users').then((users) => {
                cy.register(users.validUser);
            });
        });

        it('should remember user when remember me is checked', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('login-link').click();

                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);
                cy.getByTestId('remember-me-checkbox').check();

                cy.getByTestId('login-submit').click();

                cy.url().should('include', '/dashboard');

                // Clear session storage but keep localStorage
                cy.clearCookies({ domain: null });
                cy.window().then((window) => {
                    window.sessionStorage.clear();
                });

                // Refresh page
                cy.reload();

                // Should still be logged in
                cy.url().should('include', '/dashboard');
            });
        });

        it('should not remember user when remember me is not checked', () => {
            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('login-link').click();

                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);
                // Don't check remember me

                cy.getByTestId('login-submit').click();

                cy.url().should('include', '/dashboard');

                // Simulate browser close/reopen by clearing all storage
                cy.clearLocalStorage();
                cy.clearCookies();

                cy.visit('/dashboard');

                // Should redirect to login
                cy.url().should('include', '/login');
            });
        });
    });

    describe('Form Accessibility', () => {
        it('should be accessible with keyboard navigation', () => {
            cy.getByTestId('register-link').click();

            // Tab through form elements
            cy.get('body').tab();
            cy.focused().should('have.attr', 'data-testid', 'username-input');

            cy.focused().tab();
            cy.focused().should('have.attr', 'data-testid', 'email-input');

            cy.focused().tab();
            cy.focused().should('have.attr', 'data-testid', 'password-input');

            cy.focused().tab();
            cy.focused().should('have.attr', 'data-testid', 'firstName-input');

            cy.focused().tab();
            cy.focused().should('have.attr', 'data-testid', 'lastName-input');

            cy.focused().tab();
            cy.focused().should('have.attr', 'data-testid', 'register-submit');
        });

        it('should have proper ARIA labels and roles', () => {
            cy.getByTestId('login-link').click();

            // Check form has proper role
            cy.get('form').should('have.attr', 'role', 'form');

            // Check inputs have proper labels
            cy.getByTestId('email-input').should('have.attr', 'aria-label');
            cy.getByTestId('password-input').should('have.attr', 'aria-label');

            // Check error messages are associated with inputs
            cy.getByTestId('login-submit').click();

            cy.getByTestId('email-input').should('have.attr', 'aria-describedby');
            cy.getByTestId('password-input').should('have.attr', 'aria-describedby');
        });

        it('should announce errors to screen readers', () => {
            cy.getByTestId('login-link').click();

            cy.getByTestId('login-submit').click();

            // Error messages should have proper ARIA roles
            cy.getByTestId('email-error').should('have.attr', 'role', 'alert');
            cy.getByTestId('password-error').should('have.attr', 'role', 'alert');
        });
    });

    describe('Mobile Responsiveness', () => {
        it('should work on mobile devices', () => {
            cy.viewport('iphone-x');

            cy.fixture('users').then((users) => {
                const { validUser } = users;

                cy.getByTestId('mobile-menu-toggle').click();
                cy.getByTestId('mobile-register-link').click();

                // Form should be properly sized for mobile
                cy.getByTestId('registration-form').should('be.visible');

                // Fill form on mobile
                cy.getByTestId('username-input').type(validUser.username);
                cy.getByTestId('email-input').type(validUser.email);
                cy.getByTestId('password-input').type(validUser.password);

                cy.getByTestId('register-submit').click();

                cy.url().should('include', '/dashboard');
            });
        });

        it('should have proper touch targets', () => {
            cy.viewport('iphone-x');

            cy.getByTestId('login-link').click();

            // Buttons should be large enough for touch
            cy.getByTestId('login-submit').should('have.css', 'min-height', '44px');
            cy.getByTestId('password-toggle').should('have.css', 'min-height', '44px');
        });
    });
});