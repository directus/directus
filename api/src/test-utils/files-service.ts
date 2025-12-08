/**
 * FilesService mocking utilities for service tests
 * Provides simplified mocks for src/services/files module used in service testing
 */

import { vi } from 'vitest';
import { mockItemsService } from './items-service.js';

/**
 * Creates a standard FilesService mock for service tests
 * This matches the pattern used in CollectionsService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./files.js', async () => {
 *   const { mockFilesService } = await import('../test-utils/files-service.js');
 *   return mockFilesService();
 * });
 *
 * // To dynamically change FilesService behavior during tests:
 * import { FilesService } from './files.js';
 * vi.spyOn(FilesService.prototype, 'addColumnToTable').mockImplementation((table, collection, field) => {
 *   // custom implementation
 * });
 * ```
 */
export function mockFilesService() {
	const { ItemsService: FilesService } = mockItemsService();

	// non-crud methods
	FilesService.prototype.uploadOne = vi.fn().mockResolvedValue(1);
	FilesService.prototype.importOne = vi.fn().mockResolvedValue(1);

	return { FilesService };
}
