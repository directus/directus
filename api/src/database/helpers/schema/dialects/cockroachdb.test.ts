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

	describe('getVersion', () => {
		test('returns version with v prefix stripped', async () => {
			const mockWhere = vi.fn().mockResolvedValue([{ version: 'v23.1.0' }]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('23.1.0');
			expect(mockSelect).toHaveBeenCalledWith('value as version');
			expect(mockFrom).toHaveBeenCalledWith('crdb_internal.node_build_info');
			expect(mockWhere).toHaveBeenCalledWith('field', 'Version');
		});

		test('returns version as-is when no v prefix', async () => {
			const mockWhere = vi.fn().mockResolvedValue([{ version: '23.1.0' }]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('23.1.0');
		});

		test('returns null when query returns no rows', async () => {
			const mockWhere = vi.fn().mockResolvedValue([]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockWhere = vi.fn().mockRejectedValue(new Error('Connection failed'));
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});
	});

	describe('getDatabaseSize', () => {
		test('returns database size in bytes', async () => {
			const rawCurrentDb = Symbol('raw-current-db');
			const rawSizeExpr = Symbol('raw-size-expr');
			const rawShowRanges = Symbol('raw-show-ranges');

			const mockRaw = vi
				.fn()
				.mockReturnValueOnce(rawCurrentDb)
				.mockReturnValueOnce(rawSizeExpr)
				.mockReturnValueOnce(rawShowRanges);

			const mockFrom = vi.fn().mockResolvedValue([{ size: 104857600 }]);

			const mockSelect = vi
				.fn()
				.mockResolvedValueOnce([{ current_database: 'testdb' }])
				.mockReturnValueOnce({ from: mockFrom });

			const mockKnex = { raw: mockRaw, select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBe(104857600);
			expect(mockRaw).toHaveBeenNthCalledWith(1, 'current_database()');
			expect(mockSelect).toHaveBeenNthCalledWith(1, rawCurrentDb);
			expect(mockRaw).toHaveBeenNthCalledWith(2, 'round(SUM(range_size_mb) * 1024 * 1024, 0) AS size');
			expect(mockSelect).toHaveBeenNthCalledWith(2, rawSizeExpr);
			expect(mockRaw).toHaveBeenNthCalledWith(3, '[SHOW RANGES FROM database ??]', ['testdb']);
			expect(mockFrom).toHaveBeenCalledWith(rawShowRanges);
		});

		test('returns null when size is falsy', async () => {
			const mockFrom = vi.fn().mockResolvedValue([{ size: null }]);

			const mockSelect = vi
				.fn()
				.mockResolvedValueOnce([{ current_database: 'testdb' }])
				.mockReturnValueOnce({ from: mockFrom });

			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockSelect = vi.fn().mockRejectedValue(new Error('Connection failed'));
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperCockroachDb(mockKnex);

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

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'products_sku_index',
				'products',
				'sku',
			]);
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
