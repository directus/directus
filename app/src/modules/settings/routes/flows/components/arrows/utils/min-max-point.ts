import { Vector2 } from '@/utils/vector2';

/**
 * Return the bounding box of two given points
 */
export function minMaxPoint(point1: Vector2, point2: Vector2) {
	return {
		min: new Vector2(Math.min(point1.x, point2.x), Math.min(point1.y, point2.y)),
		max: new Vector2(Math.max(point1.x, point2.x), Math.max(point1.y, point2.y)),
	};
}
