/**
 * Schema mocking utilities for service tests
 * Provides simplified mocks for @directus/schema module used in service testing
 */

import { vi } from 'vitest';

/**
 * Creates a standard schema inspector mock for service tests
 * This matches the pattern used across all service test files
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('@directus/schema', () => mockSchema());
 *
 * // To dynamically change inspector behavior during tests, import and mock directly:
 * import { createInspector } from '@directus/schema';
 * vi.mocked(createInspector).mockReturnValue({
 *   tableInfo: vi.fn().mockResolvedValue([{ name: 'custom_table' }]),
 *   // ... other custom behaviors
 * });
 * ```
 */
export function mockSchema() {
	return {
		createInspector: vi.fn().mockReturnValue({
			tableInfo: vi.fn().mockResolvedValue([]),
			columnInfo: vi.fn().mockResolvedValue([]),
			primary: vi.fn().mockResolvedValue('id'),
			foreignKeys: vi.fn().mockResolvedValue([]),
			withSchema: vi.fn().mockReturnThis(),
		}),
	};
}
