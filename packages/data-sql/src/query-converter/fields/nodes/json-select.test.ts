import type { AtLeastOneElement } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import { convertJson } from './json-select.js';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const property1 = randomIdentifier();
	const property2 = randomIdentifier();

	const objectPath: AtLeastOneElement<string> = [jsonColumnName, property1, property2];

	const expectedResult = {
		jsonNode: {
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [0, 1],
			columnIndex,
		},
		parameters: [property1, property2],
	};

	const indexGen = createIndexGenerators();
	const result = convertJson(tableIndex, objectPath, columnIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});
