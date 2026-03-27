/**
 * Storage mocking utilities for service tests
 * Provides simplified mocks for @directus/storage module used in service testing
 */

import { PassThrough } from 'node:stream';
import type { Driver, StorageManager } from '@directus/storage';
import { vi } from 'vite-plus/test';

/**
 * Creates a mock Driver with common storage operations
 * All methods return sensible defaults and can be customized per-test
 *
 * @returns Mock Driver instance
 *
 * @example
 * ```typescript
 * // Create driver with default behavior
 * const mockDriver = createMockDriver();
 *
 * // Customize specific methods for your test using vi.mocked()
 * vi.mocked(mockDriver.stat).mockResolvedValue({ size: 1024, modified: new Date() });
 * vi.mocked(mockDriver.exists).mockResolvedValue(true);
 * vi.mocked(mockDriver.list).mockImplementation(async function* () {
 *   yield 'file1.jpg';
 *   yield 'file2.jpg';
 * });
 * ```
 */
export function createMockDriver(): Driver {
	return {
		read: vi.fn().mockResolvedValue(new PassThrough()),
		write: vi.fn().mockResolvedValue(undefined),
		stat: vi.fn().mockResolvedValue({ size: 0, modified: new Date() }),
		exists: vi.fn().mockResolvedValue(false),
		move: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		copy: vi.fn().mockResolvedValue(undefined),
		list: vi.fn().mockImplementation(async function* () {
			// Default: no files
		}),
	};
}

/**
 * Creates a mock StorageManager with a location method
 * By default, returns a standard mock driver for any location
 *
 * @param driver - Optional driver to return from location(). If not provided, creates a default mock driver
 * @returns Mock StorageManager instance
 *
 * @example
 * ```typescript
 * // Basic usage - auto-creates a default driver
 * const mockStorage = createMockStorage();
 *
 * // With explicit driver instance for per-test customization
 * const mockDriver = createMockDriver();
 * const mockStorage = createMockStorage(mockDriver);
 *
 * // Now you can modify mockDriver behavior in individual tests using vi.mocked()
 * vi.mocked(mockDriver.exists).mockResolvedValue(true);
 * ```
 */
export function createMockStorage(driver?: Driver): StorageManager {
	const mockDriver = driver ?? createMockDriver();

	return {
		location: vi.fn(() => mockDriver),
		registerDriver: vi.fn(),
		registerLocation: vi.fn(),
		drivers: {},
		locations: {},
	} as unknown as StorageManager;
}

/**
 * Creates a standard storage mock for the getStorage module
 * This should be used with vi.mock('../storage/index.js')
 *
 * @param driver - Optional custom driver to use
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Basic setup - all tests use same driver behavior
 * import { getStorage } from '../storage/index.js';
 *
 * vi.mock('../storage/index.js');
 *
 * beforeEach(() => {
 *   const mockStorage = createMockStorage();
 *   vi.mocked(getStorage).mockResolvedValue(mockStorage);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Per-test driver customization - modify behavior in individual tests
 * import { getStorage } from '../storage/index.js';
 * import type { Driver, StorageManager } from '@directus/storage';
 *
 * vi.mock('../storage/index.js');
 *
 * describe('updateMany', () => {
 *   let service: FilesService;
 *   let mockDriver: Driver;
 *   let mockStorage: StorageManager;
 *
 *   beforeEach(() => {
 *     service = new FilesService({
 *       knex: db,
 *       schema: { collections: {}, relations: [] },
 *     });
 *
 *     // Create default mock
 *     mockDriver = createMockDriver();
 *     mockStorage = createMockStorage(mockDriver);
 *     vi.mocked(getStorage).mockResolvedValue(mockStorage);
 *   });
 *
 *   it('should move file when filename changes', async () => {
 *     // Customize driver behavior for this specific test using vi.mocked()
 *     vi.mocked(mockDriver.list).mockImplementation(async function* () {
 *       yield 'old-file.jpg';
 *     });
 *
 *     await service.updateMany([1], { filename_disk: 'new-file.jpg' });
 *
 *     expect(mockDriver.move).toHaveBeenCalledWith('old-file.jpg', 'new-file.jpg');
 *   });
 *
 *   it('should delete original when remote exists', async () => {
 *     // Different behavior for this test using vi.mocked()
 *     vi.mocked(mockDriver.exists).mockResolvedValue(true);
 *     vi.mocked(mockDriver.list).mockImplementation(async function* () {
 *       yield 'old-file.jpg';
 *     });
 *
 *     await service.updateMany([1], { filename_disk: 'new-file.jpg' });
 *
 *     expect(mockDriver.delete).toHaveBeenCalledWith('old-file.jpg');
 *   });
 * });
 * ```
 */
export function mockStorage(driver?: Driver) {
	const storage = createMockStorage(driver);

	return {
		getStorage: vi.fn().mockResolvedValue(storage),
		_cache: { storage: null },
	};
}
