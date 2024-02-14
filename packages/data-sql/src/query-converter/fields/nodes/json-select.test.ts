import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import type { AtLeastOneElement } from '@directus/data';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute2 = randomIdentifier();
	const objectPath: AtLeastOneElement<string> = [jsonColumnName, attribute1, attribute2];

	const indexGen = createIndexGenerators();
	const result = convertJson(tableIndex, objectPath, columnIndex, indexGen);

	const expected = {
		jsonNode: {
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [0, 1],
			columnIndex,
		},
		parameters: [attribute1, attribute2],
	};

	expect(result).toStrictEqual(expected);
});
