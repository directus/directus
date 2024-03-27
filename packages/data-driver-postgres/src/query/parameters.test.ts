import { expect, test } from 'vitest';
import { convertGeoJsonParameterToWKT } from './parameters.js';
import { randomAlpha, randomInteger } from '@directus/random';
import type { GeoJSONGeometry } from 'wellknown';

test('Returns parameterized FROM with escaped identifier', () => {
	const a = randomAlpha(25);
	const b = randomInteger(0, 1000);

	const c = {
		type: 'LineString',
		coordinates: [
			[100.0, 0.0],
			[101.0, 1.0],
		],
	} as GeoJSONGeometry;

	const d = randomAlpha(45);

	const e = {
		type: 'Polygon',
		coordinates: [
			[
				[100.0, 0.0],
				[101.0, 0.0],
				[101.0, 1.0],
				[100.0, 1.0],
				[100.0, 0.0],
			],
			[
				[100.8, 0.8],
				[100.8, 0.2],
				[100.2, 0.2],
				[100.2, 0.8],
				[100.8, 0.8],
			],
		],
	} as GeoJSONGeometry;

	expect(convertGeoJsonParameterToWKT([a, b, c, d, e])).toStrictEqual([
		a,
		b,
		'LINESTRING (100 0, 101 1)',
		d,
		'POLYGON ((100 0, 101 0, 101 1, 100 1, 100 0), (100.8 0.8, 100.8 0.2, 100.2 0.2, 100.2 0.8, 100.8 0.8))',
	]);
});
