import { merge } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../../../bus/index.js';
import getDatabase from '../../../database/index.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { permissionCache } from './permissions-cache.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('../../../database/index.js', () => ({
	default: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockReturnThis(),
	})),
}));

vi.mock('../../../emitter.js', () => ({
	default: {
		onAction: vi.fn(),
		offAction: vi.fn(),
	},
}));

vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');
vi.mock('./field-permissions.js');
vi.mock('../../../utils/get-service.js');
vi.mock('../../../permissions/lib/fetch-permissions.js');
vi.mock('../../../permissions/lib/fetch-policies.js');
vi.mock('../../../permissions/utils/extract-required-dynamic-variable-context.js');
vi.mock('../../../permissions/utils/fetch-dynamic-variable-data.js');
vi.mock('../../../permissions/utils/process-permissions.js');
vi.mock('../../../permissions/modules/validate-access/lib/validate-item-access.js');
vi.mock('../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

const getAccountability = (overrides = {}) =>
	merge(
		{
			user: 'Mock User',
			role: 'Mock Role',
			roles: ['Mock Role'],
			app: false,
			admin: false,
			ip: '127.0.0.1',
		},
		overrides,
	);

const mockData = new Map();
const mockLocks = new Map();

vi.mock('./store.js', () => {
	return {
		useStore: (uid: string) => {
			return async (callback: any) => {
				const lock = mockLocks.get(uid) || Promise.resolve();

				const nextLock = lock.then(async () => {
					return await callback({
						has: async (key: string) => mockData.has(`${uid}:${key}`),
						get: async (key: string) => mockData.get(`${uid}:${key}`),
						set: async (key: string, value: any) => {
							mockData.set(`${uid}:${key}`, value);
						},
						delete: async (key: string) => {
							mockData.delete(`${uid}:${key}`);
						},
					});
				});

				mockLocks.set(
					uid,
					nextLock.catch(() => {}),
				);

				return nextLock;
			};
		},
	};
});

afterEach(() => {
	vi.clearAllMocks();
	mockData.clear();
	mockLocks.clear();
});

beforeEach(() => {
	permissionCache.clear();

	vi.mocked(getService).mockReturnValue({
		readOne: vi.fn().mockResolvedValue({ id: 1, date: '2099-01-01' }),
		readSingleton: vi.fn().mockResolvedValue({}),
	} as any);

	vi.mocked(fetchPolicies).mockResolvedValue(['policy-1']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{
			fields: ['*'],
			permissions: {},
			validation: {},
		},
	] as any);

	vi.mocked(processPermissions).mockImplementation(({ permissions }) => permissions);
	vi.mocked(fetchDynamicVariableData).mockResolvedValue({});
	vi.mocked(extractRequiredDynamicVariableContextForPermissions).mockReturnValue({} as any);

	vi.mocked(getSchema).mockResolvedValue({
		collections: {
			coll: { primary: 'id', singleton: false, fields: {} },
			articles: { primary: 'id', singleton: false, fields: {} },
		},
		relations: [],
	} as any);

	vi.mocked(validateItemAccess).mockResolvedValue({
		accessAllowed: true,
		allowedRootFields: ['*'],
	});
});

