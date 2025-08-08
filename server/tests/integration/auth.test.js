// server/tests/integration/auth.test.js - Integration tests for authentication

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('Authentication Integration Tests', () => {
    describe('POST /api/auth/register', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };

        it('should register a new user with valid data', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('User registered successfully');
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(validUserData.email);
            expect(res.body.data.user.username).toBe(validUserData.username);
            expect(res.body.data.user.password).toBeUndefined(); // Should not include password
        });

        it('should fail with invalid email', async () => {
            const invalidData = { ...validUserData, email: 'invalid-email' };

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
            expect(res.body.errors).toBeDefined();
        });

        it('should fail with short password', async () => {
            const invalidData = { ...validUserData, password: '123' };

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
            expect(res.body.errors).toBeDefined();
        });

        it('should fail with duplicate username', async () => {
            // Create first user
            await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            // Try to create second user with same username
            const duplicateData = {
                ...validUserData,
                email: 'different@example.com'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(duplicateData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('User already exists');
            expect(res.body.field).toBe('username');
        });

        it('should fail with duplicate email', async () => {
            // Create first user
            await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            // Try to create second user with same email
            const duplicateData = {
                ...validUserData,
                username: 'differentuser'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(duplicateData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('User already exists');
            expect(res.body.field).toBe('email');
        });

        it('should create user with default role and active status', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            expect(res.status).toBe(201);
            expect(res.body.data.user.role).toBe('user');
            expect(res.body.data.user.isActive).toBe(true);
        });

        it('should hash password before storing', async () => {
            await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            const user = await User.findOne({ email: validUserData.email });
            expect(user.password).not.toBe(validUserData.password);
            expect(user.password.length).toBeGreaterThan(20); // Hashed password is longer
        });
    });

    describe('POST /api/auth/login', () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            // Create a user for login tests
            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login with valid email and password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: userData.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login successful');
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should login with valid username and password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.username,
                    password: userData.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.username).toBe(userData.username);
        });

        it('should fail with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('should fail with non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('should fail with missing credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should update lastLogin timestamp', async () => {
            const beforeLogin = new Date();

            await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: userData.password
                });

            const user = await User.findOne({ email: userData.email });
            expect(user.lastLogin).toBeDefined();
            expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
        });

        it('should fail for inactive user', async () => {
            // Deactivate user
            await User.findOneAndUpdate(
                { email: userData.email },
                { isActive: false }
            );

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: userData.password
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Account is deactivated');
        });
    });

    describe('GET /api/auth/me', () => {
        let userToken;
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            // Register and login to get token
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            userToken = registerRes.body.data.token;
        });

        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.body.data.user.username).toBe(userData.username);
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Access denied');
            expect(res.body.message).toBe('No token provided');
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid.token.here');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Access denied');
        });

        it('should fail with malformed authorization header', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Invalid header format');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('No token provided');
        });
    });

    describe('PUT /api/auth/profile', () => {
        let userToken;
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            userToken = registerRes.body.data.token;
        });

        it('should update user profile with valid data', async () => {
            const updateData = {
                firstName: 'John',
                lastName: 'Doe',
                bio: 'Software developer and tech enthusiast'
            };

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profile updated successfully');
            expect(res.body.data.user.firstName).toBe(updateData.firstName);
            expect(res.body.data.user.lastName).toBe(updateData.lastName);
            expect(res.body.data.user.bio).toBe(updateData.bio);
        });

        it('should update only provided fields', async () => {
            const updateData = {
                firstName: 'John'
            };

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.data.user.firstName).toBe('John');
            expect(res.body.data.user.lastName).toBeUndefined();
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .send({ firstName: 'John' });

            expect(res.status).toBe(401);
        });

        it('should fail with invalid avatar URL', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ avatar: 'not-a-valid-url' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should fail with bio too long', async () => {
            const longBio = 'a'.repeat(501); // Exceeds 500 character limit

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ bio: longBio });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });
    });

    describe('PUT /api/auth/change-password', () => {
        let userToken;
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            userToken = registerRes.body.data.token;
        });

        it('should change password with valid current password', async () => {
            const changeData = {
                currentPassword: 'password123',
                newPassword: 'newpassword456'
            };

            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${userToken}`)
                .send(changeData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password changed successfully');

            // Verify user can login with new password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: 'newpassword456'
                });

            expect(loginRes.status).toBe(200);
        });

        it('should fail with incorrect current password', async () => {
            const changeData = {
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword456'
            };

            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${userToken}`)
                .send(changeData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Current password is incorrect');
        });

        it('should fail with short new password', async () => {
            const changeData = {
                currentPassword: 'password123',
                newPassword: '123'
            };

            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${userToken}`)
                .send(changeData);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword456'
                });

            expect(res.status).toBe(401);
        });

        it('should fail with missing fields', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should hash new password before storing', async () => {
            const changeData = {
                currentPassword: 'password123',
                newPassword: 'newpassword456'
            };

            await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${userToken}`)
                .send(changeData);

            const user = await User.findOne({ email: userData.email });
            expect(user.password).not.toBe('newpassword456');
            expect(user.password.length).toBeGreaterThan(20);
        });
    });

    describe('Authentication Flow Integration', () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };

        it('should complete full authentication flow', async () => {
            // 1. Register
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(registerRes.status).toBe(201);
            const { token } = registerRes.body.data;

            // 2. Get profile
            const profileRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(profileRes.status).toBe(200);
            expect(profileRes.body.data.user.email).toBe(userData.email);

            // 3. Update profile
            const updateRes = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ bio: 'Updated bio' });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.data.user.bio).toBe('Updated bio');

            // 4. Change password
            const changePasswordRes = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword456'
                });

            expect(changePasswordRes.status).toBe(200);

            // 5. Login with new password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: userData.email,
                    password: 'newpassword456'
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.data.user.bio).toBe('Updated bio');
        });

        it('should maintain security across requests', async () => {
            // Register user
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(userData);

            const { token } = registerRes.body.data;

            // Try to access protected route without token
            const unauthorizedRes = await request(app)
                .get('/api/auth/me');

            expect(unauthorizedRes.status).toBe(401);

            // Access same route with valid token
            const authorizedRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(authorizedRes.status).toBe(200);
        });
    });
});