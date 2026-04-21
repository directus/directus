import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission, Query } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLicenseEntitlements } from '../license/summary.js';
import { withAppMinimalPermissions } from '../permissions/lib/with-app-minimal-permissions.js';
import { ItemsService } from './items.js';
import { PermissionsService } from './permissions.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
}));

vi.mock('../license/summary.js', async () => {
	const actual = await vi.importActual<typeof import('../license/summary.js')>('../license/summary.js');
	return {
		...actual,
		getLicenseEntitlements: vi.fn(),
	};
});

vi.mock('../permissions/lib/with-app-minimal-permissions.js', async () => {
	const actual = await vi.importActual<typeof import('../permissions/lib/with-app-minimal-permissions.js')>(
		'../permissions/lib/with-app-minimal-permissions.js',
	);

	return {
		...actual,
		withAppMinimalPermissions: vi.fn((_accountability, permissions) => permissions),
	};
});

const schema = new SchemaBuilder()
	.collection('directus_permissions', (collection) => {
		collection.field('id').integer().primary();
		collection.field('policy').string();
		collection.field('collection').string();
		collection.field('action').string();
		collection.field('permissions').json();
		collection.field('validation').json();
		collection.field('presets').json();
		collection.field('fields').json();
	})
	.build();

describe('PermissionsService', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));

	beforeEach(() => {
		vi.mocked(withAppMinimalPermissions).mockImplementation((_accountability, permissions) => permissions);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns custom permissions unchanged when the entitlement is enabled', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: true,
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				fields: ['name'],
				presets: null,
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const query: Query = { filter: { policy: { _eq: 'policy-1' } } };
		const result = await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(query, undefined);
		expect(withAppMinimalPermissions).toHaveBeenCalledWith(service.accountability, result, query.filter);
		expect(result).toHaveLength(1);
	});

	it('filters non-system custom permission rows when the entitlement is disabled', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				fields: ['*'],
				presets: null,
				permissions: null,
				validation: null,
			},
			{
				id: 2,
				fields: ['name'],
				presets: null,
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({});

		expect(result).toStrictEqual([
			{
				id: 1,
				fields: ['*'],
				presets: null,
				permissions: null,
				validation: null,
			},
		]);
	});

	it('filters using classifier fields while preserving the requested projection', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				fields: ['*'],
				presets: null,
				permissions: null,
				validation: null,
			},
			{
				id: 2,
				fields: ['name'],
				presets: null,
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({
			fields: ['id'],
		});

		expect(readByQuerySpy).toHaveBeenCalledWith(
			{
				fields: ['id', 'fields', 'permissions', 'validation', 'presets'],
			},
			undefined,
		);

		expect(result).toStrictEqual([{ id: 1 }]);
	});

	it('removes only injected classifier fields when restoring the requested shape', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				policy: {
					id: 'policy-1',
					name: 'Policy 1',
				},
				fields: ['*'],
				presets: null,
				permissions: null,
				validation: null,
			},
		] as any);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({
			fields: ['id', 'policy.*'],
		});

		expect(result).toStrictEqual([
			{
				id: 1,
				policy: {
					id: 'policy-1',
					name: 'Policy 1',
				},
			},
		]);
	});

	it('preserves system permission rows even when they are custom-shaped', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				system: true,
				fields: ['name'],
				presets: { status: 'draft' },
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({});

		expect(result).toStrictEqual([
			{
				id: 1,
				system: true,
				fields: ['name'],
				presets: { status: 'draft' },
				permissions: null,
				validation: null,
			},
		]);
	});

	it('treats presets-only permission rows as custom', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				fields: ['*'],
				presets: { status: 'draft' },
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({});

		expect(result).toStrictEqual([]);
	});

	it('treats wildcard rows with no other custom state as full access', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_policy_rules_enabled: false,
		} as any);

		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
			{
				id: 1,
				fields: ['*', 'title'],
				presets: null,
				permissions: null,
				validation: null,
			},
		] as Permission[]);

		const service = new PermissionsService({
			knex: db,
			schema,
		});

		const result = await service.readByQuery({});

		expect(result).toStrictEqual([
			{
				id: 1,
				fields: ['*', 'title'],
				presets: null,
				permissions: null,
				validation: null,
			},
		]);
	});
});
