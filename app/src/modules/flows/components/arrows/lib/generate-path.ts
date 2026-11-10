import { generateCorner } from '../utils/generate-corner';
import { Vector2 } from '@/utils/vector2';

/**
 * Generates an SVG path string for drawing arrows between flow diagram panels.
 *
 * This function creates a complete SVG path that includes:
 * - A starting point with an 8px horizontal offset to avoid overlapping with icons
 * - Smooth corners between intermediate points using generateCorner
 * - A line to the final destination point
 * - An arrowhead at the end point
 *
 * The path consists of:
 * 1. Move to starting point (with 8px x-offset)
 * 2. Generate smooth corners for each intermediate point (if 3+ points)
 * 3. Draw line to final point
 * 4. Add arrowhead with two diagonal lines forming a ">" shape
 *
 * @param points - Array of Vector2 points defining the path route. Must contain at least 1 point.
 *                 The first point is the starting position, intermediate points create corners,
 *                 and the last point is where the arrowhead will be drawn.
 *                 **Note**: The first point will be modified by adding an 8px x-offset.
 *
 * @returns SVG path string in the format "M x,y L x,y ... M x,y L x,y" that can be used
 *          as the 'd' attribute of an SVG <path> element
 *
 * @throws {Error} Throws an error if the points array is empty
 *
 * @example
 * // Simple two-point path
 * const points = [new Vector2(10, 10), new Vector2(50, 50)];
 * const path = generatePath(points);
 * // Returns: "M 18,10 L 50,50 M 50,50 L 42,42 M 50,50 L 42,58"
 *
 * @example
 * // Multi-point path with corners
 * const points = [
 *   new Vector2(0, 0),
 *   new Vector2(50, 0),
 *   new Vector2(50, 50),
 *   new Vector2(100, 50)
 * ];
 * const path = generatePath(points);
 * // Returns path with smooth corners at intermediate points and arrowhead at end
 */
export function generatePath(points: Vector2[]) {
	if (points.length === 0) {
		throw new Error('generatePath requires at least one point');
	}

	// Add 8px to the x axis so that the arrow not overlaps with the icon
	let path = `M ${points[0]!.add(new Vector2(8, 0))}`;

	if (points.length >= 3) {
		for (let i = 1; i < points.length - 1; i++) {
			path += generateCorner(points[i - 1]!, points[i]!, points[i + 1]!);
		}
	}

	const arrowSize = 8;
	const lastPoint = points[points.length - 1]!;

	const arrow = `M ${lastPoint} L ${lastPoint
		.clone()
		.add(new Vector2(-arrowSize, -arrowSize))} M ${lastPoint} L ${lastPoint
		.clone()
		.add(new Vector2(-arrowSize, arrowSize))}`;

	return path + ` L ${lastPoint} ${arrow}`;
}
