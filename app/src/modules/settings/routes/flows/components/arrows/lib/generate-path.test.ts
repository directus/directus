import { generatePath } from './generate-path';
import { Vector2 } from '@/utils/vector2';
import { describe, expect, it } from 'vitest';

describe('generatePath', () => {
	describe('error handling', () => {
		it('should throw an error when points array is empty', () => {
			expect(() => generatePath([])).toThrow('generatePath requires at least one point');
		});

		it('should throw an Error type specifically', () => {
			expect(() => generatePath([])).toThrow(Error);
		});
	});

	describe('single point', () => {
		it('should generate path for a single point', () => {
			const points = [new Vector2(10, 20)];
			const result = generatePath(points);

			// Expected: M 18 20 L 18 20 M 18 20 L 10 12 M 18 20 L 10 28
			// The first point gets 8px x-offset: 10 + 8 = 18
			// Arrow size is 8px, so arrowhead points are at (18-8, 20-8) and (18-8, 20+8)
			expect(result).toMatch(/^M 18 20/);
			expect(result).toContain('L 18 20');
			expect(result).toContain('M 18 20 L 10 12 M 18 20 L 10 28');
		});

		it('should apply 8px x-offset to starting point', () => {
			const points = [new Vector2(0, 0)];
			const result = generatePath(points);

			expect(result).toMatch(/^M 8 0/);
		});

		it('should handle negative coordinates', () => {
			const points = [new Vector2(-10, -20)];
			const result = generatePath(points);

			expect(result).toMatch(/^M -2 -20/); // -10 + 8 = -2
			expect(result).toContain('L -2 -20');
		});
	});

	describe('two points', () => {
		it('should generate path for two points without corners', () => {
			const points = [new Vector2(10, 10), new Vector2(50, 50)];
			const result = generatePath(points);

			// Should start with offset first point, line to second point, then arrow
			expect(result).toMatch(/^M 18 10/);
			expect(result).toContain('L 50 50');
			expect(result).toContain('M 50 50 L 42 42 M 50 50 L 42 58');
		});

		it('should not call generateCorner for two points', () => {
			const points = [new Vector2(0, 0), new Vector2(100, 100)];
			const result = generatePath(points);

			// With only 2 points, no corners should be generated
			// The result should go straight from start to end
			expect(result).toMatch(/^M 8 0/);
			expect(result).toContain('L 100 100');
			expect(result).not.toContain('Q'); // No quadratic curves for corners
		});
	});

	describe('multiple points with corners', () => {
		it('should generate path with corners for three points', () => {
			const points = [new Vector2(0, 0), new Vector2(50, 0), new Vector2(50, 50)];

			const result = generatePath(points);

			// Should start with offset, include corner generation, end with arrow
			expect(result).toMatch(/^M 8 0/);
			expect(result).toContain('Q'); // Should contain quadratic curves for corners
			expect(result).toContain('L 50 50');
			expect(result).toContain('M 50 50 L 42 42 M 50 50 L 42 58');
		});

		it('should call generateCorner for each intermediate point', () => {
			const points = [new Vector2(0, 0), new Vector2(25, 0), new Vector2(50, 0), new Vector2(50, 50)];

			const result = generatePath(points);

			// With 4 points, we should have 2 intermediate points (indices 1 and 2)
			// The result should contain quadratic curves for each corner
			expect(result).toContain('Q'); // Should contain quadratic curves
			// Count the number of Q commands to verify corner generation
			const qCount = (result.match(/Q/g) || []).length;
			expect(qCount).toBe(2); // Should have 2 corners for 4 points
		});

		it('should handle complex multi-point paths', () => {
			const points = [
				new Vector2(0, 0),
				new Vector2(20, 0),
				new Vector2(20, 20),
				new Vector2(40, 20),
				new Vector2(40, 40),
			];

			const result = generatePath(points);

			expect(result).toMatch(/^M 8 0/);
			expect(result).toContain('L 40 40'); // Line to final point
			expect(result).toContain('M 40 40 L 32 32 M 40 40 L 32 48'); // Arrow at end
		});
	});

	describe('arrowhead generation', () => {
		it('should generate correct arrowhead for horizontal line', () => {
			const points = [new Vector2(0, 10), new Vector2(50, 10)];
			const result = generatePath(points);

			// Arrow should point left with 8px size
			expect(result).toContain('M 50 10 L 42 2 M 50 10 L 42 18');
		});

		it('should generate correct arrowhead for vertical line', () => {
			const points = [new Vector2(10, 0), new Vector2(10, 50)];
			const result = generatePath(points);

			// Arrow should point up with 8px size
			expect(result).toContain('M 10 50 L 2 42 M 10 50 L 2 58');
		});

		it('should use consistent arrow size', () => {
			const points = [new Vector2(100, 100), new Vector2(200, 200)];
			const result = generatePath(points);

			// Both arrow lines should be 8px offset from the end point
			expect(result).toContain('M 200 200 L 192 192 M 200 200 L 192 208');
		});
	});

	describe('edge cases', () => {
		it('should handle points with decimal coordinates', () => {
			const points = [new Vector2(10.5, 20.7), new Vector2(30.2, 40.9)];
			const result = generatePath(points);

			expect(result).toMatch(/^M 18\.5 20\.7/);
			expect(result).toContain('L 30.2 40.9');
		});

		it('should handle zero coordinates', () => {
			const points = [new Vector2(0, 0), new Vector2(0, 0)];
			const result = generatePath(points);

			expect(result).toMatch(/^M 8 0/);
			expect(result).toContain('L 0 0');
			expect(result).toContain('M 0 0 L -8 -8 M 0 0 L -8 8');
		});

		it('should handle large coordinates', () => {
			const points = [new Vector2(1000, 2000), new Vector2(5000, 10000)];
			const result = generatePath(points);

			expect(result).toMatch(/^M 1008 2000/);
			expect(result).toContain('L 5000 10000');
		});

		it('should modify original first point due to Vector2.add behavior', () => {
			const originalPoints = [new Vector2(10, 10), new Vector2(20, 20)];
			const originalFirstX = originalPoints[0]!.x;

			generatePath(originalPoints);

			// Vector2.add modifies the original vector, so first point should be changed
			expect(originalPoints[0]!.x).toBe(originalFirstX + 8);
			expect(originalPoints[1]!.x).toBe(20); // Second point should be unchanged
		});
	});

	describe('return value format', () => {
		it('should return a valid SVG path string', () => {
			const points = [new Vector2(10, 10), new Vector2(20, 20)];
			const result = generatePath(points);

			// Should start with M (move to) command
			expect(result).toMatch(/^M\s/);
			// Should contain L (line to) commands
			expect(result).toContain('L ');
		});

		it('should return string type', () => {
			const points = [new Vector2(0, 0)];
			const result = generatePath(points);

			expect(typeof result).toBe('string');
		});

		it('should have consistent path structure', () => {
			const points = [new Vector2(0, 0), new Vector2(10, 10)];
			const result = generatePath(points);

			// Pattern: M start L end M arrowStart L arrowPoint1 M arrowStart L arrowPoint2
			const pathParts = result.split(' ');
			expect(pathParts[0]).toBe('M'); // Start with move
			expect(pathParts.filter((part) => part === 'L')).toHaveLength(3); // Three line commands
			expect(pathParts.filter((part) => part === 'M')).toHaveLength(3); // Three move commands
		});
	});
});
