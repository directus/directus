import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQuerySelectPrimitiveNode } from '../../types/index.js';
import { createPrimitiveSelect } from './create-primitive-select.js';

test('createPrimitiveSelect', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnIndex = randomInteger(0, 100);

	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: columnName,
		alias: randomIdentifier(),
	};

	const expectedResult: AbstractSqlQuerySelectPrimitiveNode = {
		type: 'primitive',
		tableIndex,
		columnName,
		columnIndex,
	};

	const result = createPrimitiveSelect(tableIndex, samplePrimitiveNode.field, columnIndex);

	expect(result).toStrictEqual(expectedResult);
});
