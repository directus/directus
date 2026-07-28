/**
 * UsersService mocking utilities for service tests
 * Provides simplified mocks for src/services/users module used in service testing
 */

import { mockItemsService } from './items-service.js';

/**
 * Creates a standard UsersService mock for service tests
 * This matches the pattern used in FilesService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./users.js', async () => {
 *   const { mockUsersService } = await import('../test-utils/services/users-service.js');
 *   return mockUsersService();
 * });
 *
 * // To dynamically change UsersService behavior during tests:
 * import { UsersService } from './users.js';
 * vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([...]);
 * ```
 */
export function mockUsersService() {
	const { ItemsService: UsersService } = mockItemsService();

	return { UsersService };
}
