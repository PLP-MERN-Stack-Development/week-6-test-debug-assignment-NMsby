// server/src/middleware/requestLogger.js - Request logging middleware

const winston = require('winston');
const path = require('path');

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'mern-testing-app' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Add request ID to request object
    req.requestId = requestId;

    // Log request start
    logger.info('Request started', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Override res.json to log responses
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;

        // Log response
        logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
            timestamp: new Date().toISOString()
        });

        // Log slow requests
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                requestId,
                method: req.method,
                url: req.url,
                duration: `${duration}ms`
            });
        }

        return originalJson.call(this, data);
    };

    // Log errors
    res.on('error', (error) => {
        logger.error('Response error', {
            requestId,
            method: req.method,
            url: req.url,
            error: error.message,
            stack: error.stack
        });
    });

    next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Log performance metrics
        if (duration > 500) { // Log requests slower than 500ms
            logger.warn('Performance warning', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                duration: `${duration.toFixed(2)}ms`,
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            });
        }
    });

    next();
};

// Memory usage monitor
const memoryMonitor = () => {
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
        };

        // Log memory warning if usage is high
        if (memUsageMB.heapUsed > 100) { // 100MB threshold
            logger.warn('High memory usage detected', {
                memoryUsage: memUsageMB,
                timestamp: new Date().toISOString()
            });
        }
    }, 60000); // Check every minute
};

// Database query logger
const queryLogger = (mongoose) => {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug('Database query', {
            collection: collectionName,
            method,
            query,
            document: doc,
            timestamp: new Date().toISOString()
        });
    });
};

module.exports = {
    logger,
    requestLogger,
    performanceMonitor,
    memoryMonitor,
    queryLogger
};