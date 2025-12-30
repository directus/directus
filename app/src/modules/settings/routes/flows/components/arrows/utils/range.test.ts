import { range } from './range';
import { describe, expect, it } from 'vitest';

describe('range', () => {
	describe('basic functionality', () => {
		it('should generate a simple range with step of 1', () => {
			const result = range(0, 5, 1);
			expect(result).toEqual([0, 1, 2, 3, 4, 5]);
		});

		it('should generate range with larger step size', () => {
			const result = range(0, 10, 2);
			expect(result).toEqual([0, 2, 4, 6, 8, 10]);
		});

		it('should generate range with step of 3', () => {
			const result = range(1, 10, 3);
			expect(result).toEqual([1, 4, 7, 10]);
		});

		it('should handle single value range (min equals max)', () => {
			const result = range(5, 5, 1);
			expect(result).toEqual([5]);
		});
	});

	describe('step alignment behavior', () => {
		it('should always include max value even when step does not align', () => {
			const result = range(0, 7, 3);
			expect(result).toEqual([0, 3, 6, 7]);
		});

		it('should include max when step overshoots by small amount', () => {
			const result = range(0, 11, 5);
			expect(result).toEqual([0, 5, 10, 11]);
		});

		it('should include max when only one step fits', () => {
			const result = range(0, 2, 5);
			expect(result).toEqual([0, 2]);
		});

		it('should handle case where max is exactly on step boundary', () => {
			const result = range(0, 9, 3);
			expect(result).toEqual([0, 3, 6, 9]);
		});
	});

	describe('decimal and floating point support', () => {
		it('should handle decimal step values', () => {
			const result = range(0, 1, 0.25);
			expect(result).toEqual([0, 0.25, 0.5, 0.75, 1]);
		});

		it('should handle decimal min and max values', () => {
			const result = range(1.5, 3.5, 0.5);
			expect(result).toEqual([1.5, 2, 2.5, 3, 3.5]);
		});

		it('should handle floating point precision correctly', () => {
			const result = range(0, 0.3, 0.1);
			// Using toBeCloseTo for floating point comparison
			expect(result).toHaveLength(4);
			expect(result[0]).toBeCloseTo(0);
			expect(result[1]).toBeCloseTo(0.1);
			expect(result[2]).toBeCloseTo(0.2);
			expect(result[3]).toBeCloseTo(0.3);
		});

		it('should handle very small decimal steps', () => {
			const result = range(0, 0.02, 0.01);
			expect(result).toHaveLength(3);
			expect(result[0]).toBeCloseTo(0);
			expect(result[1]).toBeCloseTo(0.01);
			expect(result[2]).toBeCloseTo(0.02);
		});
	});

	describe('negative numbers', () => {
		it('should handle negative starting values', () => {
			const result = range(-5, -1, 1);
			expect(result).toEqual([-5, -4, -3, -2, -1]);
		});

		it('should handle negative to positive range', () => {
			const result = range(-2, 2, 1);
			expect(result).toEqual([-2, -1, 0, 1, 2]);
		});

		it('should handle negative step with negative range', () => {
			const result = range(-10, -5, 2);
			expect(result).toEqual([-10, -8, -6, -5]);
		});

		it('should handle all negative values with decimal steps', () => {
			const result = range(-1, -0.5, 0.25);
			expect(result).toEqual([-1, -0.75, -0.5]);
		});
	});

	describe('edge cases', () => {
		it('should throw error when step is zero', () => {
			expect(() => range(0, 1, 0)).toThrow('Step cannot be zero as it would cause an infinite loop');
		});

		it('should throw error when step is exactly zero (floating point)', () => {
			expect(() => range(0, 1, 0.0)).toThrow('Step cannot be zero as it would cause an infinite loop');
		});

		it('should throw error when step is negative zero', () => {
			expect(() => range(0, 1, -0)).toThrow('Step cannot be zero as it would cause an infinite loop');
		});

		it('should handle very large step sizes', () => {
			const result = range(0, 5, 100);
			expect(result).toEqual([0, 5]);
		});

		it('should handle very small ranges with large steps', () => {
			const result = range(1, 1.1, 10);
			expect(result).toEqual([1, 1.1]);
		});

		it('should return only max when min equals max', () => {
			const result = range(42, 42, 1);
			expect(result).toEqual([42]);
		});

		it('should handle decimal min/max with integer step', () => {
			const result = range(1.7, 5.3, 1);
			expect(result).toEqual([1.7, 2.7, 3.7, 4.7, 5.3]);
		});
	});

	describe('return value properties', () => {
		it('should always return an array', () => {
			const result = range(0, 10, 2);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should always include the min value as first element', () => {
			const result1 = range(5, 10, 2);
			const result2 = range(-3, 7, 3);
			const result3 = range(0.5, 2.5, 0.7);

			expect(result1[0]).toBe(5);
			expect(result2[0]).toBe(-3);
			expect(result3[0]).toBe(0.5);
		});

		it('should always include the max value as last element', () => {
			const result1 = range(0, 7, 3);
			const result2 = range(1, 10, 4);
			const result3 = range(-5, -1, 2);

			expect(result1[result1.length - 1]).toBe(7);
			expect(result2[result2.length - 1]).toBe(10);
			expect(result3[result3.length - 1]).toBe(-1);
		});

		it('should have length of at least 1', () => {
			const result1 = range(0, 0, 1);
			const result2 = range(5, 5, 10);
			const result3 = range(-2, -2, 0.5);

			expect(result1.length).toBeGreaterThanOrEqual(1);
			expect(result2.length).toBeGreaterThanOrEqual(1);
			expect(result3.length).toBeGreaterThanOrEqual(1);
		});

		it('should contain only numbers', () => {
			const result = range(0, 5, 1.5);

			result.forEach((value) => {
				expect(typeof value).toBe('number');
			});
		});
	});

	describe('practical use cases', () => {
		it('should generate grid coordinates', () => {
			const xCoords = range(0, 100, 20);
			expect(xCoords).toEqual([0, 20, 40, 60, 80, 100]);
		});

		it('should generate percentage values', () => {
			const percentages = range(0, 1, 0.2);
			expect(percentages).toHaveLength(6);
			expect(percentages[0]).toBeCloseTo(0);
			expect(percentages[percentages.length - 1]).toBeCloseTo(1);
		});

		it('should generate time intervals', () => {
			const timeSteps = range(0, 60, 15); // Every 15 seconds in a minute
			expect(timeSteps).toEqual([0, 15, 30, 45, 60]);
		});

		it('should generate animation frames', () => {
			const frames = range(0, 1, 1 / 30); // 30 FPS for 1 second
			expect(frames).toHaveLength(32); // 0 to 1 inclusive with 30 steps + 1 final
			expect(frames[0]).toBe(0);
			expect(frames[frames.length - 1]).toBe(1);
		});
	});
});
