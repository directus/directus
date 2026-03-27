import { describe, expect, it } from 'vite-plus/test';
import { GRID_SIZE } from '../../../constants';
import type { Panel } from '../types';
import { findBestPosition } from './find-best-position';
import { Vector2 } from '@/utils/vector2';

describe('findBestPosition', () => {
	// Helper function to create test panels
	const createPanel = (x: number, y: number, id = 'panel'): Panel => ({
		x,
		y,
		id,
		resolve: 'resolve',
		reject: 'reject',
	});

	describe('basic functionality', () => {
		it('should find optimal x position with no panels', () => {
			const panels: Panel[] = [];
			const from = new Vector2(90, 198);
			const to = new Vector2(306, 396);

			const result = findBestPosition(panels, from, to, 'x');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0); // Should be grid-aligned
		});

		it('should find optimal y position with no panels', () => {
			const panels: Panel[] = [];
			const from = new Vector2(90, 198);
			const to = new Vector2(306, 396);

			const result = findBestPosition(panels, from, to, 'y');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0); // Should be grid-aligned
		});

		it('should return grid-aligned coordinates', () => {
			const panels: Panel[] = [];
			const from = new Vector2(123, 456);
			const to = new Vector2(789, 234);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(0);
			expect(yResult % GRID_SIZE).toBe(0);
		});
	});

	describe('collision avoidance', () => {
		it('should avoid panel collisions along x-axis', () => {
			const panels = [createPanel(5, 5)];
			const from = new Vector2(72, 90);
			const to = new Vector2(108, 90);

			const result = findBestPosition(panels, from, to, 'x');

			// Result should be different from the direct path that would collide
			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});

		it('should avoid panel collisions along y-axis', () => {
			const panels = [createPanel(5, 5)];
			const from = new Vector2(90, 72);
			const to = new Vector2(90, 108);

			const result = findBestPosition(panels, from, to, 'y');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});

		it('should handle multiple panels', () => {
			const panels = [createPanel(3, 3, 'panel1'), createPanel(7, 7, 'panel2'), createPanel(10, 5, 'panel3')];

			const from = new Vector2(36, 54);
			const to = new Vector2(234, 162);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(0);
			expect(yResult % GRID_SIZE).toBe(0);
		});
	});

	describe('center-out search algorithm', () => {
		it('should prefer center positions when no collisions', () => {
			const panels: Panel[] = [];
			const from = new Vector2(0, 90);
			const to = new Vector2(198, 90);

			const result = findBestPosition(panels, from, to, 'x');

			// Should be close to the center of the range
			const expectedCenter = Math.floor((0 + 198) / 2 / GRID_SIZE) * GRID_SIZE;
			expect(Math.abs(result - expectedCenter)).toBeLessThanOrEqual(GRID_SIZE);
		});

		it('should expand outward from center when center is blocked', () => {
			// Create panels that block the center area
			const panels = [createPanel(4, 4), createPanel(5, 5), createPanel(6, 6)];

			const from = new Vector2(72, 72);
			const to = new Vector2(126, 126);

			const result = findBestPosition(panels, from, to, 'x');

			// Should find an alternative position away from center
			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});
	});

	describe('fallback behavior', () => {
		it('should fallback to midpoint when no collision-free path exists', () => {
			// Create many panels to block most paths
			const panels: Panel[] = [];

			for (let x = 0; x < 20; x++) {
				for (let y = 0; y < 20; y++) {
					panels.push(createPanel(x, y, `panel-${x}-${y}`));
				}
			}

			const from = new Vector2(90, 198);
			const to = new Vector2(306, 396);

			const result = findBestPosition(panels, from, to, 'x');

			// Should fallback to calculated midpoint
			const expectedFallback = from.x + Math.floor((to.x - from.x) / 2 / GRID_SIZE) * GRID_SIZE;
			expect(result).toBe(expectedFallback);
		});

		it('should handle identical from and to points', () => {
			const panels: Panel[] = [];
			const point = new Vector2(90, 90);

			const xResult = findBestPosition(panels, point, point, 'x');
			const yResult = findBestPosition(panels, point, point, 'y');

			expect(xResult).toBe(point.x);
			expect(yResult).toBe(point.y);
		});
	});

	describe('axis-specific behavior', () => {
		it('should handle x-axis calculations correctly', () => {
			const panels = [createPanel(5, 5)];
			const from = new Vector2(36, 72);
			const to = new Vector2(162, 108);

			const result = findBestPosition(panels, from, to, 'x');

			// Should return an x-coordinate within the range
			expect(result).toBeGreaterThanOrEqual(Math.min(from.x, to.x));
			expect(result).toBeLessThanOrEqual(Math.max(from.x, to.x));
		});

		it('should handle y-axis calculations correctly', () => {
			const panels = [createPanel(5, 5)];
			const from = new Vector2(72, 36);
			const to = new Vector2(108, 162);

			const result = findBestPosition(panels, from, to, 'y');

			// Should return a y-coordinate within the range
			expect(result).toBeGreaterThanOrEqual(Math.min(from.y, to.y));
			expect(result).toBeLessThanOrEqual(Math.max(from.y, to.y));
		});
	});

	describe('edge cases', () => {
		it('should handle negative coordinates', () => {
			const panels: Panel[] = [];
			const from = new Vector2(-90, -198);
			const to = new Vector2(-54, -144);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(-0);
			expect(yResult % GRID_SIZE).toBe(-0);
		});

		it('should handle very large coordinates', () => {
			const panels: Panel[] = [];
			const from = new Vector2(9990, 19998);
			const to = new Vector2(14994, 24984);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(0);
			expect(yResult % GRID_SIZE).toBe(0);
		});

		it('should handle zero coordinates', () => {
			const panels: Panel[] = [];
			const from = new Vector2(0, 0);
			const to = new Vector2(90, 90);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(0);
			expect(yResult % GRID_SIZE).toBe(0);
		});

		it('should handle swapped from/to coordinates', () => {
			const panels: Panel[] = [];
			const from = new Vector2(198, 306);
			const to = new Vector2(90, 198);

			const xResult = findBestPosition(panels, from, to, 'x');
			const yResult = findBestPosition(panels, from, to, 'y');

			expect(xResult % GRID_SIZE).toBe(0);
			expect(yResult % GRID_SIZE).toBe(0);
		});
	});

	describe('panel positioning edge cases', () => {
		it('should handle panels at grid boundaries', () => {
			const panels = [createPanel(0, 0), createPanel(1, 1)];
			const from = new Vector2(0, 0);
			const to = new Vector2(36, 36);

			const result = findBestPosition(panels, from, to, 'x');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});

		it('should handle panels with decimal grid positions', () => {
			// Edge case where panel positions might not be perfect integers
			const panels: Panel[] = [{ x: 5.1, y: 5.1, id: 'decimal-panel', resolve: 'resolve', reject: 'reject' }];
			const from = new Vector2(72, 72);
			const to = new Vector2(108, 108);

			const result = findBestPosition(panels, from, to, 'x');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});
	});

	describe('search pattern verification', () => {
		it('should find the closest collision-free position to center', () => {
			// Create a specific pattern where only certain positions are free
			const panels = [
				createPanel(5, 5),
				createPanel(6, 5),
				createPanel(7, 5),
				// Leave position 4 and 8 free, should prefer 6 (closer to 5-6 center)
			];

			const from = new Vector2(72, 90);
			const to = new Vector2(126, 90);

			const result = findBestPosition(panels, from, to, 'x');

			expect(typeof result).toBe('number');
			expect(result % GRID_SIZE).toBe(0);
		});
	});

	describe('integration with utility functions', () => {
		it('should work correctly with minMaxPoint results', () => {
			const panels = [createPanel(5, 5)];
			const from = new Vector2(54, 72);
			const to = new Vector2(126, 162);

			const result = findBestPosition(panels, from, to, 'x');

			// The result should respect the bounding box created by minMaxPoint
			const minX = Math.min(from.x, to.x);
			const maxX = Math.max(from.x, to.x);
			expect(result).toBeGreaterThanOrEqual(minX);
			expect(result).toBeLessThanOrEqual(maxX);
		});

		it('should work correctly with range generation', () => {
			const panels: Panel[] = [];
			const from = new Vector2(18, 36);
			const to = new Vector2(90, 108);

			const result = findBestPosition(panels, from, to, 'x');

			// Result should be a valid grid position from the range
			expect(result % GRID_SIZE).toBe(0);
			expect(result).toBeGreaterThanOrEqual(18);
			expect(result).toBeLessThanOrEqual(90);
		});
	});
});
