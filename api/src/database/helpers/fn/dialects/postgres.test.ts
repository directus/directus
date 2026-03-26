import type { SchemaOverview } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { FnHelperPostgres } from './postgres.js';

vi.mock('../../../run-ast/lib/apply-query/filter/index.js', () => ({
	applyFilter: vi.fn((_knex, _schema, query) => ({ query })),
}));

function makeSchema(dbType: 'json' | 'jsonb'): SchemaOverview {
	return {
		collections: {
			items: {
				collection: 'items',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					data: {
						field: 'data',
						type: 'json',
						dbType,
						nullable: true,
						generated: false,
						defaultValue: null,
						alias: false,
						validation: null,
						special: [],
						note: null,
						precision: null,
						scale: null,
						searchable: false,
					},
				},
			},
		},
		relations: [],
	};
}

describe('FnHelperPostgres', () => {
	let db: ReturnType<typeof knex>;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
	});

	describe('json()', () => {
		test('uses ::json cast for json dbType', () => {
			const helper = new FnHelperPostgres(db, makeSchema('json'));

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.color',
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain('::json');
			expect(sql).not.toContain('::jsonb');
		});

		test('uses ::jsonb cast for jsonb dbType', () => {
			const helper = new FnHelperPostgres(db, makeSchema('jsonb'));

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.color',
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain('::jsonb');
		});

		test('castNumeric wraps expression with ::numeric', () => {
			const helper = new FnHelperPostgres(db, makeSchema('jsonb'));

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.price',
				castNumeric: true,
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain('::numeric');
			expect(sql).toContain('::jsonb');
		});

		test('uses originalCollectionName for schema lookup when provided', () => {
			const helper = new FnHelperPostgres(db, makeSchema('jsonb'));

			// 'aliased' is not in the schema, but 'items' is — without originalCollectionName this would throw
			const result = helper.json('aliased', 'data', {
				type: 'json',
				jsonPath: '.color',
				originalCollectionName: 'items',
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain('::jsonb');
		});

		test('throws when the field is not a JSON field', () => {
			const helper = new FnHelperPostgres(db, makeSchema('jsonb'));

			expect(() =>
				helper.json('items', 'nonexistent', {
					type: 'json',
					jsonPath: '.color',
					originalCollectionName: undefined,
					relationalCountOptions: undefined,
				}),
			).toThrow('is not a JSON field');
		});

		test('throws when jsonPath is absent', () => {
			const helper = new FnHelperPostgres(db, makeSchema('jsonb'));

			expect(() =>
				helper.json('items', 'data', {
					type: 'json',
					jsonPath: undefined,
					originalCollectionName: undefined,
					relationalCountOptions: undefined,
				}),
			).toThrow('is not a JSON field');
		});
	});
});
