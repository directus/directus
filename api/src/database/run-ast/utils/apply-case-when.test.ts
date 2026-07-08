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

const clients: { dialect: string; client: knex.Knex.Config['client'] }[] = [
	{ dialect: 'sqlite', client: Client_SQLite3 },
	{ dialect: 'postgres', client: 'pg' },
];

test.each(clients)(
	'Denies with a boolean-valid always-false condition when the case filter compiles to no SQL ($dialect)',
	({ client }) => {
		const db = vi.mocked(knex.default({ client }));

		// Permission rule traversing a relational path that no longer exists in the schema, for example
		// a rule created before a relation was renamed. applyFilter silently skips relational paths that
		// match no relation (unknown scalar fields throw instead), so the compiled condition ends up
		// empty. An invalid rule must not grant unconditional access, so the case falls back to an
		// always-false condition (the field is hidden). That fallback has to be a valid boolean
		// expression: PostgreSQL rejects `CASE WHEN 1 THEN ... END` with "argument of CASE/WHEN must be
		// type boolean", which was breaking updates on items gated by such permission rules (CMS-2151).
		const cases: Filter[] = [{ _and: [{ country: { code: { _in: ['NL'] } } }] } as unknown as Filter];

		const result = applyCaseWhen(
			{
				column: db.raw(1),
				columnCases: cases,
				aliasMap: {},
				cases,
				table: 'articles',
				alias: 'title',
				permissions: [],
			},
			{ knex: db, schema },
		);

		expect(result.toQuery()).toBe('(CASE WHEN 1 = 0 THEN 1 END) AS "title"');
	},
);

test.each(clients)('Keeps the compiled filter condition when the case filter produces SQL ($dialect)', ({ client }) => {
	const db = vi.mocked(knex.default({ client }));

	const cases: Filter[] = [{ title: { _eq: 'allowed' } } as unknown as Filter];

	const result = applyCaseWhen(
		{
			column: db.raw(1),
			columnCases: cases,
			aliasMap: {},
			cases,
			table: 'articles',
			alias: 'title',
			permissions: [],
		},
		{ knex: db, schema },
	);

	expect(result.toQuery()).toBe('(CASE WHEN ("articles"."title" = \'allowed\') THEN 1 END) AS "title"');
});
