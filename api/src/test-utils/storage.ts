/**
 * Storage mocking utilities for service tests
 * Provides simplified mocks for src/storage/index module used in service testing
 */

import { Readable } from 'node:stream';
import { vi } from 'vitest';

/**
 * Creates a standard storage mock for service tests
 * This matches the pattern used across all service test files
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('../../src/storage/index', () => mockStorage());
 * * ```
 */
export function mockStorage() {
	const mockLocationReturn = {
		exists: vi.fn().mockResolvedValue(true),
		read: vi.fn().mockResolvedValue(Readable.from(['stream'])),
		write: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		stat: vi.fn().mockResolvedValue({
			size: 1,
			modified: new Date('1995-12-17T03:24:00'),
		}),
	};

	const getStorageSpy = vi.fn().mockReturnValue({
		registerDriver: vi.fn(),
		registerLocation: vi.fn(),
		location: vi.fn().mockReturnValue(mockLocationReturn),
	});

	return {
		getStorage: getStorageSpy,
		spies: {
			clearGetStorageSpy: getStorageSpy.mockClear,
		},
	};
}
