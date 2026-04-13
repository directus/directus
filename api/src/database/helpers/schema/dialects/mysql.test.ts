import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperMySQL } from './mysql.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperMySQL', () => {
	function createHelper() {
		const mockRaw = vi.fn().mockReturnValue({
			catch: vi.fn().mockResolvedValue(undefined),
		});

		const mockKnex = { raw: mockRaw } as unknown as Knex;
		const helper = new SchemaHelperMySQL(mockKnex);
		return { helper, mockRaw };
	}

	describe('getVersion', () => {
		test('returns version string for MySQL', async () => {
			const mockSelect = vi.fn().mockResolvedValue([{ version: '8.0.33' }]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('8.0.33');
		});

		test('strips MariaDB suffix from version', async () => {
			const mockSelect = vi.fn().mockResolvedValue([{ version: '10.11.6-MariaDB' }]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBe('10.11.6');
		});

		test('returns null when query returns no rows', async () => {
			const mockSelect = vi.fn().mockResolvedValue([]);
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});

		test('returns null on query error', async () => {
			const mockSelect = vi.fn().mockRejectedValue(new Error('Connection failed'));
			const mockKnex = { raw: vi.fn(), select: mockSelect } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getVersion();

			expect(result).toBeNull();
		});
	});

	describe('getDatabaseSize', () => {
		test('returns database size in bytes', async () => {
			const mockAs = vi.fn().mockReturnThis();
			const mockWhere = vi.fn().mockReturnValue({ as: mockAs });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockSumFrom = vi.fn().mockResolvedValue([{ size: 2097152 }]);
			const mockSum = vi.fn().mockReturnValue({ from: mockSumFrom });

			const mockKnex = Object.assign(vi.fn(), { raw: vi.fn(), select: mockSelect, sum: mockSum }) as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBe(2097152);
		});

		test('returns null on query error', async () => {
			const mockSum = vi.fn().mockReturnValue({
				from: vi.fn().mockRejectedValue(new Error('Permission denied')),
			});

			const mockKnex = Object.assign(vi.fn(), { raw: vi.fn(), sum: mockSum }) as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			const result = await helper.getDatabaseSize();

			expect(result).toBeNull();
		});
	});

	describe('createIndex', () => {
		test('creates a standard index without options', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('users', 'email');

			expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['users_email_index', 'users', 'email']);
		});

		test('creates a unique index when unique option is true', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('users', 'email', { unique: true });

			expect(mockRaw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??)', [
				'users_email_unique',
				'users',
				'email',
			]);
		});

		test('creates a standard index when unique option is false', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('products', 'sku', { unique: false });

			expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['products_sku_index', 'products', 'sku']);
		});

		test('attempts concurrent index creation with ALGORITHM=INPLACE LOCK=NONE', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

			expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
				'orders_status_index',
				'orders',
				'status',
			]);
		});

		test('attempts concurrent unique index with ALGORITHM=INPLACE LOCK=NONE', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

			expect(mockRaw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
				'users_username_unique',
				'users',
				'username',
			]);
		});

		test('falls back to blocking index on concurrent index failure', async () => {
			let callCount = 0;
			const blockingQueryMock = {};

			const mockRaw = vi.fn().mockImplementation(() => {
				callCount++;

				if (callCount === 1) {
					return blockingQueryMock;
				} else if (callCount === 2) {
					return {
						catch: (cb: (err: Error) => any) => {
							return cb(new Error('Concurrent index not supported'));
						},
					};
				}

				return {};
			});

			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);

			await helper.createIndex('posts', 'author_id', { attemptConcurrentIndex: true, unique: false });

			expect(mockRaw).toHaveBeenNthCalledWith(1, 'CREATE INDEX ?? ON ?? (??)', [
				'posts_author_id_index',
				'posts',
				'author_id',
			]);

			expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
				'posts_author_id_index',
				'posts',
				'author_id',
			]);
		});

		test('handles empty options object', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('categories', 'name', {});

			expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'categories_name_index',
				'categories',
				'name',
			]);
		});

		test('works with different collection and field names', async () => {
			const { helper, mockRaw } = createHelper();
			await helper.createIndex('my_custom_table', 'my_custom_column');

			expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
				'my_custom_table_my_custom_column_index',
				'my_custom_table',
				'my_custom_column',
			]);
		});
	});

	describe('parseCollectionName', () => {
		test('should return collection name in lowercase if lower_case_table_names === 1', async () => {
			vi.resetModules();
			const { SchemaHelperMySQL } = await import('./mysql.js');
			const mockRaw = vi.fn().mockResolvedValue([[{ lctn: 1 }]]);
			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);
			const result = await helper.parseCollectionName('MyCollection');

			expect(result).toBe('mycollection');
			expect(mockRaw).toHaveBeenCalledWith('SELECT @@lower_case_table_names AS lctn');
		});

		test('should return original collection name if lower_case_table_names !== 1', async () => {
			vi.resetModules();
			const { SchemaHelperMySQL } = await import('./mysql.js');
			const mockRaw = vi.fn().mockResolvedValue([[{ lctn: 2 }]]);
			const mockKnex = { raw: mockRaw } as unknown as Knex;
			const helper = new SchemaHelperMySQL(mockKnex);
			const result = await helper.parseCollectionName('MyCollection');

			expect(result).toBe('MyCollection');
			expect(mockRaw).toHaveBeenCalledWith('SELECT @@lower_case_table_names AS lctn');
		});
	});
});
