// server/src/config/database.js - Database connection configuration

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/mern_testing_dev';

        const options = {
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 2000
        };

        const conn = await mongoose.connect(mongoURI, options);

        console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
        console.log(`Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        console.error('Make sure MongoDB service is running on your system');
        console.error('On Windows: Run "net start MongoDB" as administrator');
        process.exit(1);
    }
};

module.exports = connectDB;