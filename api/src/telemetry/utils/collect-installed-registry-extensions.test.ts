import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectInstalledRegistryExtensions } from './collect-installed-registry-extensions.js';

vi.mock('@directus/extensions-registry', () => ({
	DEFAULT_REGISTRY: 'https://registry.directus.io',
}));

vi.mock('../../services/extensions.js', () => ({
	ExtensionsService: vi.fn().mockImplementation(() => ({
		readAll: vi.fn().mockResolvedValue([]),
	})),
}));

import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { ExtensionsService } from '../../services/extensions.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectInstalledRegistryExtensions', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns installed registry extensions with id and version', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'ext-1',
					bundle: null,
					meta: { id: 'ext-1', source: 'registry', enabled: true },
					schema: { name: '@directus-labs/some-ext', version: '1.0.0', type: 'operation' },
				},
				{
					id: 'ext-2',
					bundle: null,
					meta: { id: 'ext-2', source: 'registry', enabled: true },
					schema: { name: '@directus-labs/another-ext', version: '2.1.0', type: 'interface' },
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://registry.directus.io',
		});

		expect(result).toEqual([
			{ id: 'ext-1', version: '1.0.0' },
			{ id: 'ext-2', version: '2.1.0' },
		]);
	});

	test('excludes bundle children from installed registry extensions', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'bundle-1',
					bundle: null,
					meta: { id: 'bundle-1', source: 'registry', enabled: true },
					schema: { name: '@directus-labs/card-select', version: '1.0.0', type: 'bundle' },
				},
				{
					id: 'child-1',
					bundle: 'bundle-1',
					meta: { id: 'child-1', source: 'registry', enabled: true },
					schema: { name: 'radio-cards-interface', type: 'interface' },
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://registry.directus.io',
		});

		expect(result).toEqual([
			{ id: 'bundle-1', version: '1.0.0' },
		]);
	});

	test('excludes non-registry extensions from installed list', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'local-ext',
					bundle: null,
					meta: { id: 'local-ext', source: 'local', enabled: true },
					schema: { name: 'my-local-hook', version: '0.1.0', type: 'hook' },
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://registry.directus.io',
		});

		expect(result).toEqual([]);
	});

	test('returns empty array when MARKETPLACE_REGISTRY is set to a custom registry', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'ext-1',
					bundle: null,
					meta: { id: 'ext-1', source: 'registry', enabled: true },
					schema: { name: '@directus-labs/some-ext', version: '1.0.0', type: 'operation' },
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://custom-registry.example.com',
		});

		expect(result).toEqual([]);
	});

	test('returns registry extensions when MARKETPLACE_REGISTRY is set to the default registry', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'ext-1',
					bundle: null,
					meta: { id: 'ext-1', source: 'registry', enabled: true },
					schema: { name: '@directus-labs/some-ext', version: '1.0.0', type: 'operation' },
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://registry.directus.io',
		});

		expect(result).toEqual([
			{ id: 'ext-1', version: '1.0.0' },
		]);
	});

	test('excludes registry extensions with null schema', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{
					id: 'ext-no-schema',
					bundle: null,
					meta: { id: 'ext-no-schema', source: 'registry', enabled: true },
					schema: null,
				},
			]),
		}) as any);

		const result = await collectInstalledRegistryExtensions(mockDb, mockSchema, {
			MARKETPLACE_REGISTRY: 'https://registry.directus.io',
		});

		expect(result).toEqual([]);
	});
});
