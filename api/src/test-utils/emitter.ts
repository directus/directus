/**
 * Emitter mocking utilities for service tests
 * Provides simplified mocks for src/emitter module used in service testing
 */

import { vi } from 'vitest';

/**
 * Creates a standard emitter mock for service tests
 * This matches the pattern used across all service test files
 *
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('../emitter.js', () => mockEmitter());
 *
 * // To dynamically change emitter behavior during tests, import and mock directly:
 * import emitter from '../emitter.js';
 * vi.mocked(emitter.emitAction).mockResolvedValue(undefined);
 * vi.mocked(emitter.emitFilter).mockResolvedValue(customPayload);
 * ```
 */
export function mockEmitter() {
	return {
		default: {
			emitAction: vi.fn(),
			emitFilter: vi.fn((_, payload) => Promise.resolve(payload)),
			emitInit: vi.fn(),
			onFilter: vi.fn(),
			onAction: vi.fn(),
			onInit: vi.fn(),
			offFilter: vi.fn(),
			offAction: vi.fn(),
			offInit: vi.fn(),
			offAll: vi.fn(),
		},
	};
}
