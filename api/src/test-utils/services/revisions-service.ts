/**
 * RevisionsService mocking utilities for service tests
 * Provides simplified mocks for src/services/revisions module used in service testing
 */

import { vi } from 'vitest';
import { mockItemsService } from './items-service.js';

/**
 * Creates a standard RevisionsService mock for service tests
 * This matches the pattern used in CollectionsService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./revisions.js', async () => {
 *   const { mockRevisionsService } = await import('../test-utils/services/revisions-service.js');
 *   return mockRevisionsService();
 * });
 *
 * // To dynamically change RevisionsService behavior during tests:
 * import { RevisionsService } from './revisions.js';
 * vi.spyOn(RevisionsService.prototype, 'addColumnToTable').mockImplementation((table, collection, field) => {
 *   // custom implementation
 * });
 * ```
 */
export function mockRevisionsService() {
	const { ItemsService: RevisionsService } = mockItemsService();

	RevisionsService.prototype.revert = vi.fn().mockResolvedValue(undefined);

	return { RevisionsService };
}
