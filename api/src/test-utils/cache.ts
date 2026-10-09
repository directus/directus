/**
 * Cache mocking utilities for service tests
 * Provides simplified mocks for src/cache module used in service testing
 */

import { vi } from 'vitest';

/**
 * Creates a standard cache mock for service tests
 * Returns mock functions for vi.mock()
 */
export function mockCache() {
	const mockCacheReturn = {
		cache: { clear: vi.fn() } as any,
		systemCache: { clear: vi.fn() } as any,
		localSchemaCache: { get: vi.fn(), set: vi.fn() } as any,
		lockCache: undefined,
	};

	return {
		getCache: vi.fn().mockReturnValue(mockCacheReturn),
		getCacheValue: vi.fn().mockResolvedValue(null),
		setCacheValue: vi.fn().mockResolvedValue(undefined),
		clearSystemCache: vi.fn(),
	};
}
