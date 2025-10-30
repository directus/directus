/**
 * Cache mocking utilities for service tests
 * Provides simplified mocks for src/cache module used in service testing
 */

import { vi } from 'vitest';

/**
 * Creates a standard cache mock for service tests
 * This matches the pattern used across all service test files
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('../cache.js', () => mockCache());
 *
 * // To dynamically change cache behavior during tests, import and mock directly:
 * import { getCache } from '../cache.js';
 * vi.mocked(getCache).mockReturnValue({
 *   cache: { clear: vi.fn() },
 *   systemCache: { clear: vi.fn() },
 *   localSchemaCache: { get: vi.fn(), set: vi.fn() },
 * });
 * ```
 */
export function mockCache() {
	return {
		getCache: vi.fn().mockReturnValue({
			cache: {
				clear: vi.fn(),
			},
			systemCache: {
				clear: vi.fn(),
			},
			localSchemaCache: {
				get: vi.fn(),
				set: vi.fn(),
			},
		}),
		getCacheValue: vi.fn().mockResolvedValue(null),
		setCacheValue: vi.fn().mockResolvedValue(undefined),
		clearSystemCache: vi.fn(),
	};
}
