// client/src/components/ErrorBoundary.jsx - Error Boundary component for React

import React from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log error information
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // You can also log the error to an error reporting service here
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps) {
        // Reset error state when children change
        if (prevProps.children !== this.props.children && this.state.hasError) {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
                }
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">
                            ⚠️
                        </div>
                        <h2 className="error-boundary-title">
                            Something went wrong
                        </h2>
                        <p className="error-boundary-message">
                            We're sorry, but something unexpected happened. Please try again.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Error details (development only)</summary>
                                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                </pre>
                            </details>
                        )}

                        <div className="error-boundary-actions">
                            <button
                                className="error-boundary-retry"
                                onClick={this.handleRetry}
                                type="button"
                            >
                                Try again
                            </button>

                            {this.props.showReload && (
                                <button
                                    className="error-boundary-reload"
                                    onClick={() => window.location.reload()}
                                    type="button"
                                >
                                    Reload page
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    onError: PropTypes.func,
    showReload: PropTypes.bool
};

ErrorBoundary.defaultProps = {
    showReload: false
};

export default ErrorBoundary;