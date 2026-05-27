import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import getDatabase from '../../database/index.js';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../permissions/lib/fetch-policies.js';
import { validateItemAccess } from '../../permissions/modules/validate-access/lib/validate-item-access.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../permissions/utils/process-permissions.js';
import { getSchema } from '../../utils/get-schema.js';
import { getService } from '../../utils/get-service.js';
import { permissionCache } from './permissions-cache.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('../../database/index.js', () => ({
	default: vi.fn(() => ({})),
}));

vi.mock('../../utils/get-schema.js');
vi.mock('../../utils/get-service.js');
vi.mock('../../permissions/lib/fetch-permissions.js');
vi.mock('../../permissions/lib/fetch-policies.js');
vi.mock('../../permissions/utils/extract-required-dynamic-variable-context.js');
vi.mock('../../permissions/utils/fetch-dynamic-variable-data.js');
vi.mock('../../permissions/utils/process-permissions.js');
vi.mock('../../permissions/modules/validate-access/lib/validate-item-access.js');
vi.mock('../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

describe('Permissions Integration', () => {
	const defaultAccountability = { user: 'user-1', role: 'role-1', roles: ['role-1'], admin: false };

	beforeEach(async () => {
		vi.clearAllMocks();
		permissionCache.clear();
		vi.useFakeTimers();

		vi.mocked(getSchema).mockResolvedValue({
			collections: {
				articles: {
					primary: 'id',
					fields: {
						id: { type: 'integer' },
						title: { type: 'string' },
						status: { type: 'string' },
						publish_date: { type: 'datetime' },
					},
				},
				directus_users: { primary: 'id', fields: { id: { type: 'uuid' }, department: { type: 'uuid' } } },
				departments: { primary: 'id', fields: { id: { type: 'uuid' }, team: { type: 'uuid' } } },
				teams: { primary: 'id', fields: { id: { type: 'uuid' }, name: { type: 'string' } } },
				comments: { primary: 'id', fields: { id: { type: 'integer' }, article_id: { type: 'integer' } } },
				settings: {
					singleton: true,
					primary: 'id',
					fields: { id: { type: 'integer' }, site_name: { type: 'string' } },
				},
			},
			relations: [
				{ collection: 'articles', field: 'author', related_collection: 'directus_users' },
				{ collection: 'directus_users', field: 'department', related_collection: 'departments' },
				{ collection: 'departments', field: 'team', related_collection: 'teams' },
				{
					collection: 'comments',
					field: 'article_id',
					related_collection: 'articles',
					meta: { one_field: 'comments' },
				},
			],
		} as any);

		vi.mocked(fetchPolicies).mockResolvedValue(['policy-1']);
		vi.mocked(processPermissions).mockImplementation(({ permissions }) => permissions);
		vi.mocked(fetchDynamicVariableData).mockResolvedValue({});
		vi.mocked(extractRequiredDynamicVariableContextForPermissions).mockReturnValue({} as any);
		vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: true, allowedRootFields: ['*'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * Required:
	 * - name: Test name
	 * - collection: Collection to test
	 * - item: Item ID (use null for singletons)
	 * - action: Action to test ('read' or 'update')
	 * - permissions: Array of permission rules to mock
	 * - itemData: Mock item data (or null for non-existent items)
	 * - expectedFields: Expected fields returned (or null/[] for edge cases)
	 *
	 * Optional:
	 * - accountability: Custom accountability object (defaults to defaultAccountability)
	 * - systemTime: Mock system time for $NOW tests
	 * - verifyTTL: Verify TTL is passed to cache.set()
	 * - verifyTags: Array of dependency tags to verify
	 * - skipFetchPermissions: Verify fetchPermissions was NOT called
	 * - accessDenied: Mock validateItemAccess to return false
	 * - itemNotFound: Mock service to reject with error
	 * - isSingleton: Use readSingleton instead of readOne
	 */
	const testCases = [
		// Access Control
		{
			name: 'Admin bypass',
			collection: 'articles',
			item: '1',
			action: 'read',
			accountability: { admin: true, user: 'admin-user', role: null, roles: [] },
			permissions: [],
			itemData: { id: 1 },
			expectedFields: ['*'],
			skipFetchPermissions: true,
		},
		{
			name: 'Access denied (validateItemAccess returns false)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['title'], permissions: { status: { _eq: 'secret' } } }],
			itemData: { id: 1, status: 'draft' },
			expectedFields: [],
			accessDenied: true,
		},
		{
			name: 'Item non-existence',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['*'], permissions: { id: { _eq: 1 } } }],
			itemData: null,
			expectedFields: null,
			itemNotFound: true,
		},
		{
			name: 'Missing collection in schema',
			collection: 'non_existent_collection',
			item: '1',
			action: 'read',
			permissions: [],
			itemData: { id: 1 },
			expectedFields: [],
			skipFetchPermissions: true,
		},
		// Operators
		{
			name: 'Basic comparison (_eq)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['title'], permissions: { status: { _eq: 'published' } } }],
			itemData: { id: 1, status: 'published' },
			expectedFields: ['title'],
		},
		{
			name: 'Null check (_null)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['*'], permissions: { status: { _null: true } } }],
			itemData: { id: 1, status: null },
			expectedFields: ['*'],
		},
		{
			name: 'Logical operator (_and)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [
				{ fields: ['title', 'status'], permissions: { _and: [{ status: { _eq: 'published' } }, { id: { _eq: 1 } }] } },
			],
			itemData: { id: 1, status: 'published' },
			expectedFields: ['title', 'status'],
		},
		// Dynamic Variables
		{
			name: 'Dynamic variable $NOW (TTL check)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['*'], permissions: { publish_date: { _gt: '$NOW' } } }],
			itemData: { id: 1, publish_date: '2025-01-01T15:00:00Z' },
			expectedFields: ['*'],
			systemTime: '2025-01-01T12:00:00Z',
			verifyTTL: true,
		},
		{
			name: 'Deep path dynamic variable ($CURRENT_USER.department.team)',
			collection: 'articles',
			item: '1',
			action: 'read',
			accountability: { ...defaultAccountability, user: 'user-uuid' },
			permissions: [{ fields: ['*'], permissions: { team_id: { _eq: '$CURRENT_USER.department.team.id' } } }],
			itemData: { id: 1 },
			expectedFields: ['*'],
			verifyTags: ['directus_users:user-uuid', 'departments', 'teams'],
		},
		{
			name: 'Dynamic variable $CURRENT_ROLES (Array)',
			collection: 'articles',
			item: '1',
			action: 'read',
			accountability: { ...defaultAccountability, roles: ['role-a', 'role-b'] },
			permissions: [{ fields: ['*'], permissions: { allowed_roles: { _in: '$CURRENT_ROLES' } } }],
			itemData: { id: 1 },
			expectedFields: ['*'],
			verifyTags: ['directus_roles'],
		},
		// Aggregations & Relations
		{
			name: 'Aggregation (count)',
			collection: 'articles',
			item: '1',
			action: 'read',
			permissions: [{ fields: ['*'], permissions: { 'count(comments)': { _gt: 0 } } }],
			itemData: { id: 1 },
			expectedFields: ['*'],
			verifyTags: ['comments'],
		},
		// Others
		{
			name: 'Update action',
			collection: 'articles',
			item: '1',
			action: 'update',
			permissions: [{ fields: ['title'], permissions: { status: { _eq: 'draft' } } }],
			itemData: { id: 1, status: 'draft' },
			expectedFields: ['title'],
		},
		{
			name: 'Singleton collection',
			collection: 'settings',
			item: null,
			action: 'read',
			permissions: [{ fields: ['site_name'], permissions: { id: { _eq: 1 } } }],
			itemData: { id: 1, site_name: 'My Site' },
			expectedFields: ['site_name'],
			isSingleton: true,
		},
	];

	for (const testCase of testCases) {
		test(testCase.name, async () => {
			if (testCase.systemTime) vi.setSystemTime(new Date(testCase.systemTime));

			const accountability = testCase.accountability || defaultAccountability;
			const collection = testCase.collection;
			const item = testCase.item;
			const action = testCase.action;

			vi.mocked(fetchPermissions).mockResolvedValue(testCase.permissions as any);

			// Handle non-existent item case
			if (testCase.itemNotFound) {
				vi.mocked(getService).mockReturnValue({
					readOne: vi.fn().mockRejectedValue(new Error('Item not found')),
					readSingleton: vi.fn().mockRejectedValue(new Error('Item not found')),
				} as any);
			} else {
				const readOneMock = vi.fn().mockResolvedValue(testCase.itemData);
				const readSingletonMock = vi.fn().mockResolvedValue(testCase.itemData);

				vi.mocked(getService).mockReturnValue({
					readOne: readOneMock,
					readSingleton: readSingletonMock,
				} as any);
			}

			// Handle access denied case
			if (testCase.accessDenied) {
				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: false,
					allowedRootFields: [],
				});
			} else if (testCase.expectedFields && testCase.expectedFields !== null) {
				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: testCase.expectedFields,
				});
			}

			// First call
			const fields1 = await verifyPermissions(accountability as any, collection, item, action as any, {
				knex: getDatabase(),
				schema: await getSchema(),
			});

			expect(fields1).toEqual(testCase.expectedFields);

			// Verify fetchPermissions was not called for admin/missing collection cases
			if (testCase.skipFetchPermissions) {
				expect(fetchPermissions).not.toHaveBeenCalled();
				return; // Skip cache verification
			}

			// Skip cache verification for null results (non-existent item)
			if (testCase.expectedFields === null) {
				return;
			}

			// Verify cache presence
			expect(permissionCache.get(accountability as any, collection, String(item), action)).toEqual(
				testCase.expectedFields,
			);

			// Verify TTL if requested
			if (testCase.verifyTTL) {
				const spy = vi.spyOn(permissionCache, 'set');
				permissionCache.clear();

				await verifyPermissions(accountability as any, collection, item, action as any, {
					knex: getDatabase(),
					schema: await getSchema(),
				});

				expect(spy).toHaveBeenCalledWith(
					expect.anything(),
					collection,
					String(item),
					action,
					expect.anything(),
					expect.anything(),
					expect.any(Number),
				);
			}

			// Verify tags if requested
			if (testCase.verifyTags) {
				const spy = vi.spyOn(permissionCache, 'set');
				permissionCache.clear();

				await verifyPermissions(accountability as any, collection, item, action as any, {
					knex: getDatabase(),
					schema: await getSchema(),
				});

				const call = spy.mock.calls[0];
				const deps = call![5];

				for (const tag of testCase.verifyTags) {
					expect(deps).toContain(tag);
				}
			}

			// Second call should hit cache
			vi.mocked(fetchPermissions).mockClear();

			const fields2 = await verifyPermissions(accountability as any, collection, item, action as any, {
				knex: getDatabase(),
				schema: await getSchema(),
			});

			expect(fields2).toEqual(testCase.expectedFields);
			expect(fetchPermissions).not.toHaveBeenCalled();
		});
	}

	test('Record update clears collection-level dependency', async () => {
		const accountability = defaultAccountability;
		const collection = 'articles';
		const item = '1';
		const action = 'read';

		vi.mocked(fetchPermissions).mockResolvedValue([
			{ fields: ['*'], permissions: { 'count(comments)': { _gt: 0 } } },
		] as any);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1 }),
		} as any);

		await verifyPermissions(accountability as any, collection, item, action, {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeDefined();

		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'comments', keys: ['123'] });

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeUndefined();
	});

	test('Multi-Policy Union', async () => {
		const accountability = defaultAccountability;
		const collection = 'articles';
		const item = '1';
		const action = 'read';

		vi.mocked(fetchPermissions).mockResolvedValue([
			{ fields: ['title'], permissions: { status: { _eq: 'published' } } },
			{ fields: ['status'], permissions: { id: { _gt: 0 } } },
		] as any);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, status: 'published' }),
		} as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title', 'status'],
		});

		const fields = await verifyPermissions(accountability as any, collection, item, action, {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(fields).toContain('title');
		expect(fields).toContain('status');
		expect(fields).not.toContain('publish_date');
	});

	test('$CURRENT_USER update', async () => {
		const accountability = { ...defaultAccountability, user: 'user-abc' };
		const collection = 'articles';
		const item = '1';
		const action = 'read';

		vi.mocked(fetchPermissions).mockResolvedValue([
			{ fields: ['*'], permissions: { owner: { _eq: '$CURRENT_USER' } } },
		] as any);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, owner: 'user-abc' }),
		} as any);

		await verifyPermissions(accountability as any, collection, item, action, {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeDefined();

		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_users', keys: ['user-abc'] });

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeUndefined();
	});

	test('TTL auto-expiry', async () => {
		const accountability = defaultAccountability;
		const collection = 'articles';
		const item = '1';
		const action = 'read';

		vi.mocked(fetchPermissions).mockResolvedValue([
			{ fields: ['*'], permissions: { publish_date: { _gt: '$NOW' } } },
		] as any);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, publish_date: '2025-01-01T13:00:00Z' }),
		} as any);

		vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));

		await verifyPermissions(accountability as any, collection, item, action, {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeDefined();

		await vi.advanceTimersByTimeAsync(3600010);

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeUndefined();
	});

	test('System-level change', async () => {
		const accountability = defaultAccountability;
		const collection = 'articles';
		const item = '1';
		const action = 'read';

		vi.mocked(fetchPermissions).mockResolvedValue([
			{ fields: ['*'], permissions: { status: { _eq: 'published' } } },
		] as any);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, status: 'published' }),
		} as any);

		await verifyPermissions(accountability as any, collection, item, action, {
			knex: getDatabase(),
			schema: await getSchema(),
		});

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeDefined();

		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_permissions' });

		expect(permissionCache.get(accountability as any, collection, item, action)).toBeUndefined();
	});
});
