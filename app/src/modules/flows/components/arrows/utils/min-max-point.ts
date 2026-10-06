import { Vector2 } from '@/utils/vector2';

/**
 * Calculates the axis-aligned bounding box (AABB) for two points in 2D space.
 * Returns the minimum and maximum coordinates that define a rectangular boundary
 * encompassing both input points, regardless of their relative positions.
 *
 * The bounding box is computed by finding:
 * - Minimum x: smallest x-coordinate between the two points
 * - Minimum y: smallest y-coordinate between the two points
 * - Maximum x: largest x-coordinate between the two points
 * - Maximum y: largest y-coordinate between the two points
 *
 * This is commonly used for collision detection, spatial partitioning, and
 * determining the rectangular area that contains a set of geometric elements.
 *
 * @param point1 - First point to include in the bounding box calculation
 * @param point2 - Second point to include in the bounding box calculation
 * @returns Object containing min and max Vector2 points defining the bounding box
 * @returns returns.min - Top-left corner (minimum x, minimum y)
 * @returns returns.max - Bottom-right corner (maximum x, maximum y)
 *
 * @example
 * ```typescript
 * const p1 = new Vector2(10, 50);
 * const p2 = new Vector2(40, 20);
 *
 * const bbox = minMaxPoint(p1, p2);
 * // Returns: {
 * //   min: Vector2(10, 20),
 * //   max: Vector2(40, 50)
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // Works regardless of point order
 * const corner1 = new Vector2(100, 100);
 * const corner2 = new Vector2(50, 150);
 *
 * const bounds = minMaxPoint(corner1, corner2);
 * // Returns: {
 * //   min: Vector2(50, 100),
 * //   max: Vector2(100, 150)
 * // }
 * ```
 */
export function minMaxPoint(point1: Vector2, point2: Vector2) {
	return {
		min: new Vector2(Math.min(point1.x, point2.x), Math.min(point1.y, point2.y)),
		max: new Vector2(Math.max(point1.x, point2.x), Math.max(point1.y, point2.y)),
	};
}
