import { generateCorner } from './generate-corner';
import { Vector2 } from '@/utils/vector2';
import { describe, expect, it } from 'vitest';

describe('generateCorner', () => {
	describe('basic functionality', () => {
		it('should generate SVG path for horizontal to vertical corner', () => {
			const start = new Vector2(90, 100);
			const middle = new Vector2(100, 100);
			const end = new Vector2(100, 110);

			const result = generateCorner(start, middle, end);

			expect(result).toMatch(/^ L \d+(\.\d+)? \d+(\.\d+)? Q 100 100 \d+(\.\d+)? \d+(\.\d+)?$/);
			expect(result).toContain('L');
			expect(result).toContain('Q 100 100');
		});

		it('should generate SVG path for vertical to horizontal corner', () => {
			const start = new Vector2(100, 90);
			const middle = new Vector2(100, 100);
			const end = new Vector2(110, 100);

			const result = generateCorner(start, middle, end);

			expect(result).toMatch(/^ L \d+(\.\d+)? \d+(\.\d+)? Q 100 100 \d+(\.\d+)? \d+(\.\d+)?$/);
			expect(result).toContain('L');
			expect(result).toContain('Q 100 100');
		});

		it('should generate SVG path for diagonal corner', () => {
			const start = new Vector2(0, 0);
			const middle = new Vector2(50, 50);
			const end = new Vector2(100, 50);

			const result = generateCorner(start, middle, end);

			expect(result).toMatch(/^ L \d+(\.\d+)? \d+(\.\d+)? Q 50 50 \d+(\.\d+)? \d+(\.\d+)?$/);
			expect(result).toContain('L');
			expect(result).toContain('Q 50 50');
		});
	});

	describe('SVG path format', () => {
		it('should start with space and L command', () => {
			const start = new Vector2(0, 0);
			const middle = new Vector2(10, 10);
			const end = new Vector2(20, 10);

			const result = generateCorner(start, middle, end);

			expect(result).toMatch(/^ L/);
		});

		it('should contain Q command with middle point as control point', () => {
			const start = new Vector2(0, 0);
			const middle = new Vector2(15, 25);
			const end = new Vector2(30, 25);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 15 25');
		});

		it('should have correct structure: space L x y Q x y x y', () => {
			const start = new Vector2(10, 20);
			const middle = new Vector2(30, 40);
			const end = new Vector2(50, 60);

			const result = generateCorner(start, middle, end);

			// Should match pattern: " L x y Q x y x y"
			expect(result).toMatch(/^ L \d+(\.\d+)? \d+(\.\d+)? Q \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
		});
	});

	describe('coordinate handling', () => {
		it('should handle negative coordinates', () => {
			const start = new Vector2(-10, -20);
			const middle = new Vector2(0, 0);
			const end = new Vector2(10, 20);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 0 0');
			expect(result).toMatch(/^ L/);
		});

		it('should handle decimal coordinates', () => {
			const start = new Vector2(1.5, 2.7);
			const middle = new Vector2(10.3, 15.8);
			const end = new Vector2(20.9, 25.1);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 10.3 15.8');
			expect(result).toMatch(/^ L/);
		});

		it('should handle zero coordinates', () => {
			const start = new Vector2(0, 10);
			const middle = new Vector2(0, 0);
			const end = new Vector2(10, 0);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 0 0');
			expect(result).toMatch(/^ L/);
		});

		it('should handle large coordinates', () => {
			const start = new Vector2(1000, 2000);
			const middle = new Vector2(1500, 1500);
			const end = new Vector2(2000, 1000);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 1500 1500');
			expect(result).toMatch(/^ L/);
		});
	});

	describe('corner types', () => {
		it('should handle sharp right angle turn', () => {
			const start = new Vector2(0, 50);
			const middle = new Vector2(50, 50);
			const end = new Vector2(50, 0);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});

		it('should handle obtuse angle turn', () => {
			const start = new Vector2(0, 0);
			const middle = new Vector2(50, 50);
			const end = new Vector2(0, 100);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});

		it('should handle acute angle turn', () => {
			const start = new Vector2(0, 50);
			const middle = new Vector2(50, 50);
			const end = new Vector2(60, 40);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});
	});

	describe('Vector2.moveNextTo integration', () => {
		it('should use moveNextTo to calculate approach and exit points', () => {
			const start = new Vector2(0, 100);
			const middle = new Vector2(100, 100);
			const end = new Vector2(100, 200);

			// Mock or calculate expected moveNextTo results
			const expectedApproachPoint = start.clone().moveNextTo(middle);
			const expectedExitPoint = end.clone().moveNextTo(middle);

			const result = generateCorner(start, middle, end);

			expect(result).toContain(`L ${expectedApproachPoint}`);
			expect(result).toContain(`Q ${middle} ${expectedExitPoint}`);
		});

		it('should create smooth transitions by offsetting from corner vertex', () => {
			const start = new Vector2(50, 100);
			const middle = new Vector2(100, 100);
			const end = new Vector2(100, 150);

			const result = generateCorner(start, middle, end);

			// The L command should not go exactly to the middle point
			// because moveNextTo creates an offset
			expect(result).not.toContain('L 100 100');
			expect(result).toContain('Q 100 100'); // But Q should use the exact middle
		});
	});

	describe('edge cases', () => {
		it('should handle collinear points (straight line)', () => {
			const start = new Vector2(0, 50);
			const middle = new Vector2(50, 50);
			const end = new Vector2(100, 50);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});

		it('should handle very close points', () => {
			const start = new Vector2(10, 10);
			const middle = new Vector2(10.1, 10.1);
			const end = new Vector2(10.2, 10.2);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 10.1 10.1');
			expect(result).toMatch(/^ L/);
		});

		it('should handle identical start and middle points', () => {
			const start = new Vector2(50, 50);
			const middle = new Vector2(50, 50);
			const end = new Vector2(100, 100);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});

		it('should handle identical middle and end points', () => {
			const start = new Vector2(0, 0);
			const middle = new Vector2(50, 50);
			const end = new Vector2(50, 50);

			const result = generateCorner(start, middle, end);

			expect(result).toContain('Q 50 50');
			expect(result).toMatch(/^ L/);
		});
	});
});
