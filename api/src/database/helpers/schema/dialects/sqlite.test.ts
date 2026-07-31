import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperSQLite } from './sqlite.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperSQLite', () => {
	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new SchemaHelperSQLite(mockKnex);
		return { helper, mockKnex };
	}

	test('createIndex creates a standard index without options', async () => {
		const { helper, mockKnex } = createHelper();

		await helper.createIndex('users', 'email');

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['users_email_index', 'users', 'email']);
	});

	test('createIndex creates a unique index when unique option is true', async () => {
		const { helper, mockKnex } = createHelper();

		await helper.createIndex('users', 'email', { unique: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??)', [
			'users_email_unique',
			'users',
			'email',
		]);
	});

	test('createIndex creates a standard index when unique option is false', async () => {
		const { helper, mockKnex } = createHelper();

		await helper.createIndex('products', 'sku', { unique: false });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['products_sku_index', 'products', 'sku']);
	});

	test('createIndex ignores attemptConcurrentIndex option', async () => {
		const { helper, mockKnex } = createHelper();

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		// SQLite doesn't override createIndex, so it uses base implementation which doesn't support CONCURRENTLY
		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex handles empty options object', async () => {
		const { helper, mockKnex } = createHelper();

		await helper.createIndex('categories', 'name', {});

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
			'categories_name_index',
			'categories',
			'name',
		]);
	});

	describe('prepBindings', () => {
		test('hands integers to better-sqlite3 as BigInt, so text columns keep their exact form', () => {
			const { helper } = createHelper();

			expect(helper.prepBindings([41, 0, -7])).toEqual([41n, 0n, -7n]);
		});

		test('leaves every other binding untouched', () => {
			const { helper } = createHelper();

			// floats and unsafe integers can't round-trip through BigInt, so they keep the double path
			expect(helper.prepBindings([91.97, Number.MAX_SAFE_INTEGER + 2])).toEqual([91.97, Number.MAX_SAFE_INTEGER + 2]);

			expect(helper.prepBindings(['41', null, undefined, true, 12n])).toEqual(['41', null, undefined, true, 12n]);
		});

		test('passes through what knex hands it for queries without positional bindings', () => {
			const { helper } = createHelper();

			// a query built from a bare SQL string has no bindings at all
			expect(helper.prepBindings(undefined)).toBeUndefined();

			// and a dialect using named bindings gets an object
			expect(helper.prepBindings({ 1: 41 })).toEqual({ 1: 41 });
		});
	});
});
