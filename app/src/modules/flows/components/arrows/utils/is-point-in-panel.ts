import { GRID_SIZE, PANEL_HEIGHT, PANEL_WIDTH } from '../../../constants';
import type { Panel } from '../types';
import { Vector2 } from '@/utils/vector2';

/**
 * Determines whether a given point intersects with any panel in a collection.
 * Performs collision detection by checking if the point falls within the rectangular
 * boundaries of any panel, accounting for grid-based positioning and panel dimensions.
 *
 * Each panel's boundaries are calculated using:
 * - Left edge: (panel.x - 2) * GRID_SIZE
 * - Right edge: (panel.x - 1 + PANEL_WIDTH) * GRID_SIZE
 * - Top edge: (panel.y - 1) * GRID_SIZE
 * - Bottom edge: (panel.y - 1 + PANEL_HEIGHT) * GRID_SIZE
 *
 * @param panels - Array of panel objects to check for intersection
 * @param point - The Vector2 coordinate to test for collision
 * @returns True if the point intersects with at least one panel, false otherwise
 *
 * @example
 * ```typescript
 * const panels = [{ x: 5, y: 3, id: 'panel1' }];
 * const point = new Vector2(100, 60);
 *
 * const hasCollision = isPointInPanel(panels, point);
 * // Returns true if point falls within panel boundaries
 * ```
 *
 * @see {@link GRID_SIZE} - Base grid unit for coordinate calculations
 * @see {@link PANEL_WIDTH} - Panel width in grid units
 * @see {@link PANEL_HEIGHT} - Panel height in grid units
 */
export function isPointInPanel(panels: Panel[], point: Vector2) {
	return (
		panels.findIndex(
			(panel) =>
				point.x >= (panel.x - 2) * GRID_SIZE &&
				point.x <= (panel.x - 1 + PANEL_WIDTH) * GRID_SIZE &&
				point.y >= (panel.y - 1) * GRID_SIZE &&
				point.y <= (panel.y - 1 + PANEL_HEIGHT) * GRID_SIZE,
		) !== -1
	);
}
