/**
 * RelationsService mocking utilities for service tests
 * Provides simplified mocks for src/services/relations module used in service testing
 */

import { vi } from 'vitest';
import type { RelationsService } from '../../services/relations.js';

/**
 * Creates a standard RelationsService mock for service tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./relations.js', async () => {
 *   const { mockRelationsService } = await import('../test-utils/services/relations-service.js');
 *   return mockRelationsService();
 * });
 *
 * // To dynamically change behavior during tests:
 * import { RelationsService } from './relations.js';
 * vi.mocked(RelationsService.prototype.readAll).mockResolvedValue([...]);
 * ```
 */
export function mockRelationsService() {
	const service = vi.fn(function (this: RelationsService, options) {
		this.knex = options?.knex;
		this.accountability = options?.accountability ?? null;
		this.schema = options?.schema ?? { collections: {}, relations: [] };
		return this;
	});

	service.prototype.readAll = vi.fn().mockResolvedValue([]);
	service.prototype.readOne = vi.fn().mockResolvedValue({});

	return { RelationsService: service };
}
