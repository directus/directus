export type Point = [number, number];

/**
 * Check if a given X, Y coordinate is on the line between two other points
 */
export function pointOnLine(current: Point, point1: Point, point2: Point): boolean {
	const [curX, curY] = current;
	const [p1X, p1Y] = point1;
	const [p2X, p2Y] = point2;

	const dxc = curX - p1X;
	const dyc = curY - p1Y;

	const dxl = p2X - p1X;
	const dyl = p2Y - p1Y;

	const cross = dxc * dyl - dyc * dxl;

	if (cross !== 0) return false;

	if (Math.abs(dxl) >= Math.abs(dyl)) {
		if (dxl > 0) {
			return p1X <= curX && curX <= p2X;
		} else {
			return p2X <= curX && curX <= p1X;
		}
	} else {
		if (dyl > 0) {
			return p1Y <= curY && curY <= p2Y;
		} else {
			return p2Y <= curY && curY <= p1Y;
		}
	}
}