describe('Room.verifyPermissions', () => {
	const item = '1';
	const collection = 'articles';

	beforeEach(async () => {
		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, publish_date: '2025-12-23T10:00:00Z', status: 'draft' }),
			readSingleton: vi.fn().mockResolvedValue({ id: 1, title: 'Settings' }),
		} as any);

		vi.mocked(getSchema).mockResolvedValue({
			collections: {
				articles: {
					collection: 'articles',
					primary: 'id',
					fields: {
						id: { field: 'id', type: 'integer' },
						title: { field: 'title', type: 'string' },
						status: { field: 'status', type: 'string' },
						publish_date: { field: 'publish_date', type: 'datetime' },
						authors: { field: 'authors', type: 'alias' },
					},
				},
				authors: {
					collection: 'authors',
					primary: 'id',
					fields: {
						id: { field: 'id', type: 'integer' },
						name: { field: 'name', type: 'string' },
					},
				},
				settings: {
					collection: 'settings',
					singleton: true,
					primary: 'id',
					fields: {
						id: { field: 'id', type: 'integer' },
						title: { field: 'title', type: 'string' },
					},
				},
			},
			relations: [
				{
					collection: 'articles',
					field: 'authors',
					related_collection: 'authors',
				},
			],
		} as any);
	});

	test('returns empty array if item access is denied by validateItemAccess', async () => {
		const client = getAccountability({ uid: 'client-denied' });

		vi.mocked(validateItemAccess).mockResolvedValueOnce({
			accessAllowed: false,
			allowedRootFields: [],
		});

		vi.mocked(fetchPermissions).mockResolvedValueOnce([
			{
				fields: ['*'],
				permissions: { id: { _eq: 1 } },
				validation: {},
			},
		] as any);

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toEqual([]);
		expect(fetchPermissions).toHaveBeenCalled();
		expect(validateItemAccess).toHaveBeenCalled();
	});

	test('TTL Accuracy ($NOW)', async () => {
		const client = getAccountability({ uid: 'client-1' });

		// Mock time to 2025-12-22T10:00:00Z
		vi.setSystemTime(new Date('2025-12-22T10:00:00Z'));

		const rawPerms = [
			{
				fields: ['title'],
				permissions: { publish_date: { _gt: '$NOW' }, id: { _eq: 1 } },
				validation: {},
			},
		];

		vi.mocked(fetchPermissions).mockResolvedValue(rawPerms as any);

		vi.mocked(processPermissions).mockReturnValue([
			{
				fields: ['title'],
				permissions: { publish_date: { _gt: new Date('2025-12-22T10:00:00Z') } },
				validation: {},
			},
		] as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title'],
		});

		// Current time: 10:00:00
		// publish_date: 2025-12-23T10:00:00Z (24 hours in future)
		// Rule: publish_date > $NOW
		// This will flip when $NOW reaches publish_date.
		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toContain('title');

		expect(spy).toHaveBeenCalledWith(
			expect.anything(),
			collection,
			item,
			'read',
			expect.arrayContaining(['title']),
			expect.anything(),
			3600000, // Capped at 1 hour
		);

		vi.useRealTimers();
	});

	test('Aggregation & Relational Dependencies', async () => {
		const client = getAccountability({ user: 'user-client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: { 'count(authors)': { _gt: 0 } },
				validation: {},
			},
		] as any);

		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({ user: 'user-client-1' }),
			collection,
			item,
			'read',
			['*'],
			['authors'],
			undefined,
		);
	});

	test('Singleton collection handling', async () => {
		const client = getAccountability({ uid: 'client-1' });

		const serviceMock = vi.mocked(getService)('settings', {} as any);

		vi.mocked(fetchPermissions).mockResolvedValueOnce([
			{
				fields: ['*'],
				permissions: { id: { _eq: 1 } },
				validation: {},
			},
		] as any);

		await verifyPermissions(client, 'settings', null, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(serviceMock.readSingleton).toHaveBeenCalled();
		expect(serviceMock.readOne).not.toHaveBeenCalled();
	});

	test('Singleton with item rules returns allowed fields', async () => {
		const client = getAccountability({ uid: 'client-restricted' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { title: { _eq: 'Settings' } },
				validation: {},
			},
		] as any);

		vi.mocked(processPermissions).mockReturnValue([
			{
				fields: ['title'],
				permissions: { title: { _eq: 'Settings' } },
				validation: {},
			},
		] as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title'],
		});

		permissionCache.clear();

		const fields = await verifyPermissions(client, 'settings', null, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toContain('title');
		expect(fields!.length).toBeGreaterThan(0);
	});

	test('Permission merging (union of fields)', async () => {
		const client = getAccountability({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { status: { _eq: 'draft' } },
				validation: {},
			},
			{
				fields: ['status'],
				permissions: {}, // Always matches
				validation: {},
			},
		] as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title', 'status'],
		});

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toContain('title');
		expect(fields).toContain('status');
		expect(fields).not.toContain('publish_date');
	});

	test('Admin bypass', async () => {
		const client = getAccountability({ admin: true });

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toEqual(['*']);
		expect(fetchPermissions).not.toHaveBeenCalled();
	});

	test('Cache hit skips permission fetch', async () => {
		const client = getAccountability({ uid: 'client-1' });

		// First call - populates cache
		vi.mocked(fetchPermissions).mockResolvedValueOnce([
			{
				fields: ['*'],
				permissions: { id: { _eq: 1 } },
				validation: {},
			},
		] as any);

		await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fetchPermissions).toHaveBeenCalledTimes(1);

		// Second call - should hit cache
		await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fetchPermissions).toHaveBeenCalledTimes(1);
	});

	test('Validation error returns empty fields', async () => {
		const client = getAccountability({ uid: 'client-fail' });

		vi.mocked(fetchPermissions).mockRejectedValueOnce(new Error('DB Error'));

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toEqual([]);
	});

	test('Deep Relational Dependencies', async () => {
		const client = getAccountability({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: {
					_and: [{ status: { _eq: 'published' } }, { authors: { name: { _contains: 'John' } } }],
				},
				validation: {},
			},
		] as any);

		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		const firstCall = spy.mock.calls.find((c) => c[5]?.includes('authors'));
		expect(firstCall).toBeDefined();
		expect(firstCall![5]).toContain('authors');
	});

	test('Global collection access (null primary key)', async () => {
		const client = getAccountability({ uid: 'client-1' });

		vi.mocked(fetchAllowedFields).mockResolvedValue(['title']);

		const serviceMock = vi.mocked(getService)('articles', {} as any);

		const fields = await verifyPermissions(client, 'articles', null, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toEqual(['title']);
		expect(serviceMock.readOne).not.toHaveBeenCalled();

		expect(fetchAllowedFields).toHaveBeenCalledWith(
			{ accountability: client, action: 'read', collection: 'articles' },
			expect.anything(),
		);
	});

	test('Verifies getService is called with correct context', async () => {
		const client = getAccountability({ uid: 'client-svc' });

		await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(getService).toHaveBeenCalledWith(
			collection,
			expect.objectContaining({
				schema: expect.anything(),
				knex: expect.anything(),
				accountability: client,
			}),
		);
	});

	test('Complex permission merging (union of fields across policies)', async () => {
		const client = getAccountability({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { id: { _eq: 1 } },
				validation: {},
			},
			{
				fields: ['status'],
				permissions: {},
				validation: {},
			},
		] as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title', 'status'],
		});

		const fields = await verifyPermissions(client, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toContain('title');
		expect(fields).toContain('status');
		expect(fields).not.toContain('id');
	});

	test('Handles error from getService', async () => {
		const client = getAccountability({ uid: 'client-1' });

		vi.mocked(getService).mockImplementation(() => {
			throw new Error();
		});

		const fields = await verifyPermissions(client, collection, item, 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toEqual([]);
	});
});

