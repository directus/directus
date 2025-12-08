/**
 * FieldsService mocking utilities for service tests
 * Provides simplified mocks for src/services/fields module used in service testing
 */

import { vi } from 'vitest';
import { mockItemsService } from './items-service.js';

/**
 * Creates a standard FieldsService mock for service tests
 * This matches the pattern used in CollectionsService tests
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('./fields.js', async () => {
 *   const { mockFieldsService } = await import('../test-utils/fields-service.js');
 *   return mockFieldsService();
 * });
 *
 * // To dynamically change FieldsService behavior during tests:
 * import { FieldsService } from './fields.js';
 * vi.spyOn(FieldsService.prototype, 'addColumnToTable').mockImplementation((table, collection, field) => {
 *   // custom implementation
 * });
 * ```
 */
export function mockFieldsService() {
	const { ItemsService: FieldsService } = mockItemsService();

	// Mock common methods used by other services (like CollectionsService)
	FieldsService.prototype.addColumnToTable = vi.fn().mockImplementation(() => {});
	FieldsService.prototype.addColumnIndex = vi.fn().mockResolvedValue(undefined);
	FieldsService.prototype.deleteField = vi.fn().mockResolvedValue(undefined);
	FieldsService.prototype.createField = vi.fn().mockResolvedValue(undefined);
	FieldsService.prototype.updateField = vi.fn().mockResolvedValue('field');

	return { FieldsService };
}
