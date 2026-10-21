import { Vector2 } from '@/utils/vector2';

/**
 * Generates a smooth rounded corner for SVG paths using quadratic Bézier curves.
 * Creates an SVG path segment that smoothly transitions between two line segments
 * by drawing a line to the corner approach point, then a quadratic curve through
 * the corner vertex to the corner exit point.
 *
 * The function uses the Vector2.moveNextTo method to calculate approach and exit
 * points that are slightly offset from the corner vertex, creating a smooth
 * rounded appearance instead of a sharp corner.
 *
 * @param start - Starting point of the corner segment (approach point)
 * @param middle - The corner vertex where the direction change occurs
 * @param end - Ending point of the corner segment (exit point)
 * @returns SVG path string containing line and quadratic curve commands
 *
 * @example
 * ```typescript
 * const start = new Vector2(90, 100);
 * const corner = new Vector2(100, 100);
 * const end = new Vector2(100, 110);
 *
 * const pathSegment = generateCorner(start, corner, end);
 * // Returns: " L 90 100 Q 100 100 100 110"
 * // Creates a smooth right-angle turn from horizontal to vertical
 * ```
 *
 * @see {@link Vector2.moveNextTo} - Used to calculate smooth corner approach/exit points
 */
export function generateCorner(start: Vector2, middle: Vector2, end: Vector2) {
	return ` L ${start.moveNextTo(middle)} Q ${middle} ${end.moveNextTo(middle)}`;
}
