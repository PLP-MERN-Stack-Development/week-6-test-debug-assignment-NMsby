// server/src/utils/debugger.js - Debugging utilities

const util = require('util');
const { logger } = require('../middleware/requestLogger');

class Debugger {
    constructor(namespace = 'app') {
        this.namespace = namespace;
        this.isEnabled = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    }

    // Debug function calls
    trace(functionName, args = [], result = null) {
        if (!this.isEnabled) return;

        logger.debug('Function trace', {
            namespace: this.namespace,
            function: functionName,
            arguments: this.sanitizeArgs(args),
            result: this.sanitizeResult(result),
            timestamp: new Date().toISOString()
        });
    }

    // Debug database operations
    dbOperation(operation, collection, query = {}, result = null) {
        if (!this.isEnabled) return;

        logger.debug('Database operation', {
            namespace: this.namespace,
            operation,
            collection,
            query: this.sanitizeQuery(query),
            result: result ? 'success' : 'failed',
            timestamp: new Date().toISOString()
        });
    }

    // Debug API calls
    apiCall(method, url, headers = {}, body = null, response = null) {
        if (!this.isEnabled) return;

        logger.debug('API call', {
            namespace: this.namespace,
            method,
            url,
            headers: this.sanitizeHeaders(headers),
            body: this.sanitizeBody(body),
            responseStatus: response?.status,
            timestamp: new Date().toISOString()
        });
    }

    // Debug performance
    performance(label, startTime, additionalData = {}) {
        if (!this.isEnabled) return;

        const duration = Date.now() - startTime;

        logger.debug('Performance measurement', {
            namespace: this.namespace,
            label,
            duration: `${duration}ms`,
            ...additionalData,
            timestamp: new Date().toISOString()
        });

        if (duration > 1000) {
            logger.warn('Slow operation detected', {
                namespace: this.namespace,
                label,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Debug variable state
    variable(name, value, context = {}) {
        if (!this.isEnabled) return;

        logger.debug('Variable state', {
            namespace: this.namespace,
            variable: name,
            value: this.sanitizeValue(value),
            context,
            timestamp: new Date().toISOString()
        });
    }

    // Debug errors with context
    error(error, context = {}) {
        logger.error('Debug error', {
            namespace: this.namespace,
            error: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    }

    // Memory usage snapshot
    memorySnapshot(label = 'snapshot') {
        if (!this.isEnabled) return;

        const memUsage = process.memoryUsage();

        logger.debug('Memory snapshot', {
            namespace: this.namespace,
            label,
            memory: {
                rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
            },
            timestamp: new Date().toISOString()
        });
    }

    // Sanitization methods to prevent logging sensitive data
    sanitizeArgs(args) {
        return args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return this.sanitizeObject(arg);
            }
            return arg;
        });
    }

    sanitizeResult(result) {
        if (typeof result === 'object' && result !== null) {
            return this.sanitizeObject(result);
        }
        return result;
    }

    sanitizeQuery(query) {
        const sanitized = { ...query };
        // Remove password fields from queries
        if (sanitized.password) sanitized.password = '[FILTERED]';
        return sanitized;
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        // Remove authorization headers
        if (sanitized.authorization) sanitized.authorization = '[FILTERED]';
        if (sanitized.Authorization) sanitized.Authorization = '[FILTERED]';
        return sanitized;
    }

    sanitizeBody(body) {
        if (!body) return body;

        const sanitized = { ...body };
        // Remove sensitive fields
        if (sanitized.password) sanitized.password = '[FILTERED]';
        if (sanitized.token) sanitized.token = '[FILTERED]';
        if (sanitized.secret) sanitized.secret = '[FILTERED]';
        return sanitized;
    }

    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Filter sensitive keys
            if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret')) {
                sanitized[key] = '[FILTERED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    sanitizeValue(value) {
        if (typeof value === 'object' && value !== null) {
            return this.sanitizeObject(value);
        }
        return value;
    }
}

// Performance measurement decorator
const measurePerformance = (namespace = 'performance') => {
    const debugger = new Debugger(namespace);

    return (target, propertyName, descriptor) => {
        const method = descriptor.value;

        descriptor.value = async function (...args) {
            const startTime = Date.now();
            const label = `${target.constructor.name}.${propertyName}`;

            try {
                debugger.trace(label, args);
                const result = await method.apply(this, args);
                debugger.performance(label, startTime, { success: true });
                return result;
            } catch (error) {
                debugger.performance(label, startTime, { success: false, error: error.message });
                debugger.error(error, { function: label, arguments: args });
                throw error;
            }
        };

        return descriptor;
    };
};

// Create debugger instances for different modules
const createDebugger = (namespace) => new Debugger(namespace);

module.exports = {
    Debugger,
    createDebugger,
    measurePerformance
};