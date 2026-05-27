import { useEnv } from '@directus/env';
import { list } from '@directus/extensions-registry';
import type { Extension } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getExtensionsSettings } from './get-extensions-settings.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({})),
}));

vi.mock('@directus/extensions-registry', () => ({
	list: vi.fn(),
}));

vi.mock('../../database/index.js', () => ({
	default: vi.fn(() => ({})),
}));

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn(() => ({})),
}));

const mockReadByQuery = vi.fn();
const mockCreateMany = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock('../../services/extensions.js', () => ({
	ExtensionsService: vi.fn(() => ({
		extensionsItemService: {
			readByQuery: mockReadByQuery,
			createMany: mockCreateMany,
			deleteMany: mockDeleteMany,
		},
	})),
}));

const MOCK_EXTENSION_ID = 'test-marketplace-id';

const mockRegistryExtension: Extension = {
	name: 'directus-extension-test',
	type: 'interface',
	path: './extensions/.registry/some-folder',
	local: false,
	entrypoint: 'index.js',
	host: '^11.0.0',
	version: '1.0.0',
};

beforeEach(() => {
	vi.clearAllMocks();
	mockReadByQuery.mockResolvedValue([]);
});

describe('getExtensionsSettings', () => {
	describe('MARKETPLACE_REGISTRY', () => {
		test('should pass MARKETPLACE_REGISTRY to list() when set', async () => {
			const customRegistry = 'https://custom-registry.example.com';

			vi.mocked(useEnv).mockReturnValue({ MARKETPLACE_REGISTRY: customRegistry } as any);

			vi.mocked(list).mockResolvedValue({
				data: [{ id: MOCK_EXTENSION_ID, name: mockRegistryExtension.name }],
				meta: {},
			} as any);

			const registryMap = new Map<string, Extension>();
			registryMap.set('some-folder', mockRegistryExtension);

			await getExtensionsSettings({
				local: new Map(),
				module: new Map(),
				registry: registryMap,
			});

			expect(list).toHaveBeenCalledWith({ search: mockRegistryExtension.name }, { registry: customRegistry });
		});

		test('should pass empty options to list() when MARKETPLACE_REGISTRY is not set', async () => {
			vi.mocked(useEnv).mockReturnValue({} as any);

			vi.mocked(list).mockResolvedValue({
				data: [{ id: MOCK_EXTENSION_ID, name: mockRegistryExtension.name }],
				meta: {},
			} as any);

			const registryMap = new Map<string, Extension>();
			registryMap.set('some-folder', mockRegistryExtension);

			await getExtensionsSettings({
				local: new Map(),
				module: new Map(),
				registry: registryMap,
			});

			expect(list).toHaveBeenCalledWith({ search: mockRegistryExtension.name }, {});
		});

		test('should not call list() for local extensions', async () => {
			const localMap = new Map<string, Extension>();
			localMap.set('local-folder', { ...mockRegistryExtension, local: true });

			await getExtensionsSettings({
				local: localMap,
				module: new Map(),
				registry: new Map(),
			});

			expect(list).not.toHaveBeenCalled();
		});
	});
});
