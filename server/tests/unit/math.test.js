// server/tests/unit/math.test.js - Simple math utility test

describe('Math Utilities', () => {
    const add = (a, b) => a + b;
    const multiply = (a, b) => a * b;

    describe('add function', () => {
        it('should add two positive numbers', () => {
            expect(add(2, 3)).toBe(5);
        });

        it('should add positive and negative numbers', () => {
            expect(add(5, -3)).toBe(2);
        });

        it('should handle zero', () => {
            expect(add(0, 5)).toBe(5);
        });
    });

    describe('multiply function', () => {
        it('should multiply two positive numbers', () => {
            expect(multiply(3, 4)).toBe(12);
        });

        it('should handle zero multiplication', () => {
            expect(multiply(5, 0)).toBe(0);
        });

        it('should handle negative numbers', () => {
            expect(multiply(-2, 3)).toBe(-6);
        });
    });
});