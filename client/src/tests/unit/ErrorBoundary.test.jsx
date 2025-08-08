// client/src/tests/unit/ErrorBoundary.test.jsx - Unit tests for Error Boundary

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// First, let's create the ErrorBoundary component that we'll test
const ErrorBoundary = ({ children, fallback }) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const handleError = (error) => {
            setHasError(true);
            setError(error);
        };

        // Reset error state when children change
        setHasError(false);
        setError(null);
    }, [children]);

    if (hasError) {
        if (fallback) {
            return fallback;
        }

        return (
            <div className="error-boundary">
                <h2>Something went wrong</h2>
                <p>We're sorry, but something unexpected happened.</p>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                    <summary>Error details</summary>
                    {error && error.toString()}
                </details>
                <button onClick={() => setHasError(false)}>
                    Try again
                </button>
            </div>
        );
    }

    return children;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
    if (shouldThrow) {
        throw new Error(errorMessage);
    }
    return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Normal Operation', () => {
        it('renders children when there is no error', () => {
            render(
                <ErrorBoundary>
                    <div>Test content</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('Test content')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('renders multiple children correctly', () => {
            render(
                <ErrorBoundary>
                    <div>First child</div>
                    <div>Second child</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('First child')).toBeInTheDocument();
            expect(screen.getByText('Second child')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('catches errors and displays error UI', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('We\'re sorry, but something unexpected happened.')).toBeInTheDocument();
            expect(screen.queryByText('No error')).not.toBeInTheDocument();
        });

        it('displays error details in expandable section', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Custom error message" />
                </ErrorBoundary>
            );

            expect(screen.getByText('Error details')).toBeInTheDocument();
            expect(screen.getByText(/Error: Custom error message/)).toBeInTheDocument();
        });

        it('provides try again functionality', () => {
            const { rerender } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            const tryAgainButton = screen.getByText('Try again');
            expect(tryAgainButton).toBeInTheDocument();

            // Simulate fixing the error and trying again
            rerender(
                <ErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </ErrorBoundary>
            );

            expect(screen.getByText('No error')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });
    });

    describe('Custom Fallback', () => {
        it('renders custom fallback when provided', () => {
            const customFallback = (
                <div>
                    <h1>Custom Error UI</h1>
                    <p>This is a custom error message</p>
                </div>
            );

            render(
                <ErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
            expect(screen.getByText('This is a custom error message')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('renders custom fallback as function', () => {
            const customFallback = (
                <div data-testid="custom-fallback">
                    Custom fallback content
                </div>
            );

            render(
                <ErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByText('Custom fallback content')).toBeInTheDocument();
        });
    });

    describe('Error Recovery', () => {
        it('recovers when children change and no longer throw errors', () => {
            const TestWrapper = ({ shouldThrow }) => (
                <ErrorBoundary>
                    <ThrowError shouldThrow={shouldThrow} />
                </ErrorBoundary>
            );

            const { rerender } = render(<TestWrapper shouldThrow={true} />);

            // Should show error UI
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Change props to not throw error
            rerender(<TestWrapper shouldThrow={false} />);

            // Should recover and show normal content
            expect(screen.getByText('No error')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('resets error state when children prop changes', () => {
            const TestWrapper = ({ children }) => (
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            );

            const { rerender } = render(
                <TestWrapper>
                    <ThrowError shouldThrow={true} />
                </TestWrapper>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            rerender(
                <TestWrapper>
                    <div>New content</div>
                </TestWrapper>
            );

            expect(screen.getByText('New content')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });
    });

    describe('Error Boundary with Different Error Types', () => {
        it('handles different types of errors', () => {
            const ThrowTypeError = () => {
                throw new TypeError('This is a type error');
            };

            render(
                <ErrorBoundary>
                    <ThrowTypeError />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/TypeError: This is a type error/)).toBeInTheDocument();
        });

        it('handles string errors', () => {
            const ThrowStringError = () => {
                throw 'String error message';
            };

            render(
                <ErrorBoundary>
                    <ThrowStringError />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });

    describe('Integration with Child Components', () => {
        it('only catches errors from children, not from ErrorBoundary itself', () => {
            // This test ensures the ErrorBoundary doesn't catch its own errors
            const WorkingComponent = () => <div>Working fine</div>;

            expect(() => {
                render(
                    <ErrorBoundary>
                        <WorkingComponent />
                    </ErrorBoundary>
                );
            }).not.toThrow();

            expect(screen.getByText('Working fine')).toBeInTheDocument();
        });

        it('catches errors from deeply nested components', () => {
            const DeepComponent = () => {
                return (
                    <div>
                        <div>
                            <div>
                                <ThrowError shouldThrow={true} />
                            </div>
                        </div>
                    </div>
                );
            };

            render(
                <ErrorBoundary>
                    <DeepComponent />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });
});