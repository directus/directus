import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import { randomAlpha, randomInteger } from '@directus/random';
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
			field: randomAlpha(randomInteger(3, 25)),
		},
		collection: randomAlpha(randomInteger(3, 25)),
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
