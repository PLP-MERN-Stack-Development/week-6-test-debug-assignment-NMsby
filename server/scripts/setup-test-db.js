// server/scripts/setup-test-db.js - Setup test database with sample data

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Post = require('../src/models/Post');

const setupTestDB = async () => {
    try {
        // Connect to database
        const mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mern_testing_test';
        await mongoose.connect(mongoURI);
        console.log('Connected to test database');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Post.deleteMany({});
        console.log('Cleared existing data');

        // Create test users
        const users = await User.create([
            {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                role: 'user'
            },
            {
                username: 'admin',
                email: 'admin@example.com',
                password: 'password123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            }
        ]);
        console.log('Created test users');

        // Create test categories
        const categories = await Category.create([
            {
                name: 'Technology',
                description: 'Posts about technology and programming',
                color: '#3b82f6'
            },
            {
                name: 'Lifestyle',
                description: 'Posts about lifestyle and personal development',
                color: '#10b981'
            },
            {
                name: 'Business',
                description: 'Posts about business and entrepreneurship',
                color: '#f59e0b'
            }
        ]);
        console.log('Created test categories');

        // Create test posts
        await Post.create([
            {
                title: 'Getting Started with MERN Stack',
                content: 'This is a comprehensive guide to getting started with the MERN stack. We will cover MongoDB, Express.js, React, and Node.js in detail.',
                author: users[0]._id,
                category: categories[0]._id,
                status: 'published',
                tags: ['javascript', 'react', 'mongodb', 'nodejs']
            },
            {
                title: 'Building Scalable APIs with Express',
                content: 'Learn how to build scalable and maintainable APIs using Express.js and best practices for API development.',
                author: users[1]._id,
                category: categories[0]._id,
                status: 'published',
                tags: ['express', 'api', 'nodejs', 'backend']
            },
            {
                title: 'Work-Life Balance in Tech',
                content: 'Maintaining work-life balance while working in the tech industry can be challenging. Here are some tips and strategies.',
                author: users[0]._id,
                category: categories[1]._id,
                status: 'draft',
                tags: ['lifestyle', 'tech', 'productivity']
            }
        ]);
        console.log('Created test posts');

        console.log('✅ Test database setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up test database:', error);
        process.exit(1);
    }
};

setupTestDB();