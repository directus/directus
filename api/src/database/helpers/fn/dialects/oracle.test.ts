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
		test('jsonReturnType numeric uses RETURNING NUMBER clause', () => {
			const helper = new FnHelperOracle(db, schema);

			const result = helper.json('items', 'data', {
				type: 'json',
				jsonPath: '.price',
				jsonReturnType: 'numeric' as const,
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain("'$.price' RETURNING NUMBER");
		});

		test('default (no jsonReturnType) uses COALESCE(JSON_QUERY, JSON_VALUE)', () => {
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

	describe('year()', () => {
		test('uses the calendar year, not the ISO week-numbering year', () => {
			const helper = new FnHelperOracle(db, schema);

			const result = helper.year('items', 'release', {
				type: 'date',
				jsonPath: undefined,
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain("'YYYY'");
			expect(sql).not.toContain("'IYYY'");
		});

		test('converts timestamp columns to UTC before extracting the year', () => {
			const helper = new FnHelperOracle(db, schema);

			const result = helper.year('items', 'release', {
				type: 'timestamp',
				jsonPath: undefined,
				originalCollectionName: undefined,
				relationalCountOptions: undefined,
			});

			const { sql } = result.toSQL();
			expect(sql).toContain("AT TIME ZONE 'UTC'");
			expect(sql).toContain("'YYYY'");
		});
	});

	describe('date part helpers', () => {
		const dateParts = {
			year: 'YYYY',
			month: 'MM',
			week: 'IW',
			day: 'DD',
			weekday: 'D',
			hour: 'HH24',
			minute: 'MI',
			second: 'SS',
		} as const;

		for (const [fn, mask] of Object.entries(dateParts)) {
			test(`${fn}() casts the TO_CHAR result to a number`, () => {
				const helper = new FnHelperOracle(db, schema);

				const { sql } = helper[fn as keyof typeof dateParts]('items', 'release', {
					type: 'date',
					jsonPath: undefined,
					originalCollectionName: undefined,
					relationalCountOptions: undefined,
				}).toSQL();

				expect(sql).toContain('TO_NUMBER(TO_CHAR(');
				expect(sql).toContain(`'${mask}'`);
			});
		}
	});
});
