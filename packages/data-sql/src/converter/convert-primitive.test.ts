import { getRandomIdentifier, type AbstractQueryFieldNodePrimitive } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import { convertPrimitive } from './convert-primitive.js';

let sample: {
	node: AbstractQueryFieldNodePrimitive;
	collection: string;
};

beforeEach(() => {
	sample = {
		node: {
			type: 'primitive',
			field: getRandomIdentifier(),
		},
		collection: getRandomIdentifier(),
	};
});

test('get all selects', () => {
	const res = convertPrimitive(sample.node, sample.collection);

	const expected = {
		type: 'primitive',
		table: sample.collection,
		column: sample.node.field,
	};

	expect(res).toStrictEqual(expected);
});
