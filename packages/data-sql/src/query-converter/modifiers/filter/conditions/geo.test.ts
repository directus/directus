import type { ConditionGeoIntersectsBBoxNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { GeoJSONGeometry } from 'wellknown';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertGeoCondition } from './geo.js';

test('convert geo condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();

	const multiPolygon: GeoJSONGeometry = {
		type: 'MultiPolygon',
		coordinates: [
			[
				[
					[102.0, 2.0],
					[103.0, 2.0],
					[103.0, 3.0],
					[102.0, 3.0],
					[102.0, 2.0],
				],
			],
			[
				[
					[100.0, 0.0],
					[101.0, 0.0],
					[101.0, 1.0],
					[100.0, 1.0],
					[100.0, 0.0],
				],
				[
					[100.2, 0.2],
					[100.2, 0.8],
					[100.8, 0.8],
					[100.8, 0.2],
					[100.2, 0.2],
				],
			],
		],
	};

	const condition: ConditionGeoIntersectsBBoxNode = {
		type: 'condition-geo-intersects-bbox',
		target: {
			type: 'primitive',
			field: columnName,
		},
		operation: 'intersects_bbox',
		compareTo: multiPolygon,
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				condition: {
					type: 'condition-geo',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					operation: 'intersects_bbox',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
			joins: [],
		},
		parameters: [multiPolygon],
	};

	const indexGen = createIndexGenerators();
	const result = convertGeoCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
