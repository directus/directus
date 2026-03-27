import type { SchemaOverview } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { FnHelperOracle } from './oracle.js';

vi.mock('../../../run-ast/lib/apply-query/filter/index.js', () => ({
	applyFilter: vi.fn((_knex, _schema, query) => ({ query })),
}));

const schema: SchemaOverview = {
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
					dbType: 'varchar2',
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

describe('FnHelperOracle', () => {
	let db: ReturnType<typeof knex>;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
	});

	describe('json()', () => {
		test('castNumeric path uses RETURNING NUMBER clause', () => {
			const helper = new FnHelperOracle(db, schema);

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.price',
				castNumeric: true,
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain("'$.price' RETURNING NUMBER");
		});

		test('non-castNumeric path uses COALESCE(JSON_QUERY, JSON_VALUE)', () => {
			const helper = new FnHelperOracle(db, schema);

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.name',
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toMatch(/COALESCE\(JSON_QUERY/i);
			expect(sql).toMatch(/JSON_VALUE/i);
		});

		test('uses originalCollectionName for schema lookup when provided', () => {
			const helper = new FnHelperOracle(db, schema);

			// 'aliased' is not in the schema, but 'items' is — without originalCollectionName this would throw
			const result = helper.json('aliased', 'data', {
				type: 'json',
				jsonPath: '.color',
				originalCollectionName: 'items',
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain("'$.color'");
		});

		test('throws when the field is not a JSON field', () => {
			const helper = new FnHelperOracle(db, schema);

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
			const helper = new FnHelperOracle(db, schema);

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
