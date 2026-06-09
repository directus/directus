/**
 * CollectionsService mocking utilities for service tests
 * Provides simplified mocks for src/services/collections module used in service testing
 */

import { vi } from 'vitest';
import type { CollectionsService } from '../../services/collections.js';

/**
 * Creates a standard CollectionsService mock for service tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./collections.js', async () => {
 *   const { mockCollectionsService } = await import('../test-utils/services/collections-service.js');
 *   return mockCollectionsService();
 * });
 *
 * // To dynamically change behavior during tests:
 * import { CollectionsService } from '../collectioms.js';
 * vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([...]);
 * ```
 */
export function mockCollectionsService() {
	const service = vi.fn(function (this: CollectionsService, options) {
		this.knex = options?.knex;
		this.accountability = options?.accountability ?? null;
		this.schema = options?.schema ?? { collections: {}, relations: [] };
		return this;
	});

	service.prototype.readByQuery = vi.fn().mockResolvedValue([]);

	return { CollectionsService: service };
}
