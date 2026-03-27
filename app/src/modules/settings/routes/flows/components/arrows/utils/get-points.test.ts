import { describe, expect, it } from 'vite-plus/test';
import { ATTACHMENT_OFFSET, GRID_SIZE } from '../../../constants';
import { getPoints } from './get-points';
import { Vector2 } from '@/utils/vector2';

describe('getPoints', () => {
	describe('basic functionality', () => {
		it('should calculate coordinates for a single panel at origin', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 0, // (1 - 1) * 18 + 0
				y: 0, // (1 - 1) * 18 + 0
			});
		});

		it('should calculate coordinates for a single panel with positive grid position', () => {
			const panel = { x: 3, y: 4 };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 36, // (3 - 1) * 18 + 0
				y: 54, // (4 - 1) * 18 + 0
			});
		});

		it('should apply offset to panel coordinates', () => {
			const panel = { x: 2, y: 2 };
			const offset = new Vector2(10, 15);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 28, // (2 - 1) * 18 + 10
				y: 33, // (2 - 1) * 18 + 15
			});
		});

		it('should handle negative offset values', () => {
			const panel = { x: 3, y: 3 };
			const offset = new Vector2(-10, -5);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 26, // (3 - 1) * 18 - 10
				y: 31, // (3 - 1) * 18 - 5
			});
		});
	});

	describe('with target panel', () => {
		it('should calculate coordinates for both source and target panels', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);
			const to = { x: 3, y: 2 };

			const result = getPoints(panel, offset, to);

			expect(result).toEqual({
				x: 0, // (1 - 1) * 18 + 0
				y: 0, // (1 - 1) * 18 + 0
				toX: 36 + ATTACHMENT_OFFSET.x, // (3 - 1) * 18 + ATTACHMENT_OFFSET.x
				toY: 18 + ATTACHMENT_OFFSET.y, // (2 - 1) * 18 + ATTACHMENT_OFFSET.y
			});
		});

		it('should apply attachment offset to target coordinates', () => {
			const panel = { x: 2, y: 2 };
			const offset = new Vector2(5, 10);
			const to = { x: 4, y: 3 };

			const result = getPoints(panel, offset, to);

			expect(result).toEqual({
				x: 23, // (2 - 1) * 18 + 5
				y: 28, // (2 - 1) * 18 + 10
				toX: 54 + ATTACHMENT_OFFSET.x, // (4 - 1) * 18 + ATTACHMENT_OFFSET.x
				toY: 36 + ATTACHMENT_OFFSET.y, // (3 - 1) * 18 + ATTACHMENT_OFFSET.y
			});
		});

		it('should handle target panel at origin', () => {
			const panel = { x: 5, y: 5 };
			const offset = new Vector2(0, 0);
			const to = { x: 1, y: 1 };

			const result = getPoints(panel, offset, to);

			expect(result).toEqual({
				x: 72, // (5 - 1) * 18 + 0
				y: 72, // (5 - 1) * 18 + 0
				toX: 0 + ATTACHMENT_OFFSET.x, // (1 - 1) * 18 + ATTACHMENT_OFFSET.x
				toY: 0 + ATTACHMENT_OFFSET.y, // (1 - 1) * 18 + ATTACHMENT_OFFSET.y
			});
		});

		it('should not apply offset to target coordinates', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(100, 200);
			const to = { x: 2, y: 2 };

			const result = getPoints(panel, offset, to);

			expect(result).toEqual({
				x: 100, // (1 - 1) * 18 + 100
				y: 200, // (1 - 1) * 18 + 200
				toX: 18 + ATTACHMENT_OFFSET.x, // (2 - 1) * 18 + ATTACHMENT_OFFSET.x (no offset applied)
				toY: 18 + ATTACHMENT_OFFSET.y, // (2 - 1) * 18 + ATTACHMENT_OFFSET.y (no offset applied)
			});
		});
	});

	describe('edge cases', () => {
		it('should handle large grid coordinates', () => {
			const panel = { x: 100, y: 200 };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 1782, // (100 - 1) * 18
				y: 3582, // (200 - 1) * 18
			});
		});

		it('should handle panels with additional properties', () => {
			const panel = { x: 2, y: 3, id: 'test', name: 'Test Panel' };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 18, // (2 - 1) * 18
				y: 36, // (3 - 1) * 18
			});
		});

		it('should handle target panel with additional properties', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);
			const to = { x: 2, y: 2, id: 'target', type: 'endpoint' };

			const result = getPoints(panel, offset, to);

			expect(result).toEqual({
				x: 0,
				y: 0,
				toX: 18 + ATTACHMENT_OFFSET.x,
				toY: 18 + ATTACHMENT_OFFSET.y,
			});
		});

		it('should work with decimal offset values', () => {
			const panel = { x: 2, y: 2 };
			const offset = new Vector2(1.5, 2.7);

			const result = getPoints(panel, offset);

			expect(result).toEqual({
				x: 19.5, // (2 - 1) * 18 + 1.5
				y: 20.7, // (2 - 1) * 18 + 2.7
			});
		});
	});

	describe('constants verification', () => {
		it('should use correct GRID_SIZE constant', () => {
			expect(GRID_SIZE).toBe(18);
		});

		it('should use correct ATTACHMENT_OFFSET constant', () => {
			expect(ATTACHMENT_OFFSET).toEqual(new Vector2(0, 54));
		});

		it('should calculate with expected GRID_SIZE', () => {
			const panel = { x: 2, y: 2 };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			// Verify calculation matches expected GRID_SIZE of 18
			expect(result.x).toBe((panel.x - 1) * 18);
			expect(result.y).toBe((panel.y - 1) * 18);
		});

		it('should calculate target with expected ATTACHMENT_OFFSET', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);
			const to = { x: 1, y: 1 };

			const result = getPoints(panel, offset, to);

			// Verify target coordinates include ATTACHMENT_OFFSET
			expect(result.toX).toBe(0 + ATTACHMENT_OFFSET.x);
			expect(result.toY).toBe(0 + ATTACHMENT_OFFSET.y);
		});
	});

	describe('return type validation', () => {
		it('should return object with x and y properties when no target provided', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);

			const result = getPoints(panel, offset);

			expect(result).toHaveProperty('x');
			expect(result).toHaveProperty('y');
			expect(result).not.toHaveProperty('toX');
			expect(result).not.toHaveProperty('toY');
		});

		it('should return object with x, y, toX, and toY properties when target provided', () => {
			const panel = { x: 1, y: 1 };
			const offset = new Vector2(0, 0);
			const to = { x: 2, y: 2 };

			const result = getPoints(panel, offset, to);

			expect(result).toHaveProperty('x');
			expect(result).toHaveProperty('y');
			expect(result).toHaveProperty('toX');
			expect(result).toHaveProperty('toY');
		});

		it('should return numeric values for all coordinates', () => {
			const panel = { x: 2, y: 3 };
			const offset = new Vector2(5, 10);
			const to = { x: 4, y: 5 };

			const result = getPoints(panel, offset, to);

			expect(typeof result.x).toBe('number');
			expect(typeof result.y).toBe('number');
			expect(typeof result.toX).toBe('number');
			expect(typeof result.toY).toBe('number');
		});
	});
});
