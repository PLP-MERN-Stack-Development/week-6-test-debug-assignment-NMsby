// client/src/utils/debugger.js - Client-side debugging utilities

class ClientDebugger {
    constructor(namespace = 'app') {
        this.namespace = namespace;
        this.isEnabled = process.env.NODE_ENV === 'development' ||
            localStorage.getItem('debug') === 'true';
        this.logs = [];
        this.maxLogs = 1000;
    }

    // Enhanced console logging with context
    log(message, data = null, type = 'info') {
        if (!this.isEnabled) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            namespace: this.namespace,
            type,
            message,
            data: this.sanitizeData(data),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Store log entry
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output with styling
        const style = this.getConsoleStyle(type);
        console.group(`%c[${this.namespace}] ${message}`, style);

        if (data) {
            console.log('Data:', data);
        }

        console.log('Context:', {
            timestamp: logEntry.timestamp,
            url: logEntry.url
        });

        console.groupEnd();
    }

    // Debug React component lifecycle
    componentLifecycle(componentName, lifecycle, props = null, state = null) {
        if (!this.isEnabled) return;

        this.log(`${componentName} - ${lifecycle}`, {
            props: this.sanitizeProps(props),
            state: this.sanitizeState(state)
        }, 'lifecycle');
    }

    // Debug API calls
    apiCall(method, url, request = null, response = null, error = null) {
        if (!this.isEnabled) return;

        const logData = {
            method,
            url,
            request: this.sanitizeApiData(request),
            response: this.sanitizeApiData(response),
            error: error ? error.message : null,
            timestamp: new Date().toISOString()
        };

        const type = error ? 'error' : response?.status >= 400 ? 'warn' : 'info';
        this.log(`API ${method} ${url}`, logData, type);
    }

    // Debug Redux/state management
    stateChange(actionType, previousState, newState, payload = null) {
        if (!this.isEnabled) return;

        this.log(`State Change: ${actionType}`, {
            previousState: this.sanitizeState(previousState),
            newState: this.sanitizeState(newState),
            payload: this.sanitizeData(payload),
            diff: this.getStateDiff(previousState, newState)
        }, 'state');
    }

    // Debug user interactions
    userInteraction(event, target, data = null) {
        if (!this.isEnabled) return;

        this.log(`User Interaction: ${event}`, {
            target: target?.tagName || target,
            data: this.sanitizeData(data),
            timestamp: new Date().toISOString()
        }, 'interaction');
    }

    // Debug errors with context
    error(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context: this.sanitizeData(context),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        this.log(`Error: ${error.message}`, errorData, 'error');

        // Send error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            this.sendErrorToMonitoring(errorData);
        }
    }

    // Debug performance
    performance(label, startTime, additionalData = {}) {
        if (!this.isEnabled) return;

        const duration = performance.now() - startTime;

        this.log(`Performance: ${label}`, {
            duration: `${duration.toFixed(2)}ms`,
            ...additionalData
        }, duration > 100 ? 'warn' : 'info');
    }

    // Memory usage tracking
    memoryUsage(label = 'Memory Check') {
        if (!this.isEnabled || !performance.memory) return;

        const memory = performance.memory;

        this.log(label, {
            usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        }, 'memory');
    }

    // Network monitoring
    networkRequest(url, method, startTime, response = null, error = null) {
        if (!this.isEnabled) return;

        const duration = performance.now() - startTime;

        this.log(`Network: ${method} ${url}`, {
            duration: `${duration.toFixed(2)}ms`,
            status: response?.status,
            error: error?.message,
            size: response?.headers?.get('content-length')
        }, error ? 'error' : response?.status >= 400 ? 'warn' : 'info');
    }

    // Export logs for debugging
    exportLogs() {
        const logsJson = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Get logs for specific timeframe
    getLogsInTimeframe(minutes = 10) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.logs.filter(log => new Date(log.timestamp) > cutoff);
    }

    // Clear logs
    clearLogs() {
        this.logs = [];
        console.clear();
    }

    // Helper methods
    getConsoleStyle(type) {
        const styles = {
            info: 'color: #3498db; font-weight: bold;',
            warn: 'color: #f39c12; font-weight: bold;',
            error: 'color: #e74c3c; font-weight: bold;',
            lifecycle: 'color: #9b59b6; font-weight: bold;',
            state: 'color: #2ecc71; font-weight: bold;',
            interaction: 'color: #34495e; font-weight: bold;',
            memory: 'color: #e67e22; font-weight: bold;'
        };

        return styles[type] || styles.info;
    }

    sanitizeData(data) {
        if (!data) return data;

        if (typeof data === 'object') {
            const sanitized = { ...data };

            // Remove sensitive fields
            ['password', 'token', 'secret', 'key'].forEach(field => {
                if (sanitized[field]) {
                    sanitized[field] = '[FILTERED]';
                }
            });

            return sanitized;
        }

        return data;
    }

    sanitizeProps(props) {
        if (!props) return props;

        const sanitized = { ...props };

        // Remove functions from props for cleaner logging
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'function') {
                sanitized[key] = '[Function]';
            }
        });

        return this.sanitizeData(sanitized);
    }

    sanitizeState(state) {
        return this.sanitizeData(state);
    }

    sanitizeApiData(data) {
        if (!data) return data;

        const sanitized = this.sanitizeData(data);

        // Truncate large responses
        if (typeof sanitized === 'object' && JSON.stringify(sanitized).length > 1000) {
            return { ...sanitized, _truncated: true };
        }

        return sanitized;
    }

    getStateDiff(previous, current) {
        if (!previous || !current) return null;

        const diff = {};

        Object.keys(current).forEach(key => {
            if (previous[key] !== current[key]) {
                diff[key] = {
                    from: previous[key],
                    to: current[key]
                };
            }
        });

        return Object.keys(diff).length > 0 ? diff : null;
    }

    sendErrorToMonitoring(errorData) {
        // Implement error reporting to your monitoring service
        // This could be Sentry, LogRocket, etc.
        if (window.Sentry) {
            window.Sentry.captureException(new Error(errorData.message), {
                extra: errorData.context,
                tags: {
                    namespace: this.namespace
                }
            });
        }
    }
}

// Performance measurement hook for React components
export const usePerformanceMonitor = (componentName) => {
    const debugger = new ClientDebugger('performance');

    React.useEffect(() => {
        const startTime = performance.now();

        debugger.componentLifecycle(componentName, 'mount');

        return () => {
            debugger.performance(`${componentName} render time`, startTime);
            debugger.componentLifecycle(componentName, 'unmount');
        };
    }, [componentName, debugger]);
};

// API call debugger hook
export const useApiDebugger = () => {
    const debugger = new ClientDebugger('api');

    return React.useCallback((method, url, request, response, error) => {
        debugger.apiCall(method, url, request, response, error);
    }, [debugger]);
};

// Global error boundary integration
export const setupGlobalErrorHandling = (namespace = 'global') => {
    const debugger = new ClientDebugger(namespace);

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        debugger.error(new Error(event.reason), {
            type: 'unhandledrejection',
            promise: event.promise
        });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        debugger.error(event.error || new Error(event.message), {
            type: 'uncaughtError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
};

// Create debugger instances for different modules
export const createDebugger = (namespace) => new ClientDebugger(namespace);

export default ClientDebugger;