describe('PermissionCache Invalidation', () => {
	test('Schema change invalidates cache', async () => {
		const client = getAccountability({ uid: 'client-1' });

		// Populate cache
		await verifyPermissions(client, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(client, 'articles', '1', 'read')).toBeDefined();

		// Trigger schema change invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_fields' });

		// Cache should be cleared
		expect(permissionCache.get(client, 'articles', '1', 'read')).toBeUndefined();
	});

	test('Collection metadata change invalidates cache', async () => {
		const client = getAccountability({ uid: 'client-1' });

		// Populate cache
		await verifyPermissions(client, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(client, 'articles', '1', 'read')).toBeDefined();

		// Trigger collection metadata change invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_collections' });

		// Cache should be cleared
		expect(permissionCache.get(client, 'articles', '1', 'read')).toBeUndefined();
	});

	test('Race condition protection in verifyPermissions', async () => {
		const client = getAccountability({ uid: 'client-race' });

		// Mock a slow permission fetch
		vi.mocked(fetchPermissions).mockImplementationOnce(async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
			return [{ fields: ['title'], permissions: {}, validation: {} }] as any;
		});

		permissionCache.clear();
		const setSpy = vi.spyOn(permissionCache, 'set');

		// Start permission verification
		const verifyPromise = verifyPermissions(client, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		// Immediately trigger an invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'articles', keys: ['1'] });

		await verifyPromise;

		// Should NOT have called set because invalidationCount changed
		expect(setSpy).not.toHaveBeenCalled();
	});

	test('User-specific dependency invalidation', async () => {
		const clientA = getAccountability({ user: 'user-a' });
		const clientB = getAccountability({ user: 'user-b' });

		// Mock a permission that depends on $CURRENT_USER property
		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { department: { _eq: '$CURRENT_USER.department' } },
				validation: {},
			},
		] as any);

		permissionCache.clear();

		// Populate cache for both users
		await verifyPermissions(clientA, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		await verifyPermissions(clientB, 'articles', '1', 'read', {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(clientA, 'articles', '1', 'read')).toBeDefined();
		expect(permissionCache.get(clientB, 'articles', '1', 'read')).toBeDefined();

		// Trigger invalidation for user A ONLY
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_users', key: 'user-a' });

		// Cache for user A should be cleared, but user B should remain
		expect(permissionCache.get(clientA, 'articles', '1', 'read')).toBeUndefined();
		expect(permissionCache.get(clientB, 'articles', '1', 'read')).toBeDefined();
	});

	test('LRU eviction when max size is reached', async () => {
		// Create a small cache with max size of 3
		const { PermissionCache } = await import('./permissions-cache.js');
		const smallCache = new PermissionCache(3);

		const accountability = getAccountability({ user: 'test-user' });

		// Add 3 entries
		smallCache.set(accountability, 'coll', 'item1', 'read', ['field1']);
		smallCache.set(accountability, 'coll', 'item2', 'read', ['field2']);
		smallCache.set(accountability, 'coll', 'item3', 'read', ['field3']);

		// All 3 should be present
		expect(smallCache.get(accountability, 'coll', 'item1', 'read')).toEqual(['field1']);
		expect(smallCache.get(accountability, 'coll', 'item2', 'read')).toEqual(['field2']);
		expect(smallCache.get(accountability, 'coll', 'item3', 'read')).toEqual(['field3']);

		// Access item1 to make it most recently used
		smallCache.get(accountability, 'coll', 'item1', 'read');

		// Add a 4th entry - should evict item2 (the least recently used after accessing item1)
		smallCache.set(accountability, 'coll', 'item4', 'read', ['field4']);

		// item1 should still be present (was accessed), item2 should be evicted
		expect(smallCache.get(accountability, 'coll', 'item1', 'read')).toEqual(['field1']);
		expect(smallCache.get(accountability, 'coll', 'item2', 'read')).toBeUndefined();
		expect(smallCache.get(accountability, 'coll', 'item3', 'read')).toEqual(['field3']);
		expect(smallCache.get(accountability, 'coll', 'item4', 'read')).toEqual(['field4']);
	});
});
