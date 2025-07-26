import { Vector2 } from '@/utils/vector2';
import { GRID_SIZE, PANEL_HEIGHT, PANEL_WIDTH } from '../../../constants';
import type { Panel } from '../types';

/**
 * Checks if specific point intersects with any of the provided panels
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
