/**
 * ActivityService mocking utilities for service tests
 * Provides simplified mocks for src/services/activity module used in service testing
 */

import { mockItemsService } from './items-service.js';

/**
 * Creates a standard ActivityService mock for service tests
 * This matches the pattern used in CollectionsService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./activity.js', async () => {
 *   const { mockActivityService } = await import('../test-utils/services/activity-service.js');
 *   return mockActivityService();
 * });
 *
 * // To dynamically change ActivityService behavior during tests:
 * import { ActivityService } from './activity.js';
 * vi.spyOn(ActivityService.prototype, 'createOne').mockImplementation((table, collection, field) => {
 *   // custom implementation
 * });
 * ```
 */
export function mockActivityService() {
	const { ItemsService: ActivityService } = mockItemsService();

	return { ActivityService };
}
