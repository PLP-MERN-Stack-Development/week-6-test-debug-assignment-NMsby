// server/tests/unit/setup.test.js - Simple test to verify Jest setup

describe('Server Jest Configuration Test', () => {
    test('should have Node.js environment', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(global).toBeDefined();
        expect(require).toBeDefined();
    });

    test('should perform basic assertions', () => {
        const sum = (a, b) => a + b;
        expect(sum(2, 3)).toBe(5);
        expect(sum(-1, 1)).toBe(0);
    });
});