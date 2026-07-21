import type { SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';

const bus = vi.hoisted(() => ({ publish: vi.fn(), subscribe: vi.fn() }));

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');

	return mockEnv({
		CACHE_ENABLED: true,
		CACHE_STORE: 'memory',
		CACHE_AUTO_PURGE: true,
		CACHE_NAMESPACE: 'directus-test',
		CACHE_TTL: '10m',
		CACHE_SYSTEM_TTL: '10m',
	});
});

vi.mock('../bus/index.js', () => ({ useBus: () => bus }));
vi.mock('../redis/index.js', () => ({ redisConfigAvailable: () => false }));
vi.mock('../permissions/cache.js', () => ({ clearCache: vi.fn() }));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../license/index.js', () => ({
	getEntitlementManager: () => ({ clearCache: vi.fn(), isEntitled: () => true }),
}));

vi.mock('../license/entitlements/lib/custom-permission-rules-enabled.js', () => ({
	hasCustomRule: vi.fn().mockReturnValue(false),
	isRecommendedAppPermission: vi.fn().mockReturnValue(false),
}));

vi.mock('../permissions/lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn() }));
vi.mock('../permissions/lib/fetch-policies.js', () => ({ fetchPolicies: vi.fn() }));
vi.mock('../permissions/lib/with-app-minimal-permissions.js', () => ({ withAppMinimalPermissions: vi.fn() }));
vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('../utils/should-clear-cache.js', () => ({ shouldClearCache: vi.fn().mockReturnValue(true) }));

const { setMemorySchemaCache, getMemorySchemaCache } = await import('../cache.js');
const { AccessService } = await import('./access.js');
const { PermissionsService } = await import('./permissions.js');
const { PoliciesService } = await import('./policies.js');

const SCHEMA = { collections: {}, relations: [] } as unknown as SchemaOverview;

describe('permission/policy writes leave the schema cache intact', () => {
	const { db } = createMockKnex();

	beforeEach(() => {
		vi.clearAllMocks();
		setMemorySchemaCache(SCHEMA);
	});

	test('PermissionsService.deleteMany does not purge the schema cache', async () => {
		await new PermissionsService({ knex: db, schema: SCHEMA }).deleteMany([1]);
		expect(getMemorySchemaCache()).toBeDefined();
	});

	test('PoliciesService.deleteMany does not purge the schema cache', async () => {
		await new PoliciesService({ knex: db, schema: SCHEMA }).deleteMany([1]);
		expect(getMemorySchemaCache()).toBeDefined();
	});

	test('AccessService.deleteMany does not purge the schema cache', async () => {
		await new AccessService({ knex: db, schema: SCHEMA }).deleteMany([1]);
		expect(getMemorySchemaCache()).toBeDefined();
	});
});
