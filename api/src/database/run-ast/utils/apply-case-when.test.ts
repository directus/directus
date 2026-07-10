import { SchemaBuilder } from '@directus/schema-builder';
import type { Filter } from '@directus/types';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from '../lib/apply-query/mock.js';
import { applyCaseWhen } from './apply-case-when.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.build();

// pg is included because it rejects a bare integer as a CASE/WHEN condition ("argument of CASE/WHEN
// must be type boolean"), which was the original CMS-2151 failure; the fallback must be a real boolean.
const clients: { dialect: string; client: knex.Knex.Config['client'] }[] = [
	{ dialect: 'sqlite', client: Client_SQLite3 },
	{ dialect: 'postgres', client: 'pg' },
];

function run(cases: Filter[], client: knex.Knex.Config['client']) {
	const db = vi.mocked(knex.default({ client }));

	return applyCaseWhen(
		{ column: db.raw(1), columnCases: cases, aliasMap: {}, cases, table: 'articles', alias: 'title', permissions: [] },
		{ knex: db, schema },
	).toQuery();
}

test.each(clients)('Keeps the compiled filter condition when the case filter produces SQL ($dialect)', ({ client }) => {
	const cases: Filter[] = [{ title: { _eq: 'allowed' } } as unknown as Filter];

	expect(run(cases, client)).toBe('(CASE WHEN ("articles"."title" = \'allowed\') THEN 1 END) AS "title"');
});

test.each(clients)(
	'Falls back to an always-true boolean when the case filter compiles to no SQL ($dialect)',
	({ client }) => {
		// A rule whose conditions reference fields/relations that no longer exist (applyFilter silently
		// drops them), and a genuinely empty rule, both compile to no SQL. Both keep granting access, as
		// MySQL/SQLite already did with the bare `1`; the fallback just has to be a valid boolean for pg.
		const noSqlCases: Filter[] = [
			{ _and: [{ country: { code: { _in: ['NL'] } } }] } as unknown as Filter,
			{ _and: [] } as unknown as Filter,
			{ _or: [] } as unknown as Filter,
		];

		for (const rule of noSqlCases) {
			expect(run([rule], client)).toBe('(CASE WHEN 1 = 1 THEN 1 END) AS "title"');
		}
	},
);
