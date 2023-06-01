import { constructSQLQuery } from './query-builder.js';
import { expect, test } from 'vitest';
import type { AbstractQuery } from '@directus/data/types';

test('very simple statement', () => {
	const ast: AbstractQuery = {
		root: true,
		store: 'postgres',
		collection: 'articles',
		nodes: [
			{ type: 'primitive', field: 'id' },
			{ type: 'primitive', field: 'some_column' },
		],
	};

	const expectedSQL = 'SELECT "articles"."id", "articles"."some_column" FROM "articles";';

	expect(constructSQLQuery(ast)).toStrictEqual(expectedSQL);
});
