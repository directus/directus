import { GRID_SIZE, PANEL_HEIGHT, PANEL_WIDTH } from '../../../constants';
import type { Panel } from '../types';
import { isPointInPanel } from '../utils/is-point-in-panel';
import { minMaxPoint } from '../utils/min-max-point';
import { range } from '../utils/range';
import { Vector2 } from '@/utils/vector2';

/**
 * Finds the optimal position along a specified axis for drawing connections between two points
 * while avoiding collisions with existing panels. Uses a grid-based collision detection system
 * to determine the best path for flow diagram arrows.
 *
 * The algorithm works by:
 * 1. Creating a bounding box between the from and to points
 * 2. Generating a grid of possible positions along the specified axis
 * 3. Testing each position for panel collisions across the perpendicular axis
 * 4. Selecting the position closest to the center that has no collisions
 * 5. Falling back to a midpoint calculation if no collision-free path exists
 *
 * The search prioritizes positions near the center of the bounding box, expanding
 * outward in an alternating pattern (center, center-1, center+1, center-2, center+2, etc.)
 * to find the shortest collision-free path.
 *
 * @param panels - Array of panel objects to avoid when finding the best position
 * @param from - Starting point of the connection
 * @param to - Ending point of the connection
 * @param axis - The axis along which to find the optimal position ('x' for horizontal, 'y' for vertical)
 * @returns The optimal coordinate value along the specified axis for the connection
 *
 * @example
 * ```typescript
 * const panels = [{ x: 5, y: 3, id: 'panel1' }];
 * const start = new Vector2(100, 200);
 * const end = new Vector2(300, 400);
 *
 * const bestX = findBestPosition(panels, start, end, 'x');
 * // Returns optimal x-coordinate that avoids panel collisions
 *
 * const bestY = findBestPosition(panels, start, end, 'y');
 * // Returns optimal y-coordinate that avoids panel collisions
 * ```
 *
 * @see {@link isPointInPanel} - Used for collision detection with panels
 * @see {@link minMaxPoint} - Used to calculate bounding box
 * @see {@link range} - Used to generate grid positions
 * @see {@link GRID_SIZE} - Base grid unit for position calculations
 */
export function findBestPosition(panels: Panel[], from: Vector2, to: Vector2, axis: 'x' | 'y') {
	const possiblePlaces: boolean[] = [];

	const otherAxis = axis === 'x' ? 'y' : 'x';

	const { min, max } = minMaxPoint(from, to);

	// Grid-align the min and max coordinates
	let gridAlignedMin = Math.floor(min[axis] / GRID_SIZE) * GRID_SIZE;
	const gridAlignedMax = Math.ceil(max[axis] / GRID_SIZE) * GRID_SIZE;

	// Ensure we never have negative zero
	if (gridAlignedMin === 0) gridAlignedMin = 0;

	const outerPoints = range(min[otherAxis], max[otherAxis], (axis === 'x' ? PANEL_WIDTH : PANEL_HEIGHT) * GRID_SIZE);
	const innerPoints = range(gridAlignedMin, gridAlignedMax, GRID_SIZE);

	for (const outer of outerPoints) {
		for (let inner = 0; inner < innerPoints.length; inner++) {
			const innerValue = innerPoints[inner];
			if (innerValue === undefined) continue;

			const point = axis === 'x' ? new Vector2(innerValue, outer) : new Vector2(outer, innerValue);
			possiblePlaces[inner] = (possiblePlaces[inner] ?? true) && !isPointInPanel(panels, point);
		}
	}

	const pointer = Math.floor(possiblePlaces.length / 2);

	for (let i = 0; i < possiblePlaces.length; i++) {
		if (i === 0) {
			// Check center first
			if (possiblePlaces[pointer]) {
				return gridAlignedMin + pointer * GRID_SIZE;
			}
		} else {
			// Check alternating left and right from center
			const offset = Math.ceil(i / 2);
			const direction = i % 2 === 1 ? -1 : 1;
			const newPointer = pointer + direction * offset;

			if (newPointer >= 0 && newPointer < possiblePlaces.length && possiblePlaces[newPointer]) {
				return gridAlignedMin + newPointer * GRID_SIZE;
			}
		}
	}

	return from[axis] + Math.floor((to[axis] - from[axis]) / 2 / GRID_SIZE) * GRID_SIZE;
}
