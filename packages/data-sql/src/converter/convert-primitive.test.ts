import type { AbstractQueryFieldNodePrimitive } from '@directus/data/types';
import { expect, test } from 'vitest';
import { convertPrimitive } from './convert-primitive.js';

test('get all selects', () => {
	const primitive: AbstractQueryFieldNodePrimitive = {
		type: 'primitive',
		field: 'attribute_xy',
	};

	const res = convertPrimitive(primitive, 'collection-name');

	const expected = {
		type: 'primitive',
		table: 'collection-name',
		column: 'attribute_xy',
	};

	expect(res).toStrictEqual(expected);
});
