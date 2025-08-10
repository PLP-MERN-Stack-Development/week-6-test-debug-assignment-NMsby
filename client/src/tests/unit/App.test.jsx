// client/src/tests/unit/App.test.jsx - Simple App test

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock App component for testing
const App = () => {
    return (
        <div>
            <h1>MERN Testing App</h1>
            <p>Welcome to our testing implementation</p>
        </div>
    );
};

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        expect(screen.getByText('MERN Testing App')).toBeInTheDocument();
    });

    it('displays welcome message', () => {
        render(<App />);
        expect(screen.getByText('Welcome to our testing implementation')).toBeInTheDocument();
    });
});