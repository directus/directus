/**
 * Environment mocking utilities for tests
 * Mocks the @directus/env module with the actual defaults, which tests can override per test
 */

import type { Env } from '@directus/env';
import { vi } from 'vitest';

// Imported from the actual module, as this helper is used to mock it
const { DEFAULTS, cast } = await vi.importActual<typeof import('@directus/env')>('@directus/env');

// Cast like the actual env does, so that eg durations are parsed into milliseconds
const CAST_DEFAULTS = Object.fromEntries(Object.entries(DEFAULTS).map(([key, value]) => [key, cast(value, key)]));

/**
 * Builds an env based on the actual @directus/env defaults, cast to their runtime types. Overrides are used as-is, so
 * they have to be passed in their runtime type (eg milliseconds instead of `'15m'`).
 *
 * The result is cast to `Env` so that individual tests can keep setting only the variables relevant to them.
 *
 * @param overrides - Optional environment variable overrides on top of the defaults
 * @returns Environment variables to return from `useEnv`
 *
 * @example
 * ```typescript
 * vi.mocked(useEnv).mockReturnValue(mockEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: true }));
 * ```
 */
export function mockEnv(overrides?: Record<string, unknown>): Env {
	return { ...CAST_DEFAULTS, ...overrides } as Env;
}

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
 *   const { mockUseEnv } = await import('../test-utils/env.js');
 *   return mockUseEnv({ STORAGE_LOCATIONS: ['custom-storage'] });
 * });
 *
 * beforeEach(() => {
 *   resetEnv();
 * });
 *
 * test('should use custom env value', () => {
 *   setEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: true });
 *   // ...
 * });
 * ```
 *
 * @remarks
 * - Use setEnv() / resetEnv() to change values per test, instead of replacing the whole env with mockReturnValue()
 * - Modules that derive values from the env once at import time, like constants, don't see later setEnv() calls.
 *   Call setEnv() first, then vi.resetModules() and re-import the module with a dynamic import()
 */
export function mockUseEnv(overrides?: Record<string, unknown>) {
	defaultEnv = mockEnv(overrides);

	resetEnv();

	return {
		useEnv: vi.fn(() => currentEnv as Env),
	};
}

let defaultEnv: Record<string, unknown> = {};
const currentEnv: Record<string, unknown> = {};

/**
 * Override env values returned by a `mockUseEnv()` mock, on top of its defaults. Lasts until `resetEnv()`.
 *
 * The object returned by `useEnv()` is updated in place, so modules that keep a reference to it from a top level
 * `useEnv()` call see the change too. Values derived from it at import time don't, see `mockUseEnv()`.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetEnv();
 * });
 *
 * test('should use custom env value', () => {
 *   setEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: true });
 *   // ...
 * });
 * ```
 */
export function setEnv(overrides: Record<string, unknown> = {}) {
	Object.assign(currentEnv, overrides);
}

/**
 * Restore the env returned by a `mockUseEnv()` mock to its defaults, undoing any `setEnv()` calls.
 */
export function resetEnv() {
	for (const key of Object.keys(currentEnv)) {
		delete currentEnv[key];
	}

	Object.assign(currentEnv, defaultEnv);
}
