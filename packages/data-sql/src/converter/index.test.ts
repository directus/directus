import type { AbstractQuery } from '@directus/data/types';
import { expect, test } from 'vitest';
import type { SqlStatement } from '../types.js';
import { convertAbstractQueryToSqlStatement } from './index.js';

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
