import { Vector2 } from '@/utils/vector2';
import { GRID_SIZE } from '../../../constants';
import type { Panel } from '../types';
import { findBestPosition } from './find-best-position';
import { generatePath } from './generate-path';

const START_OFFSET = 2;
const END_OFFSET = 13;
const OFFSET_BOX = 40;

/**
 * Creates an SVG path string for drawing connection lines between flow diagram panels.
 *
 * This function generates optimized paths that avoid collisions with existing panels using three
 * different routing strategies based on the spatial relationship between start and end points:
 *
 * 1. **Horizontal Direct**: When points are on the same horizontal line (y === toY)
 * 2. **L-shaped Route**: When there's sufficient horizontal space (x + 3*GRID_SIZE < toX)
 * 3. **Complex Route**: When space is constrained, using vertical detours around obstacles
 *
 * The function automatically applies start and end offsets to prevent overlap with panel icons
 * and uses collision detection to find optimal intermediate waypoints.
 *
 * @param panels - Array of panel objects to avoid when routing the connection line.
 *                 Each panel has x, y coordinates and is used for collision detection.
 * @param x - Starting x-coordinate in pixels
 * @param y - Starting y-coordinate in pixels
 * @param toX - Ending x-coordinate in pixels
 * @param toY - Ending y-coordinate in pixels
 *
 * @returns SVG path string that can be used as the 'd' attribute of an SVG <path> element.
 *          The path includes smooth corners and an arrowhead at the destination.
 *
 * @example
 * // Simple horizontal line
 * const panels = [];
 * const path = createLine(panels, 100, 50, 300, 50);
 * // Returns direct horizontal path with start/end offsets
 *
 * @example
 * // L-shaped route with obstacle avoidance
 * const panels = [{ id: '1', x: 150, y: 50, resolve: '', reject: '' }];
 * const path = createLine(panels, 100, 50, 400, 150);
 * // Returns L-shaped path avoiding the panel at (150, 50)
 *
 * @example
 * // Complex route for constrained space
 * const panels = [
 *   { id: '1', x: 120, y: 50, resolve: '', reject: '' },
 *   { id: '2', x: 140, y: 100, resolve: '', reject: '' }
 * ];
 * const path = createLine(panels, 100, 50, 180, 150);
 * // Returns complex path with vertical detours around both panels
 *
 * @see {@link generatePath} - Used to convert waypoints into SVG path strings
 * @see {@link findBestPosition} - Used to find collision-free intermediate positions
 */
export function createLine(panels: Panel[], x: number, y: number, toX: number, toY: number) {
	if (y === toY) {
		return generatePath(Vector2.fromMany({ x: x + START_OFFSET, y }, { x: toX - END_OFFSET, y: toY }));
	}

	if (x + 3 * GRID_SIZE < toX) {
		const centerX = findBestPosition(
			panels,
			new Vector2(x + 2 * GRID_SIZE, y),
			new Vector2(toX - 2 * GRID_SIZE, toY),
			'x',
		);

		return generatePath(
			Vector2.fromMany(
				{ x: x + START_OFFSET, y },
				{ x: centerX, y },
				{ x: centerX, y: toY },
				{ x: toX - END_OFFSET, y: toY },
			),
		);
	}

	const centerY = findBestPosition(
		panels,
		new Vector2(x + 2 * GRID_SIZE, y),
		new Vector2(toX - 2 * GRID_SIZE, toY),
		'y',
	);

	return generatePath(
		Vector2.fromMany(
			{ x: x + START_OFFSET, y },
			{ x: x + OFFSET_BOX, y },
			{ x: x + OFFSET_BOX, y: centerY },
			{ x: toX - OFFSET_BOX, y: centerY },
			{ x: toX - OFFSET_BOX, y: toY },
			{ x: toX - END_OFFSET, y: toY },
		),
	);
}
