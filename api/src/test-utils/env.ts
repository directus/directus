/**
 * Environment mocking utilities for tests
 * Mocks the @directus/env module with the actual defaults, which tests can override per test
 */

import { vi } from 'vitest';

// Imported from the actual module, as this helper is used to mock it
const { DEFAULTS } = await vi.importActual<typeof import('@directus/env')>('@directus/env');

/**
 * Creates an environment mock for vi.mock(), based on the actual @directus/env defaults
 *
 * @param overrides - Optional environment variable overrides on top of the defaults, for every test in the file
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * import { resetEnv, setEnv } from '../test-utils/env.js';
 *
 * vi.mock('@directus/env', async () => {
 *   const { mockEnv } = await import('../test-utils/env.js');
 *   return mockEnv({ STORAGE_LOCATIONS: 'custom-storage' });
 * });
 *
 * beforeEach(() => {
 *   resetEnv();
 * });
 *
 * test('should use custom env value', () => {
 *   setEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: 'true' });
 *   // ...
 * });
 * ```
 *
 * @remarks
 * - Use setEnv() / resetEnv() to change values per test, instead of replacing the whole env with mockReturnValue()
 * - Modules that derive values from the env once at import time, like constants, don't see later setEnv() calls.
 *   Call setEnv() first, then vi.resetModules() and re-import the module with a dynamic import()
 */
export function mockEnv(overrides?: Record<string, unknown>) {
	defaultEnv = {
		...DEFAULTS,
		...overrides,
	};

	resetEnv();

	return {
		useEnv: vi.fn(() => currentEnv),
	};
}

let defaultEnv: Record<string, unknown> = {};
const currentEnv: Record<string, unknown> = {};

/**
 * Override env values returned by a `mockEnv()` mock, on top of its defaults. Lasts until `resetEnv()`.
 *
 * The object returned by `useEnv()` is updated in place, so modules that keep a reference to it from a top level
 * `useEnv()` call see the change too. Values derived from it at import time don't, see `mockEnv()`.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetEnv();
 * });
 *
 * test('should use custom env value', () => {
 *   setEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: 'true' });
 *   // ...
 * });
 * ```
 */
export function setEnv(overrides: Record<string, unknown> = {}) {
	Object.assign(currentEnv, overrides);
}

/**
 * Restore the env returned by a `mockEnv()` mock to its defaults, undoing any `setEnv()` calls.
 */
export function resetEnv() {
	for (const key of Object.keys(currentEnv)) {
		delete currentEnv[key];
	}

	Object.assign(currentEnv, defaultEnv);
}
