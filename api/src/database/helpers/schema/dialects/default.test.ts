import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperDefault } from './default.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperDefault', () => {
	function createHelper() {
		const mockKnex = { raw: vi.fn() } as unknown as Knex;
		const helper = new SchemaHelperDefault(mockKnex);
		return { helper, mockKnex };
	}

	describe('getVersion', () => {
		test('returns null', async () => {
			const { helper } = createHelper();
			const result = await helper.getVersion();
			expect(result).toBeNull();
		});
	});

	describe('getDatabaseSize', () => {
		test('returns null', async () => {
			const { helper } = createHelper();
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
