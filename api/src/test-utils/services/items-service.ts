/**
 * ItemsService mocking utilities for service tests
 * Provides simplified mocks for src/services/items module used in service testing
 */

import { vi } from 'vitest';
import type { ItemsService } from '../../services/index.js';

/**
 * Creates a standard ItemsService mock for service tests
 * This matches the pattern used across all service test files
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./items.js', () => mockItemsService());
 *
 * // To dynamically change ItemsService behavior during tests, import and mock directly:
 * import { ItemsService } from './items.js';
 * vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('new-id');
 * ```
 */
export function mockItemsService() {
	const service = vi.fn(function (this: ItemsService, collection, options) {
		this.collection = collection;
		this.knex = options?.knex;
		this.accountability = options?.accountability || null;
		this.schema = options?.schema ?? { collections: {}, relations: [] };
		return this;
	});

	// Provide sensible default return values for common operations
	service.prototype.createOne = vi.fn().mockResolvedValue(1);
	service.prototype.createMany = vi.fn().mockResolvedValue([1]);
	service.prototype.readOne = vi.fn().mockResolvedValue({});
	service.prototype.readMany = vi.fn().mockResolvedValue([]);
	service.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	service.prototype.updateOne = vi.fn().mockResolvedValue(1);
	service.prototype.updateMany = vi.fn().mockResolvedValue([1]);
	service.prototype.updateBatch = vi.fn().mockResolvedValue([1]);
	service.prototype.updateByQuery = vi.fn().mockResolvedValue([1]);
	service.prototype.upsertOne = vi.fn().mockResolvedValue(1);
	service.prototype.upsertMany = vi.fn().mockResolvedValue([1]);
	service.prototype.deleteOne = vi.fn().mockResolvedValue(1);
	service.prototype.deleteMany = vi.fn().mockResolvedValue([1]);
	service.prototype.deleteByQuery = vi.fn().mockResolvedValue([1]);
	service.prototype.readSingleton = vi.fn().mockResolvedValue({});
	service.prototype.upsertSingleton = vi.fn().mockResolvedValue(1);

	return { ItemsService: service };
}
