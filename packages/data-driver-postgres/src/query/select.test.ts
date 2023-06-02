import type { AbstractQueryFieldNodePrimitive } from '@directus/data/types';

import { describe, expect, test } from 'vitest';
import { select } from './select.js';

describe('select statement', () => {
	test('with no provided fields', () => {
		const res = select([], 'table');
		const expected = 'SELECT "table".*';
		expect(res).toStrictEqual(expected);
	});

	test('with multiple provided fields', () => {
		const someFields: AbstractQueryFieldNodePrimitive[] = [
			{ type: 'primitive', field: 'id' },
			{ type: 'primitive', field: 'title' },
		];

		const res = select(someFields, 'table');
		const expected = 'SELECT "table"."id", "table"."title"';
		expect(res).toStrictEqual(expected);
	});
});
