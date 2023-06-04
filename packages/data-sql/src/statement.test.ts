import { test, expect } from 'vitest';
import { convertPrimitive, convertAbstractQueryToSqlStatement, type SqlStatement } from './statement.js';
import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data/types';

test('get all selects', () => {
	const query: AbstractQuery = {
		root: true,
		store: 'postgres',
		collection: 'articles',
		nodes: [
			{
				type: 'primitive',
				field: 'id',
			},
			{
				type: 'primitive',
				field: 'title',
			},
		],
	};

	const res = convertAbstractQueryToSqlStatement(query);

	const expected: SqlStatement = {
		select: [
			{
				type: 'primitive',
				table: 'articles',
				column: 'id',
			},
			{
				type: 'primitive',
				table: 'articles',
				column: 'title',
			},
		],
		from: 'articles',
	};

	expect(res).toStrictEqual(expected);
});

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
