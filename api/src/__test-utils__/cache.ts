/**
 * Cache mocking utilities for service tests
 * Provides simplified mocks for src/cache module used in service testing
 */

import { vi } from 'vitest';

/**
 * Creates a standard cache mock for service tests
 * Returns mock functions for vi.mock() and spies for testing cache behavior
 *
 * @returns Object with mock functions at root level and spies nested under 'spies' property
 *
 * @example
 * ```typescript
 * // Standard usage for vi.mock()
 * vi.mock('../cache.js', async () => {
 *   const { mockCache } = await import('../__mocks__/cache.js');
 *   return mockCache();
 * });
 *
 * // Testing cache clearing with spies
 * import { getCache } from '../cache.js';
 * import { mockCache } from '../__mocks__/cache.js';
 *
 * test('should clear cache after update', async () => {
 *   const { spies } = mockCache();
 *   vi.mocked(getCache).mockReturnValue(spies.mockCacheReturn as any);
 *
 *   const service = new YourService({ knex: db, schema });
 *   await service.updateOne('1', { name: 'Updated' });
 *
 *   expect(spies.clearSpy).toHaveBeenCalled();
 * });
 * ```
 */
export function mockCache() {
	const clearSpy = vi.fn();
	const systemClearSpy = vi.fn();
	const getCacheSpy = vi.fn();
	const setCacheSpy = vi.fn();

	const mockCacheReturn = {
		cache: { clear: clearSpy } as any,
		systemCache: { clear: systemClearSpy } as any,
		localSchemaCache: { get: getCacheSpy, set: setCacheSpy } as any,
		lockCache: undefined,
	};

	return {
		getCache: vi.fn().mockReturnValue(mockCacheReturn),
		getCacheValue: vi.fn().mockResolvedValue(null),
		setCacheValue: vi.fn().mockResolvedValue(undefined),
		clearSystemCache: vi.fn(),
		spies: {
			clearSpy,
			systemClearSpy,
			getCacheSpy,
			setCacheSpy,
			mockCacheReturn,
		},
	};
}
