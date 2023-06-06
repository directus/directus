import type { SqlStatement } from '@directus/data-sql';
import { describe, expect, test } from 'vitest';
import { select } from './select.js';

describe('select statement', () => {
	test('with no provided fields', () => {
		const statement: SqlStatement = {
			select: [],
			from: 'articles',
		};

		const res = select(statement);
		const expected = 'SELECT "articles".*';
		expect(res).toStrictEqual(expected);
	});

	test('with multiple provided fields and an alias', () => {
		const statement: SqlStatement = {
			select: [
				{
					type: 'primitive',
					table: 'articles',
					column: 'id',
					as: 'identifier',
				},
				{
					type: 'primitive',
					table: 'articles',
					column: 'title',
				},
			],
			from: 'articles',
		};

		const res = select(statement);
		const expected = 'SELECT "articles"."id" AS "identifier", "articles"."title"';
		expect(res).toStrictEqual(expected);
	});
});
