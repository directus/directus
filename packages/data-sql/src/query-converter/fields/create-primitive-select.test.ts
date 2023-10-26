import { beforeEach, expect, test } from 'vitest';
import { createPrimitiveSelect } from './create-primitive-select.js';
import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import { randomIdentifier } from '@directus/random';

let randomPrimitiveField: string;
let collection: string;
let fieldAlias: string;

beforeEach(() => {
	randomPrimitiveField = randomIdentifier();
	collection = randomIdentifier();
	fieldAlias = `${randomPrimitiveField}_RANDOM`;
});

test('createPrimitiveSelect', () => {
	const randomPrimitiveField = randomIdentifier();
	const collection = randomIdentifier();
	const fieldAlias = `${randomPrimitiveField}_RANDOM`;

	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: randomPrimitiveField,
	};

	const result = createPrimitiveSelect(collection, samplePrimitiveNode, fieldAlias);

	expect(result).toStrictEqual({
		type: 'primitive',
		table: collection,
		column: randomPrimitiveField,
		as: fieldAlias,
	});
});

test('createPrimitiveSelect with user specified alias', () => {
	const randomUserAlias = randomIdentifier();

	const samplePrimitiveNode: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: randomPrimitiveField,
		alias: randomUserAlias,
	};

	const result = createPrimitiveSelect(collection, samplePrimitiveNode, fieldAlias);

	expect(result).toStrictEqual({
		type: 'primitive',
		table: collection,
		column: randomPrimitiveField,
		as: fieldAlias,
		alias: randomUserAlias,
	});
});
