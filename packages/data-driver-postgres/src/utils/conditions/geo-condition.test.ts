import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { geoCondition } from './geo-condition.js';
import type { SqlConditionGeoNode } from '@directus/data-sql';

let sampleCondition: SqlConditionGeoNode;
let randomTable: string;
let randomColumn: string;
let parameterIndex: number;

beforeEach(() => {
	randomTable = randomIdentifier();
	randomColumn = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-geo',
		target: {
			type: 'primitive',
			table: randomTable,
			column: randomColumn,
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
		`ST_Intersects("${randomTable}"."${randomColumn}", ST_GeomFromText($${parameterIndex + 1}))`,
	);
});

test('intersects_bbox', () => {
	sampleCondition.operation = 'intersects_bbox';

	expect(geoCondition(sampleCondition)).toStrictEqual(
		`"${randomTable}"."${randomColumn}" && ST_GeomFromText($${parameterIndex + 1}))`,
	);
});
