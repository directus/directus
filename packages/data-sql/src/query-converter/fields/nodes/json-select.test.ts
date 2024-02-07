import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import { numberGenerator } from '../../utils/number-generator.js';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute2 = randomIdentifier();
	const path = [attribute1, attribute2];
	const paramIndeGen = numberGenerator();

	const result = convertJson(path, tableIndex, jsonColumnName, columnIndex, paramIndeGen);

	const expected = {
		jsonNode: {
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [0, 1],
			columnIndex,
		},
		parameter: [attribute1, attribute2],
	};

	expect(result).toStrictEqual(expected);
});
