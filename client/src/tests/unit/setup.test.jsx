// client/src/tests/unit/setup.test.jsx - Simple test to verify Jest setup

import { render, screen } from '@testing-library/react';

// Simple component for testing
const TestComponent = () => {
    return <div data-testid="test-element">Hello, Testing!</div>;
};

describe('Jest Configuration Test', () => {
    test('should render a simple component', () => {
        render(<TestComponent />);
        const element = screen.getByTestId('test-element');
        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent('Hello, Testing!');
    });

    test('should have access to DOM APIs', () => {
        expect(document).toBeDefined();
        expect(window).toBeDefined();
        expect(localStorage).toBeDefined();
    });
});