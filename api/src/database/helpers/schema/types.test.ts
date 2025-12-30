import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

// eslint-disable-next-line import/order
import { SchemaHelper } from './types.js';

describe('SchemaHelper', () => {
	class TestableSchemaHelper extends SchemaHelper {}

	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new TestableSchemaHelper(mockKnex);
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

	test('createIndex ignores attemptConcurrentIndex in base implementation', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		// Base implementation doesn't support CONCURRENTLY, falls back to regular index
		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex handles both options with base implementation', async () => {
		const { helper, mockKnex } = createHelper();
		await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

		expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??)', [
			'users_username_unique',
			'users',
			'username',
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
