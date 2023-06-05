import { constructSql } from './index.js';
import { expect, test } from 'vitest';
import type { SqlStatement } from '@directus/data-sql';

test('very simple statement', () => {
	const query: SqlStatement = {
		select: [
			{ type: 'primitive', column: 'id', table: 'articles' },
			{ type: 'primitive', column: 'some_column', table: 'articles' },
		],
		from: 'articles',
	};

	const expectedSQL = 'SELECT "articles"."id", "articles"."some_column" FROM "articles";';

	expect(constructSql(query)).toStrictEqual(expectedSQL);
});
