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

	test('createIndex creates a standard index without options', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('users', 'email');

		expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['users_email_index', 'users', 'email']);
	});

	test('createIndex creates a unique index when unique option is true', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('users', 'email', { unique: true });

		expect(mockRaw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??)', ['users_email_unique', 'users', 'email']);
	});

	test('createIndex creates a standard index when unique option is false', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('products', 'sku', { unique: false });

		expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['products_sku_index', 'products', 'sku']);
	});

	test('createIndex attempts concurrent index creation with ALGORITHM=INPLACE LOCK=NONE', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		// MySQL uses ALGORITHM=INPLACE LOCK=NONE for concurrent indexes
		expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex attempts concurrent unique index with ALGORITHM=INPLACE LOCK=NONE', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

		expect(mockRaw).toHaveBeenCalledWith('CREATE UNIQUE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
			'users_username_unique',
			'users',
			'username',
		]);
	});

	test('createIndex falls back to blocking index on concurrent index failure', async () => {
		// Reset the mock and set up the sequence of calls
		// First call creates blockingQuery, second call attempts concurrent, returns fallback
		let callCount = 0;
		const blockingQueryMock = {}; // This represents the blocking query object

		const mockRaw = vi.fn().mockImplementation(() => {
			callCount++;

			if (callCount === 1) {
				// First call is for blockingQuery (CREATE INDEX without ALGORITHM)
				return blockingQueryMock;
			} else if (callCount === 2) {
				// Second call is for concurrent query which fails and catches
				return {
					catch: (cb: (err: Error) => any) => {
						// Simulate error and return the blocking query
						return cb(new Error('Concurrent index not supported'));
					},
				};
			}

			return {};
		});

		const mockKnex = { raw: mockRaw } as unknown as Knex;
		const helper = new SchemaHelperMySQL(mockKnex);

		await helper.createIndex('posts', 'author_id', { attemptConcurrentIndex: true, unique: false });

		// Should create blocking query first (for fallback)
		expect(mockRaw).toHaveBeenNthCalledWith(1, 'CREATE INDEX ?? ON ?? (??)', [
			'posts_author_id_index',
			'posts',
			'author_id',
		]);

		// Then attempt concurrent
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??) ALGORITHM=INPLACE LOCK=NONE', [
			'posts_author_id_index',
			'posts',
			'author_id',
		]);
	});

	test('createIndex handles empty options object', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('categories', 'name', {});

		expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', ['categories_name_index', 'categories', 'name']);
	});

	test('createIndex works with different collection and field names', async () => {
		const { helper, mockRaw } = createHelper();
		await helper.createIndex('my_custom_table', 'my_custom_column');

		expect(mockRaw).toHaveBeenCalledWith('CREATE INDEX ?? ON ?? (??)', [
			'my_custom_table_my_custom_column_index',
			'my_custom_table',
			'my_custom_column',
		]);
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
