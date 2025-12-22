import { Vector2 } from '@/utils/vector2';
import { ATTACHMENT_OFFSET, GRID_SIZE } from '../../../constants';

/**
 * Calculates grid-based coordinates for a panel and optionally for a target panel.
 *
 * This function converts grid positions to actual pixel coordinates by multiplying
 * the grid coordinates by the GRID_SIZE and applying the provided offset. When a
 * target panel is specified, it also calculates the target coordinates with the
 * appropriate attachment offset.
 *
 * @param panel - The source panel object containing x and y grid coordinates
 * @param panel.x - The x position of the panel in grid units (1-based)
 * @param panel.y - The y position of the panel in grid units (1-based)
 * @param offset - Vector2 offset to apply to the calculated coordinates
 * @param to - Optional target panel object for calculating connection endpoints
 * @param to.x - The x position of the target panel in grid units (1-based)
 * @param to.y - The y position of the target panel in grid units (1-based)
 *
 * @returns Object containing calculated coordinates:
 *   - x, y: Source panel coordinates in pixels
 *   - toX, toY: Target panel coordinates in pixels (only when 'to' parameter is provided)
 *
 * @example
 * // Calculate coordinates for a single panel
 * const coords = getPoints({ x: 2, y: 3 }, { x: 10, y: 20 });
 * // Returns: { x: GRID_SIZE + 10, y: 2 * GRID_SIZE + 20 }
 *
 * @example
 * // Calculate coordinates for connecting two panels
 * const coords = getPoints(
 *   { x: 1, y: 1 },
 *   { x: 0, y: 0 },
 *   { x: 3, y: 2 }
 * );
 * // Returns: {
 * //   x: 0, y: 0,
 * //   toX: 2 * GRID_SIZE + ATTACHMENT_OFFSET.x,
 * //   toY: GRID_SIZE + ATTACHMENT_OFFSET.y
 * // }
 */
export function getPoints(panel: Record<string, any>, offset: Vector2, to?: Record<string, any>) {
	const x = (panel.x - 1) * GRID_SIZE + offset.x;

	const y = (panel.y - 1) * GRID_SIZE + offset.y;

	if (to) {
		const toX = (to.x - 1) * GRID_SIZE + ATTACHMENT_OFFSET.x;

		const toY = (to.y - 1) * GRID_SIZE + ATTACHMENT_OFFSET.y;

		return { x, y, toX, toY };
	}

	return { x, y };
}
