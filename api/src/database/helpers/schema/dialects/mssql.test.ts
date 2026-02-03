import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { SchemaHelperMSSQL } from './mssql.js';

vi.mock('../../index.js', () => ({
	getDatabaseClient: vi.fn(),
}));

describe('SchemaHelperMSSQL', () => {
	function createHelper() {
		const mockRaw = vi.fn();
		const mockKnex = { raw: mockRaw } as unknown as Knex;
		const helper = new SchemaHelperMSSQL(mockKnex);
		return { helper, mockRaw };
	}

	test('createIndex creates a standard index without options when edition check succeeds', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('users', 'email');

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', ['users_email_index', 'users', 'email']);
	});

	test('createIndex creates a unique index when unique option is true', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('users', 'email', { unique: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE UNIQUE INDEX ?? ON ?? (??)', [
			'users_email_unique',
			'users',
			'email',
		]);
	});

	test('createIndex creates a standard index when unique option is false', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('products', 'sku', { unique: false });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', ['products_sku_index', 'products', 'sku']);
	});

	test('createIndex creates a blocking index when attemptConcurrentIndex is true but edition is not Enterprise', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Falls back to blocking index for non-Enterprise editions
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex creates an online index when attemptConcurrentIndex is true and edition is Enterprise', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Enterprise Edition' }]);

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Uses ONLINE for Enterprise edition
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??) WITH (ONLINE = ON)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex creates an online unique index when both options are true and edition is Enterprise', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Enterprise Edition' }]);

		await helper.createIndex('users', 'username', { attemptConcurrentIndex: true, unique: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE UNIQUE INDEX ?? ON ?? (??) WITH (ONLINE = ON)', [
			'users_username_unique',
			'users',
			'username',
		]);
	});

	test('createIndex creates a blocking unique index when attemptConcurrentIndex is true, unique is true, but edition is not Enterprise', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Developer Edition' }]);

		await helper.createIndex('posts', 'slug', { attemptConcurrentIndex: true, unique: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Falls back to blocking unique index
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE UNIQUE INDEX ?? ON ?? (??)', [
			'posts_slug_unique',
			'posts',
			'slug',
		]);
	});

	test('createIndex handles empty options object', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('categories', 'name', {});

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'categories_name_index',
			'categories',
			'name',
		]);
	});

	test('createIndex handles edition check returning undefined', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: undefined }]);

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Falls back to blocking when edition is undefined
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex handles edition check returning non-string value', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 123 }]);

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Falls back to blocking when edition is not a string
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex handles edition starting with Enterprise but different casing', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'enterprise Edition (64-bit)' }]);

		await helper.createIndex('orders', 'status', { attemptConcurrentIndex: true });

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		// Falls back because it checks for case-sensitive 'Enterprise' at the start
		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'orders_status_index',
			'orders',
			'status',
		]);
	});

	test('createIndex works with different collection and field names', async () => {
		const { helper, mockRaw } = createHelper();
		mockRaw.mockResolvedValueOnce([{ edition: 'Standard Edition' }]);

		await helper.createIndex('my_custom_table', 'my_custom_column');

		expect(mockRaw).toHaveBeenNthCalledWith(1, `SELECT SERVERPROPERTY('edition') AS edition`);

		expect(mockRaw).toHaveBeenNthCalledWith(2, 'CREATE INDEX ?? ON ?? (??)', [
			'my_custom_table_my_custom_column_index',
			'my_custom_table',
			'my_custom_column',
		]);
	});
});
