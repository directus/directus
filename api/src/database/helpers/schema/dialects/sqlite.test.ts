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

	describe('getVersion', () => {
		test('returns version string', async () => {
			const rawResult = Symbol('raw');
			const mockRaw = vi.fn().mockReturnValue(rawResult);
			const mockSelect = vi.fn().mockResolvedValue([{ version: '3.42.0' }]);
			const mockKnex = { raw: mockRaw, select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('3.42.0');
			expect(mockRaw).toHaveBeenCalledWith('sqlite_version() as version');
			expect(mockSelect).toHaveBeenCalledWith(rawResult);
		});

		test('returns null when query returns no rows', async () => {
			const mockSelect = vi.fn().mockResolvedValue([]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockSelect = vi.fn().mockRejectedValue(new Error('Failed'));
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});
	});

	describe('getDatabaseSize', () => {
		test('returns database size in bytes', async () => {
			const mockRaw = vi.fn().mockResolvedValue([{ size: 4096000 }]);
			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBe(4096000);

			expect(mockRaw).toHaveBeenCalledWith(
				'SELECT page_count * page_size as "size" FROM pragma_page_count(), pragma_page_size();',
			);
		});

		test('returns null when size is falsy', async () => {
			const mockRaw = vi.fn().mockResolvedValue([{ size: null }]);
			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockRaw = vi.fn().mockRejectedValue(new Error('Failed'));
			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperSQLite(mockKnex);

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

		test('ignores attemptConcurrentIndex option', async () => {
			const { helper, mockKnex } = createHelper();

			await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

			expect(mockKnex.raw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'orders_status_index',
				'orders',
				'status',
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
	});
});
