import { ServiceUnavailableError } from '@directus/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies at the top level
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

describe('ExtensionsService - Error Propagation', () => {
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

		const { getExtensionManager } = vi.mocked(await import('../extensions/index.js'));
		getExtensionManager.mockReturnValue(mockExtensionManager);

		const ItemsServiceModule = await import('./items.js');
		vi.mocked(ItemsServiceModule.ItemsService).mockImplementation(() => mockExtensionsItemService);

		const { describe: mockDescribeRegistry } = vi.mocked(await import('@directus/extensions-registry'));
		mockDescribeRegistry.mockResolvedValue({
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
		it('should propagate ServiceUnavailableError with permission message from ExtensionManager', async () => {
			const { ExtensionsService } = await import('./extensions.js');

			const permissionError = new ServiceUnavailableError({
				service: 'marketplace',
				reason: 'Insufficient permissions to write to the extensions directory. Please check file system permissions',
			});

			mockExtensionManager.install.mockRejectedValue(permissionError);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			try {
				await service.install('test-extension', 'test-version');
				expect.fail('Expected error to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(ServiceUnavailableError);
				expect((error as any).extensions.reason).toBe(
					'Insufficient permissions to write to the extensions directory. Please check file system permissions',
				);
				expect((error as any).extensions.service).toBe('marketplace');
			}
		});

		it('should propagate ServiceUnavailableError with disk space message from ExtensionManager', async () => {
			const { ExtensionsService } = await import('./extensions.js');

			const diskSpaceError = new ServiceUnavailableError({
				service: 'marketplace',
				reason: 'Insufficient disk space to install the extension',
			});

			mockExtensionManager.install.mockRejectedValue(diskSpaceError);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			try {
				await service.install('test-extension', 'test-version');
				expect.fail('Expected error to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(ServiceUnavailableError);
				expect((error as any).extensions.reason).toBe('Insufficient disk space to install the extension');
				expect((error as any).extensions.service).toBe('marketplace');
			}
		});

		it('should propagate ServiceUnavailableError with directory error message from ExtensionManager', async () => {
			const { ExtensionsService } = await import('./extensions.js');

			const directoryError = new ServiceUnavailableError({
				service: 'marketplace',
				reason: 'Extensions directory path does not exist or is inaccessible',
			});

			mockExtensionManager.install.mockRejectedValue(directoryError);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			try {
				await service.install('test-extension', 'test-version');
				expect.fail('Expected error to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(ServiceUnavailableError);
				expect((error as any).extensions.reason).toBe('Extensions directory path does not exist or is inaccessible');
				expect((error as any).extensions.service).toBe('marketplace');
			}
		});

		it('should propagate ServiceUnavailableError with file limit error message from ExtensionManager', async () => {
			const { ExtensionsService } = await import('./extensions.js');

			const fileLimitError = new ServiceUnavailableError({
				service: 'marketplace',
				reason: 'Too many open files during extension installation',
			});

			mockExtensionManager.install.mockRejectedValue(fileLimitError);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			try {
				await service.install('test-extension', 'test-version');
				expect.fail('Expected error to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(ServiceUnavailableError);
				expect((error as any).extensions.reason).toBe('Too many open files during extension installation');
				expect((error as any).extensions.service).toBe('marketplace');
			}
		});

		it('should propagate generic ServiceUnavailableError from ExtensionManager', async () => {
			const { ExtensionsService } = await import('./extensions.js');

			const networkError = new ServiceUnavailableError({
				service: 'marketplace',
				reason: 'Could not download and extract the extension',
			});

			mockExtensionManager.install.mockRejectedValue(networkError);

			const service = new ExtensionsService({
				knex: {} as any,
				schema: {} as any,
				accountability: null,
			});

			try {
				await service.install('test-extension', 'test-version');
				expect.fail('Expected error to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(ServiceUnavailableError);
				expect((error as any).extensions.reason).toBe('Could not download and extract the extension');
				expect((error as any).extensions.service).toBe('marketplace');
			}
		});
	});
});
