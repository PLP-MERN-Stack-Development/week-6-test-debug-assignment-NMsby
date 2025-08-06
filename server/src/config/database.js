// server/src/config/database.js - Database connection configuration

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mern_testing_dev';

        const options = {
            // Remove deprecated options that are now default in Mongoose 6+
            // useNewUrlParser and useUnifiedTopology are no longer needed
        };

        const conn = await mongoose.connect(mongoURI, options);

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;