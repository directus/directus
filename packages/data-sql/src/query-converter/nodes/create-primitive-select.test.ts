import { expect, test, vi } from 'vitest';
import { createPrimitiveSelect } from './create-primitive-select.js';
import type { AbstractQueryFieldNodePrimitive } from '@directus/data';

vi.mock('./create-unique-identifier.js', () => ({
	createUniqueIdentifier: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('createPrimitiveSelect', () => {
	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: 'randomPrimitiveField',
	};

	const result = createPrimitiveSelect('collection', samplePrimitiveNode);

	expect(result).toStrictEqual({
		type: 'primitive',
		table: 'collection',
		column: 'randomPrimitiveField',
		as: 'randomPrimitiveField_RANDOM',
	});
});

test('createPrimitiveSelect with user specified alias', () => {
	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: 'randomPrimitiveField',
		alias: 'randomPrimitiveField_ALIAS',
	};

	const result = createPrimitiveSelect('collection', samplePrimitiveNode);

	expect(result).toStrictEqual({
		type: 'primitive',
		table: 'collection',
		column: 'randomPrimitiveField',
		as: 'randomPrimitiveField_RANDOM',
		alias: 'randomPrimitiveField_ALIAS',
	});
});
