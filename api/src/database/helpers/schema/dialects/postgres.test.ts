import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperPostgres } from './postgres.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperPostgres', () => {
	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new SchemaHelperPostgres(mockKnex);
		return { helper, mockKnex };
	}

	describe('getVersion', () => {
		test('returns version string from current_setting', async () => {
			const mockSelect = vi.fn().mockResolvedValue([{ version: '16.4' }]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('16.4');
		});

		test('returns null when query returns no rows', async () => {
			const mockSelect = vi.fn().mockResolvedValue([]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockSelect = vi.fn().mockRejectedValue(new Error('Connection failed'));
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});
	});

	describe('getDatabaseSize', () => {
		test('returns database size in bytes', async () => {
			const mockSelect = vi.fn().mockResolvedValue([{ size: 1048576 }]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBe(1048576);
		});

		test('returns null when size is falsy', async () => {
			const mockSelect = vi.fn().mockResolvedValue([{ size: null }]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockSelect = vi.fn().mockRejectedValue(new Error('Permission denied'));
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperPostgres(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBeNull();
		});
	});

	describe('createIndex', () => {
		test('creates a standard index without options', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('users', 'email');

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['users_email_index', 'users', 'email']);
		});

		test('creates a unique index when unique option is true', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('users', 'email', { unique: true });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??)', [
				'users_email_unique',
				'users',
				'email',
			]);
		});

		test('creates a standard index when unique option is false', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('products', 'sku', { unique: false });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['products_sku_index', 'products', 'sku']);
		});

		test('creates a concurrent index when attemptConcurrentIndex is true', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX CONCURRENTLY ?? ON ?? (??)', [
				'orders_status_index',
				'orders',
				'status',
			]);
		});

		test('creates a concurrent unique index when both options are true', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE UNIQUE INDEX CONCURRENTLY ?? ON ?? (??)', [
				'users_username_unique',
				'users',
				'username',
			]);
		});

		test('creates a concurrent standard index when attemptConcurrentIndex is true and unique is false', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('posts', 'author_id', { attemptConcurrentIndex: true, unique: false });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX CONCURRENTLY ?? ON ?? (??)', [
				'posts_author_id_index',
				'posts',
				'author_id',
			]);
		});

		test('handles empty options object', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('categories', 'name', {});

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'categories_name_index',
				'categories',
				'name',
			]);
		});

		test('works with different collection and field names', async () => {
			const { helper, mockKnex } = createHelper();
			await helper.createIndex('my_custom_table', 'my_custom_column');

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'my_custom_table_my_custom_column_index',
				'my_custom_table',
				'my_custom_column',
			]);
		});
	});
});
