import { test, expect } from 'vitest';

import { pointOnLine, Point } from '@/utils/point-on-line';

const cases: [boolean, Point, Point, Point][] = [
	[false, [0, 0], [1, 10], [10, 1]],

	[true, [0, 0], [0, 10], [0, 0]],
	[true, [0, 0], [10, 0], [0, 0]],

	[true, [0, 0], [0, 0], [0, 10]],
	[true, [0, 0], [0, 0], [10, 0]],
];

for (const [result, current, p1, p2] of cases) {
	test(`(${current}) on line (${p1})—(${p2})`, () => {
		expect(pointOnLine(current, p1, p2)).toBe(result);
	});
}
