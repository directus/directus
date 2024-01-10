import { expect, test } from 'vitest';
import { createPrimitiveSelect } from './create-primitive-select.js';
import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import { randomIdentifier } from '@directus/random';

test('createPrimitiveSelect', () => {
	const randomPrimitiveField = randomIdentifier();
	const collection = randomIdentifier();
	const fieldAlias = `${randomPrimitiveField}_RANDOM`;

	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: randomPrimitiveField,
		alias: randomIdentifier(),
	};

	const result = createPrimitiveSelect(collection, samplePrimitiveNode.field, fieldAlias);

	expect(result).toStrictEqual({
		type: 'primitive',
		table: collection,
		column: randomPrimitiveField,
		as: fieldAlias,
	});
});
