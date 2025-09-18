import { Vector2 } from '@/utils/vector2';
import { describe, expect, it } from 'vitest';
import { GRID_SIZE, PANEL_HEIGHT, PANEL_WIDTH } from '../../../constants';
import type { Panel } from '../types';
import { isPointInPanel } from './is-point-in-panel';

describe('isPointInPanel', () => {
	// Helper function to create a test panel
	const createPanel = (x: number, y: number): Panel => ({
		id: 'test-panel',
		resolve: '',
		reject: '',
		x,
		y,
	});

	// Calculate expected panel boundaries for reference
	const getPanelBounds = (panel: Panel) => ({
		left: (panel.x - 2) * GRID_SIZE,
		right: (panel.x - 1 + PANEL_WIDTH) * GRID_SIZE,
		top: (panel.y - 1) * GRID_SIZE,
		bottom: (panel.y - 1 + PANEL_HEIGHT) * GRID_SIZE,
	});

	describe('single panel tests', () => {
		it('should return true for point inside panel center', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);

			const centerPoint = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

			const result = isPointInPanel([panel], centerPoint);
			expect(result).toBe(true);
		});

		it('should return true for point on panel left edge', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const edgePoint = new Vector2(bounds.left, bounds.top + 10);

			const result = isPointInPanel([panel], edgePoint);
			expect(result).toBe(true);
		});

		it('should return true for point on panel right edge', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const edgePoint = new Vector2(bounds.right, bounds.top + 10);

			const result = isPointInPanel([panel], edgePoint);
			expect(result).toBe(true);
		});

		it('should return true for point on panel top edge', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const edgePoint = new Vector2(bounds.left + 10, bounds.top);

			const result = isPointInPanel([panel], edgePoint);
			expect(result).toBe(true);
		});

		it('should return true for point on panel bottom edge', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const edgePoint = new Vector2(bounds.left + 10, bounds.bottom);

			const result = isPointInPanel([panel], edgePoint);
			expect(result).toBe(true);
		});

		it('should return true for point at panel corners', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);

			expect(isPointInPanel([panel], new Vector2(bounds.left, bounds.top))).toBe(true);
			expect(isPointInPanel([panel], new Vector2(bounds.right, bounds.top))).toBe(true);
			expect(isPointInPanel([panel], new Vector2(bounds.left, bounds.bottom))).toBe(true);
			expect(isPointInPanel([panel], new Vector2(bounds.right, bounds.bottom))).toBe(true);
		});

		it('should return false for point outside panel (left)', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const outsidePoint = new Vector2(bounds.left - 1, bounds.top + 10);

			const result = isPointInPanel([panel], outsidePoint);
			expect(result).toBe(false);
		});

		it('should return false for point outside panel (right)', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const outsidePoint = new Vector2(bounds.right + 1, bounds.top + 10);

			const result = isPointInPanel([panel], outsidePoint);
			expect(result).toBe(false);
		});

		it('should return false for point outside panel (above)', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const outsidePoint = new Vector2(bounds.left + 10, bounds.top - 1);

			const result = isPointInPanel([panel], outsidePoint);
			expect(result).toBe(false);
		});

		it('should return false for point outside panel (below)', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const outsidePoint = new Vector2(bounds.left + 10, bounds.bottom + 1);

			const result = isPointInPanel([panel], outsidePoint);
			expect(result).toBe(false);
		});
	});

	describe('multiple panels tests', () => {
		it('should return true if point is in any of multiple panels', () => {
			const panels = [createPanel(3, 3), createPanel(10, 5), createPanel(7, 8)];

			// Point inside the second panel
			const bounds = getPanelBounds(panels[1]!);

			const point = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

			const result = isPointInPanel(panels, point);
			expect(result).toBe(true);
		});

		it('should return false if point is not in any panel', () => {
			const panels = [createPanel(3, 3), createPanel(10, 5), createPanel(7, 8)];

			// Point far away from all panels
			const point = new Vector2(1000, 1000);

			const result = isPointInPanel(panels, point);
			expect(result).toBe(false);
		});

		it('should handle overlapping panels correctly', () => {
			const panels = [
				createPanel(5, 5),
				createPanel(5, 5), // Same position as first panel
			];

			const bounds = getPanelBounds(panels[0]!);

			const point = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

			const result = isPointInPanel(panels, point);
			expect(result).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should return false for empty panels array', () => {
			const point = new Vector2(100, 100);
			const result = isPointInPanel([], point);
			expect(result).toBe(false);
		});

		it('should handle negative coordinates', () => {
			const panel = createPanel(-5, -5);
			const bounds = getPanelBounds(panel);

			const point = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

			const result = isPointInPanel([panel], point);
			expect(result).toBe(true);
		});

		it('should handle zero coordinates', () => {
			const panel = createPanel(0, 0);
			const bounds = getPanelBounds(panel);

			const point = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

			const result = isPointInPanel([panel], point);
			expect(result).toBe(true);
		});

		it('should handle floating point coordinates', () => {
			const panel = createPanel(5, 5);
			const bounds = getPanelBounds(panel);
			const point = new Vector2(bounds.left + 0.5, bounds.top + 0.5);

			const result = isPointInPanel([panel], point);
			expect(result).toBe(true);
		});
	});

	describe('boundary calculations verification', () => {
		it('should correctly calculate panel boundaries with grid offset', () => {
			const panel = createPanel(5, 5);

			// Verify the boundary calculation matches our understanding
			const expectedLeft = (5 - 2) * GRID_SIZE; // 3 * 20 = 60
			const expectedRight = (5 - 1 + PANEL_WIDTH) * GRID_SIZE; // (4 + 14) * 20 = 360
			const expectedTop = (5 - 1) * GRID_SIZE; // 4 * 20 = 80

			// Test points just inside and outside these boundaries
			expect(isPointInPanel([panel], new Vector2(expectedLeft, expectedTop + 10))).toBe(true);
			expect(isPointInPanel([panel], new Vector2(expectedLeft - 1, expectedTop + 10))).toBe(false);
			expect(isPointInPanel([panel], new Vector2(expectedRight, expectedTop + 10))).toBe(true);
			expect(isPointInPanel([panel], new Vector2(expectedRight + 1, expectedTop + 10))).toBe(false);
		});

		it('should include the 1-grid buffer on the left side', () => {
			const panel = createPanel(5, 5);

			// The left boundary should be at (panel.x - 2) * GRID_SIZE
			// This gives us a 1-grid buffer compared to (panel.x - 1)
			const bufferLeft = (panel.x - 2) * GRID_SIZE;
			const normalLeft = (panel.x - 1) * GRID_SIZE;

			// Point in the buffer zone should be inside
			const bufferPoint = new Vector2((bufferLeft + normalLeft) / 2, panel.y * GRID_SIZE);
			expect(isPointInPanel([panel], bufferPoint)).toBe(true);
		});
	});

	describe('realistic flow diagram scenarios', () => {
		it('should work with typical flow diagram panel layout', () => {
			const panels = [
				createPanel(2, 2), // Trigger panel
				createPanel(6, 2), // First operation
				createPanel(10, 2), // Second operation
				createPanel(6, 6), // Conditional branch
			];

			// Test a point that's definitely outside all panels
			// Using a point far away from all panels
			const betweenPoint = new Vector2(1000, 1000);

			expect(isPointInPanel(panels, betweenPoint)).toBe(false);

			// Test points inside each panel (should be true)
			panels.forEach((panel) => {
				const bounds = getPanelBounds(panel);

				const centerPoint = new Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);

				expect(isPointInPanel(panels, centerPoint)).toBe(true);
			});
		});
	});
});
