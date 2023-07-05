import { expect, test } from 'vitest';
import { convertGeoValues } from './index.js';
import { randomAlpha } from '@directus/random';

test('convert just the correct values', () => {
	const wkt = 'POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))';
	const randomString = randomAlpha(20);
	const i = [randomString, wkt, true, false, 54, 0.5];

	const geoJson = {
		type: 'Polygon',
		coordinates: [
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[1, 0],
				[0, 0],
			],
		],
	};

	const res = [randomString, geoJson, true, false, 54, 0.5];
	expect(convertGeoValues(i)).toEqual(res);
});
