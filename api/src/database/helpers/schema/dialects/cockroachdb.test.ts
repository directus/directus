import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperCockroachDb } from './cockroachdb.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperCockroachDb', () => {
	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new SchemaHelperCockroachDb(mockKnex);
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

	test('createIndex creates a concurrent index when attemptConcurrentIndex is true', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX CONCURRENTLY ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex creates a concurrent unique index when both options are true', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX CONCURRENTLY ?? ON ?? (??)', [
			'users_username_unique',
			'users',
			'username',
		]);
	});

	test('createIndex creates a concurrent standard index when attemptConcurrentIndex is true and unique is false', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('posts', 'author_id', { attemptConcurrentIndex: true, unique: false });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX CONCURRENTLY ?? ON ?? (??)', [
			'posts_author_id_index',
			'posts',
			'author_id',
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

	test('createIndex works with different collection and field names', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('my_custom_table', 'my_custom_column');

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
			'my_custom_table_my_custom_column_index',
			'my_custom_table',
			'my_custom_column',
		]);
	});
});
