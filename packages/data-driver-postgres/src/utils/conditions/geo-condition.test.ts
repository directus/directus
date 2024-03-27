import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { geoCondition } from './geo-condition.js';
import type { SqlConditionGeoNode } from '@directus/data-sql';

let sampleCondition: SqlConditionGeoNode;
let tableIndex: number;
let columnName: string;
let parameterIndex: number;

beforeEach(() => {
	tableIndex = randomInteger(0, 100);
	columnName = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-geo',
		target: {
			type: 'primitive',
			tableIndex: tableIndex,
			columnName: columnName,
		},
		operation: 'intersects',
		compareTo: {
			type: 'value',
			parameterIndex,
		},
	};
});

test('intersects', () => {
	const result = geoCondition(sampleCondition);
	const expected = `ST_Intersects("t${tableIndex}"."${columnName}", ST_GeomFromText($${parameterIndex + 1}))`;
	expect(result).toStrictEqual(expected);
});

test('intersects with json target', () => {
	const pathParameter = randomInteger(0, 100);

	sampleCondition.target = {
		type: 'json',
		columnName,
		tableIndex,
		path: [pathParameter],
	};

	const result = geoCondition(sampleCondition);

	const expected = `ST_Intersects(CAST("t${tableIndex}"."${columnName}" ->> $${
		pathParameter + 1
	} AS geometry), ST_GeomFromText($${parameterIndex + 1}))`;

	expect(result).toStrictEqual(expected);
});

test('intersects_bbox', () => {
	sampleCondition.operation = 'intersects_bbox';
	const result = geoCondition(sampleCondition);
	const expected = `"t${tableIndex}"."${columnName}" && ST_GeomFromText($${parameterIndex + 1}))`;
	expect(result).toStrictEqual(expected);
});
