import { describe, expect, test, vi } from 'vitest';
import type { Knex } from 'knex';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

import { SchemaHelperOracle } from './oracle.js';

describe('SchemaHelperOracle', () => {
	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new SchemaHelperOracle(mockKnex);
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

	test('createIndex creates an online index when attemptConcurrentIndex is true', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		// Oracle uses ONLINE instead of CONCURRENTLY
		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??) ONLINE', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex creates an online unique index when both options are true', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??) ONLINE', [
			'users_username_unique',
			'users',
			'username',
		]);
	});

	test('createIndex creates an online standard index when attemptConcurrentIndex is true and unique is false', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('posts', 'author_id', { attemptConcurrentIndex: true, unique: false });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??) ONLINE', [
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

	test('createIndex creates a composite index with multiple fields', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('revisions', ['collection', 'item', 'version']);

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??, ??, ??)', [
			'revisions_collection_item_version_index',
			'revisions',
			'collection',
			'item',
			'version',
		]);
	});

	test('createIndex creates an online composite index', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('revisions', ['collection', 'item'], { attemptConcurrentIndex: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??, ??) ONLINE', [
			'revisions_collection_item_index',
			'revisions',
			'collection',
			'item',
		]);
	});

	test('createIndex creates a unique composite index', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('products', ['sku', 'variant'], { unique: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??, ??)', [
			'products_sku_variant_unique',
			'products',
			'sku',
			'variant',
		]);
	});
});
