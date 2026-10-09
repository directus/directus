import { ResourceRestrictedError } from '@directus/errors';
import type { Permission, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';

const bus = vi.hoisted(() => ({ publish: vi.fn(), subscribe: vi.fn() }));
const entitlements = vi.hoisted(() => ({ clearCache: vi.fn(), isEntitled: vi.fn(() => true) }));

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
	getEntitlementManager: () => entitlements,
}));

vi.mock('../license/entitlements/lib/custom-permission-rules-enabled.js', () => ({
	hasCustomRule: vi.fn().mockReturnValue(false),
	isRecommendedAppPermission: vi.fn().mockReturnValue(false),
}));

vi.mock('../permissions/lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn() }));
vi.mock('../permissions/lib/fetch-policies.js', () => ({ fetchPolicies: vi.fn() }));

vi.mock('../permissions/lib/with-app-minimal-permissions.js', () => ({
	withAppMinimalPermissions: vi.fn((_accountability, permissions) => permissions),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('../utils/should-clear-cache.js', () => ({ shouldClearCache: vi.fn().mockReturnValue(true) }));

const { setMemorySchemaCache, getMemorySchemaCache } = await import('../cache.js');

const { hasCustomRule, isRecommendedAppPermission } = await import(
	'../license/entitlements/lib/custom-permission-rules-enabled.js'
);

const { ItemsService } = await import('./items.js');
const { withAppMinimalPermissions } = await import('../permissions/lib/with-app-minimal-permissions.js');
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

describe('custom_permission_rules_enabled not entitled', () => {
	const { db } = createMockKnex();
	const service = () => new PermissionsService({ knex: db, schema: SCHEMA });

	const custom = { collection: 'articles', action: 'read', fields: ['title'] };
	const full = { collection: 'articles', action: 'read', fields: ['*'] };

	beforeEach(() => {
		vi.clearAllMocks();
		entitlements.isEntitled.mockReturnValue(false);
		vi.mocked(hasCustomRule).mockImplementation((p) => !p.fields?.includes('*'));
	});

	afterEach(() => {
		entitlements.isEntitled.mockReturnValue(true);
		vi.mocked(hasCustomRule).mockReturnValue(false);
		vi.mocked(isRecommendedAppPermission).mockReturnValue(false);
	});

	test.each([
		['createOne', () => service().createOne(custom)],
		['updateMany', () => service().updateMany([1], custom)],
	])('%s with a custom rule rejects before writing', async (method, mutate) => {
		await expect(mutate()).rejects.toBeInstanceOf(ResourceRestrictedError);
		expect(ItemsService.prototype[method as 'createOne' | 'updateMany']).not.toHaveBeenCalled();
	});

	test('createOne with a full-access rule is allowed', async () => {
		await service().createOne(full);

		expect(ItemsService.prototype.createOne).toHaveBeenCalled();
	});

	test('createOne with a recommended app permission is allowed despite being custom', async () => {
		vi.mocked(isRecommendedAppPermission).mockReturnValue(true);

		await service().createOne(custom);

		expect(ItemsService.prototype.createOne).toHaveBeenCalled();
	});

	test('readByQuery hides stored custom rules but keeps full-access ones', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([full, custom]);

		expect(await service().readByQuery({})).toEqual([full]);
	});

	test('readByQuery keeps recommended app permissions despite being custom', async () => {
		const recommended: Partial<Permission> = { collection: 'directus_files', action: 'update', fields: ['title'] };
		vi.mocked(isRecommendedAppPermission).mockImplementation((p) => p === recommended);
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([recommended, custom]);

		expect(await service().readByQuery({})).toEqual([recommended]);
	});

	test('readByQuery appends the app minimal permissions after filtering, so they are never hidden', async () => {
		const minimal: Partial<Permission> = { collection: 'directus_comments', action: 'update', fields: ['comment'] };

		vi.mocked(withAppMinimalPermissions).mockImplementationOnce((_accountability, permissions) => [
			...permissions,
			minimal,
		]);

		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([custom]);

		expect(await service().readByQuery({})).toEqual([minimal]);
	});

	test('readByQuery re-selects the rule fields it needs to filter, then strips them from the result', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([{ id: 1, fields: ['*'] }]);

		expect(await service().readByQuery({ fields: ['id'] })).toEqual([{ id: 1 }]);

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(
			{ fields: ['id', 'fields', 'permissions', 'validation', 'presets'] },
			undefined,
		);
	});
});

describe('custom_permission_rules_enabled entitled', () => {
	const { db } = createMockKnex();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(hasCustomRule).mockReturnValue(true);
	});

	afterEach(() => {
		vi.mocked(hasCustomRule).mockReturnValue(false);
	});

	test('createOne with a custom rule is allowed', async () => {
		await new PermissionsService({ knex: db, schema: SCHEMA }).createOne({ collection: 'articles', fields: ['title'] });

		expect(ItemsService.prototype.createOne).toHaveBeenCalled();
	});

	test('readByQuery returns custom rules unfiltered', async () => {
		const custom = { collection: 'articles', action: 'read', fields: ['title'] };
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([custom]);

		expect(await new PermissionsService({ knex: db, schema: SCHEMA }).readByQuery({})).toEqual([custom]);
	});
});
