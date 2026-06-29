import { appRecommendedPermissions } from '@directus/system-data';
import type { Permission } from '@directus/types';
import { merge } from 'lodash-es';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../../services/index.js';
import {
	checkCustomPermissionRules,
	hasCustomRule,
	isRecommendedAppPermission,
} from './custom-permission-rules-enabled.js';

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../services/index.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	return { ItemsService: mockItemsService().ItemsService };
});

afterEach(() => {
	vi.clearAllMocks();
});

function makePermission(overrides?: Partial<Permission>): Partial<Permission> {
	return merge(
		{
			collection: 'articles',
			action: 'read',
		} as Partial<Permission>,
		overrides,
	);
}

describe('hasCustomRule', () => {
	test('no custom fields (fields:["*"]) with no permissions/validation/presets returns false', () => {
		expect(hasCustomRule(makePermission({ fields: ['*'] }))).toBe(false);
	});

	test('restrict to no fileds (fields:null) returns true', () => {
		expect(hasCustomRule(makePermission({ fields: null }))).toBe(true);
	});

	test('specific field selection allowed (fields:["name"]) returns true', () => {
		expect(hasCustomRule(makePermission({ fields: ['name'] }))).toBe(true);
	});

	// #RC-TODO: Add `fields` to check, a PATCH can be partial and should NOT mean custom rule
	test.each(['permissions', 'validation', 'presets'] as const)('missing %s key returns false', (missingKey) => {
		const permission: Partial<Permission> = { fields: ['*'], permissions: {}, validation: {}, presets: {} };
		delete permission[missingKey];

		expect(hasCustomRule(makePermission(permission))).toBe(false);
	});

	test('system permissions (system:true) always return false', () => {
		expect(hasCustomRule(makePermission({ system: true, permissions: { name: { _eq: 'x' } } }))).toBe(false);
	});

	test('no custom fields (fields:["*"]) with empty permissions/validation/presets returns false', () => {
		expect(hasCustomRule(makePermission({ fields: ['*'], permissions: {}, validation: {}, presets: {} }))).toBe(false);
	});

	test('any permissions rule returns true', () => {
		expect(hasCustomRule(makePermission({ fields: ['*'], permissions: { name: { _eq: 'x' } } }))).toBe(true);
	});

	test('any validation rule returns true', () => {
		expect(hasCustomRule(makePermission({ fields: ['*'], validation: { name: { _eq: 'x' } } }))).toBe(true);
	});

	test('any set preset returns true', () => {
		expect(hasCustomRule(makePermission({ fields: ['*'], presets: { name: 'default' } }))).toBe(true);
	});
});

describe('isRecommendedAppPermission', () => {
	const sampleRecommended = appRecommendedPermissions[0];

	test('matches a known recommended permission exactly returns true', () => {
		expect(isRecommendedAppPermission({ ...sampleRecommended })).toBe(true);
	});

	test('has validation returns false (recommended never have validation)', () => {
		expect(isRecommendedAppPermission({ ...sampleRecommended, validation: { name: { _eq: 'x' } } })).toBe(false);
	});

	test('has presets returns false (recommended never have presets)', () => {
		expect(isRecommendedAppPermission({ ...sampleRecommended, presets: { foo: 'bar' } })).toBe(false);
	});

	test('custom collection returns false', () => {
		expect(isRecommendedAppPermission(makePermission({ collection: 'articles', fields: ['*'] }))).toBe(false);
	});

	test('custom fields on system recommended permissions collection+action returns false', () => {
		expect(isRecommendedAppPermission({ ...sampleRecommended, fields: ['only_one_field'] })).toBe(false);
	});

	test('custom permission on system recommended permissions collection+action returns false', () => {
		expect(isRecommendedAppPermission({ ...sampleRecommended, permissions: { totally: { _eq: 'value' } } })).toBe(
			false,
		);
	});
});

describe('checkCustomPermissionRules', () => {
	test('no permissions returns true', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([]);

		await expect(checkCustomPermissionRules()).resolves.toBe(true);
	});

	test('queries for any custom permission rule', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([]);

		await checkCustomPermissionRules();

		expect(ItemsService).toHaveBeenCalledWith('directus_permissions', expect.any(Object));

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith({
			limit: -1,
			filter: {
				_or: [
					{ permissions: { _nnull: true } },
					{ validation: { _nnull: true } },
					{ presets: { _nnull: true } },
					{ fields: { _nnull: true } },
				],
			},
		});
	});

	test('no custom fields (fields:["*"]) with no permissions/validation/presets returns true', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([makePermission({ fields: ['*'] })]);

		await expect(checkCustomPermissionRules()).resolves.toBe(true);
	});

	test('all recommended permissions returns true', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([...appRecommendedPermissions]);

		await expect(checkCustomPermissionRules()).resolves.toBe(true);
	});

	test('a custom rule mixed with recommended permissions returns false', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([
			...appRecommendedPermissions,
			makePermission({ fields: ['name'] }),
		]);

		await expect(checkCustomPermissionRules()).resolves.toBe(false);
	});
});
