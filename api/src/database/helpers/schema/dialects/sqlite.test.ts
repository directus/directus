import { describe, expect, test, vi } from 'vitest';
import type { Knex } from 'knex';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

import { SchemaHelperSQLite } from './sqlite.js';

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
});
