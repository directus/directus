import type { Relation, SchemaOverview } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, type MockedFunction, test, vi } from 'vitest';
import type { FnHelperOptions } from './types.js';
import { FnHelper } from './types.js';

vi.mock('../../run-ast/lib/apply-query/filter/index.js', () => ({
	applyFilter: vi.fn((_knex, _schema, query) => ({ query })),
}));

class TestFnHelper extends FnHelper {
	year() {
		return this.knex.raw('');
	}

	month() {
		return this.knex.raw('');
	}

	week() {
		return this.knex.raw('');
	}

	day() {
		return this.knex.raw('');
	}

	weekday() {
		return this.knex.raw('');
	}

	hour() {
		return this.knex.raw('');
	}

	minute() {
		return this.knex.raw('');
	}

	second() {
		return this.knex.raw('');
	}

	count(table: string, column: string, options?: FnHelperOptions) {
		return this._relationalCount(table, column, options);
	}

	json() {
		return this.knex.raw('');
	}

	protected _relationalJsonO2M() {
		return this.knex.raw('');
	}

	protected _relationalJsonA2O() {
		return this.knex.raw('');
	}

	protected _relationalJsonMultiHop() {
		return this.knex.raw('');
	}
}

describe('FnHelper', () => {
	let db: MockedFunction<typeof knex.knex>;
	let tracker: Tracker;

	const schema: SchemaOverview = {
		collections: {
			articles: {
				collection: 'articles',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {},
				group: null,
			},
			comments: {
				collection: 'comments',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {},
				group: null,
			},
		},
		relations: [
			{
				collection: 'comments',
				field: 'article_id',
				related_collection: 'articles',
				meta: {
					one_field: 'comments',
				},
			} as Relation,
		],
	};

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('_relationalCount', () => {
		test('should return a wrapped subquery using sql+bindings from inner query', () => {
			const helper = new TestFnHelper(db, schema);
			const result = helper.count('articles', 'comments');

			const compiled = result.toSQL();

			// Should be a parenthesized subquery
			expect(compiled.sql).toMatch(/^\(select count\(\*\)/);
			expect(compiled.sql).toContain('"article_id"');
			expect(compiled.sql).toContain('"articles"."id"');
		});

		test('should throw for non-relational fields', () => {
			const helper = new TestFnHelper(db, schema);

			expect(() => helper.count('articles', 'nonexistent')).toThrow(
				"Field articles.nonexistent isn't a nested relational collection",
			);
		});

		test('should use originalCollectionName when provided', () => {
			const helper = new TestFnHelper(db, schema);

			const result = helper.count('alias_table', 'comments', {
				type: undefined,
				originalCollectionName: 'articles',
				relationalCountOptions: undefined,
			});

			const compiled = result.toSQL();

			// Should resolve relation from articles schema but reference alias_table in the WHERE
			expect(compiled.sql).toMatch(/^\(select count\(\*\)/);
			expect(compiled.sql).toContain('"alias_table"."id"');
		});
	});
});
