/**
 * FoldersService mocking utilities for service tests
 * Provides simplified mocks for src/services/folders module used in service testing
 */

import { vi } from 'vitest';
import { mockItemsService } from './items-service.js';

/**
 * Creates a standard FoldersService mock for service tests
 * This matches the pattern used in CollectionsService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./folders.js', async () => {
 *   const { mockFoldersService } = await import('../test-utils/folders-service.js');
 *   return mockFoldersService();
 * });
 *
 * // To dynamically change FoldersService behavior during tests:
 * import { FoldersService } from './folders.js';
 * vi.spyOn(FoldersService.prototype, 'addColumnToTable').mockImplementation((table, collection, field) => {
 *   // custom implementation
 * });
 * ```
 */
export function mockFoldersService() {
	const { ItemsService: FoldersService } = mockItemsService();

	// non-crud methods
	FoldersService.prototype.buildTree = vi.fn().mockResolvedValue(new Map([['1', 'root']]));

	return { FoldersService };
}
