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
	expect(geoCondition(sampleCondition)).toStrictEqual(
		`ST_Intersects("t${tableIndex}"."${columnName}", ST_GeomFromText($${parameterIndex + 1}))`,
	);
});

test('intersects_bbox', () => {
	sampleCondition.operation = 'intersects_bbox';

	expect(geoCondition(sampleCondition)).toStrictEqual(
		`"t${tableIndex}"."${columnName}" && ST_GeomFromText($${parameterIndex + 1}))`,
	);
});

test('intersects_bbo with json target', () => {
	sampleCondition.target = {
		type: 'json',
		tableIndex,
		columnName,
		path: [5],
	};

	expect(geoCondition(sampleCondition)).toStrictEqual(
		`ST_Intersects("t${tableIndex}"."${columnName}" -> $6, ST_GeomFromText($${parameterIndex + 1}))`,
	);
});
