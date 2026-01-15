import { ServiceUnavailableError } from '@directus/errors';
import { describe as registryDescribe } from '@directus/extensions-registry';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getExtensionManager } from '../extensions/index.js';
import { ExtensionsService } from './extensions.js';
import { ItemsService } from './items.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({})),
}));

vi.mock('@directus/extensions-registry', () => ({
	describe: vi.fn(),
}));

vi.mock('../extensions/index.js', () => ({
	getExtensionManager: vi.fn(),
}));

vi.mock('./items.js', () => ({
	ItemsService: vi.fn(),
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
}));

describe('ExtensionsService', () => {
	let mockExtensionManager: any;
	let mockExtensionsItemService: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockExtensionsItemService = {
			createOne: vi.fn(),
			createMany: vi.fn(),
			readOne: vi.fn(),
			updateOne: vi.fn(),
			deleteOne: vi.fn(),
			deleteByQuery: vi.fn(),
			readByQuery: vi.fn(),
		};

		mockExtensionManager = {
			install: vi.fn(),
			uninstall: vi.fn(),
			extensions: [],
			getExtension: vi.fn(),
			reload: vi.fn(),
			broadcastReloadNotification: vi.fn(),
		};

		vi.mocked(getExtensionManager).mockReturnValue(mockExtensionManager);

		vi.mocked(ItemsService).mockImplementation(() => mockExtensionsItemService);

		vi.mocked(registryDescribe).mockResolvedValue({
			data: {
				type: 'interface',
				versions: [
					{
						id: 'test-version',
						bundled: [],
					},
				],
			},
		} as any);
	});

	describe('install', () => {
		test('should propagate extension manager install error', async () => {
			mockExtensionManager.install.mockRejectedValue(
				new ServiceUnavailableError({
					service: 'marketplace',
					reason: 'Could not download the extension',
				}),
			);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			await expect(service.install('test-extension', 'test-version')).rejects.toThrow(
				'Could not download the extension',
			);
		});
	});
});
