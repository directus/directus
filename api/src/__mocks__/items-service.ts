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
	// Provide sensible default return values for common operations
	ItemsService.prototype.createOne = vi.fn().mockResolvedValue(1);
	ItemsService.prototype.createMany = vi.fn().mockResolvedValue([1]);
	ItemsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	ItemsService.prototype.readOne = vi.fn().mockResolvedValue({});
	ItemsService.prototype.readMany = vi.fn().mockResolvedValue([]);
	ItemsService.prototype.updateOne = vi.fn().mockResolvedValue(1);
	ItemsService.prototype.updateMany = vi.fn().mockResolvedValue([1]);
	ItemsService.prototype.updateByQuery = vi.fn().mockResolvedValue([1]);
	ItemsService.prototype.deleteOne = vi.fn().mockResolvedValue(1);
	ItemsService.prototype.deleteMany = vi.fn().mockResolvedValue([1]);
	ItemsService.prototype.deleteByQuery = vi.fn().mockResolvedValue([1]);
	return { ItemsService };
}
