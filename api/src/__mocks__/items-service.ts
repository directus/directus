/**
 * ItemsService mocking utilities for service tests
 * Provides simplified mocks for src/services/items module used in service testing
 */

import { vi } from 'vitest';

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
	const ItemsService = vi.fn();
	ItemsService.prototype.createOne = vi.fn();
	ItemsService.prototype.createMany = vi.fn();
	ItemsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	ItemsService.prototype.readOne = vi.fn();
	ItemsService.prototype.readMany = vi.fn();
	ItemsService.prototype.updateOne = vi.fn();
	ItemsService.prototype.updateMany = vi.fn();
	ItemsService.prototype.updateByQuery = vi.fn();
	ItemsService.prototype.deleteOne = vi.fn();
	ItemsService.prototype.deleteMany = vi.fn();
	ItemsService.prototype.deleteByQuery = vi.fn();
	return { ItemsService };
}
