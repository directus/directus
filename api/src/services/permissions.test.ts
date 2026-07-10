import { SchemaBuilder } from '@directus/schema-builder';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as cacheModule from '../cache.js';
import { createMockKnex } from '../test-utils/knex.js';
import { AccessService } from './access.js';
import { PermissionsService } from './permissions.js';
import { PoliciesService } from './policies.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv();
});

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../utils/should-clear-cache.js', () => ({
	shouldClearCache: vi.fn().mockReturnValue(true),
}));

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
vi.mock('../permissions/cache.js', () => ({ clearCache: vi.fn() }));

const schema = new SchemaBuilder()
	.collection('directus_permissions', (c) => {
		c.field('id').integer().primary();
	})
	.collection('directus_policies', (c) => {
		c.field('id').string().primary();
	})
	.build();

/**
 * Regression guard for the policy-save performance fix.
 *
 * Permissions and policies are NOT part of SchemaOverview ({ collections, relations }),
 * so mutating them must not trigger a structural schema reload. These tests lock in that
 * such mutations use clearPermissionRelatedCache() (permission caches only) and never call
 * clearSystemCache() (which nulls + reloads the schema on every instance). If a future change
 * reintroduces clearSystemCache() here, the per-write schema reload — and the associated
 * ~N× slowdown under DB latency — comes back, and these tests fail.
 */
describe('permission/policy writes do not reload the schema', () => {
	const { db } = createMockKnex();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('PermissionsService.deleteMany clears the permission cache, not the schema cache', async () => {
		const service = new PermissionsService({ knex: db, schema });
		await service.deleteMany([1]);
		expect(cacheModule.clearPermissionRelatedCache).toHaveBeenCalledTimes(1);
		expect(cacheModule.clearSystemCache).not.toHaveBeenCalled();
	});

	test('PoliciesService.deleteMany clears the permission cache, not the schema cache', async () => {
		const service = new PoliciesService({ knex: db, schema });
		await service.deleteMany([1]);
		expect(cacheModule.clearPermissionRelatedCache).toHaveBeenCalledTimes(1);
		expect(cacheModule.clearSystemCache).not.toHaveBeenCalled();
	});

	test('AccessService.deleteMany clears the permission cache, not the schema cache', async () => {
		const service = new AccessService({ knex: db, schema });
		await service.deleteMany([1]);
		expect(cacheModule.clearPermissionRelatedCache).toHaveBeenCalledTimes(1);
		expect(cacheModule.clearSystemCache).not.toHaveBeenCalled();
	});
});
