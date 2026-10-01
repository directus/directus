/**
 * Environment mocking utilities for service tests
 * Provides simplified mocks for @directus/env module used in service testing
 */

import type { Env } from '@directus/env';
import { vi } from 'vitest';

/**
 * Environment variables that are read at module load by widely imported modules (the logger, the
 * system field rows, the collections service), so practically every mocked env needs them even
 * when the test under it doesn't care about their values.
 */
const DEFAULT_ENV = {
	LOG_LEVEL: 'info',
	AUTH_PROVIDERS: [],
	DB_EXCLUDE_TABLES: [],
	EXTENSIONS_PATH: './extensions',
	STORAGE_LOCATIONS: ['local'],
	EMAIL_TEMPLATES_PATH: './templates',
};

/**
 * Builds the env a mocked `useEnv` should return, with the shared test defaults applied.
 *
 * The real env holds a value for every variable that has a default, which tests generally don't
 * care about. This applies the handful that are read as modules are imported, and casts the result
 * to `Env` so that individual tests can keep setting only the variables relevant to them.
 *
 * @param overrides - Optional environment variable overrides
 * @returns Environment variables to return from `useEnv`
 *
 * @example
 * ```typescript
 *
 * import { useEnv } from '@directus/env';
 * const { resetEnvMock } = await import('../test-utils/env.js');
 *
 * // Mocking the module. The factory is hoisted above the imports, so it has to pull the helper in
 * // itself rather than closing over a top level import.
 * vi.mock('@directus/env', async () => {
 *   const { mockEnv } = await import('../test-utils/env.js');
 *   return { useEnv: vi.fn().mockReturnValue(mockEnv({ STORAGE_LOCATIONS: ['custom-storage'] })) };
 * });
 *
 * // Varying the env within a test
 * vi.mocked(useEnv).mockReturnValue(mockEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: true }));
 *
 * // When useEnv is called top level to dynamically change env values during tests:
 * beforeEach(() => {
 *   resetEnvMock()
 * });
 *
 * it('should use custom env value', async () => {
 *   vi.mocked(useEnv).mockReturnValue(mockEnv({ FILES_DELETE_ORIGINAL_ON_MOVE: true }));
 *
 *   // Re-import the module to pick up the new mock
 *   const { FilesService } = await import('./files.js');
 *
 *   // ... rest of test
 * });
 * ```
 *
 * @remarks
 * Key Points for Per-Test Mocking:
 * - Must re-import modules after changing mock values using dynamic import() if useEnv is called at the top level
 * - Call resetEnvMock() in beforeEach to clear module cache and apply new mock values
 *
 */
export function mockEnv(overrides?: Record<string, unknown>): Env {
	return { ...DEFAULT_ENV, ...overrides } as Env;
}

export function mockUseEnv(overrides?: Record<string, unknown>) {
	return {
		useEnv: vi.fn().mockReturnValue(mockEnv(overrides)),
	};
}

export function resetEnvMock() {
	vi.resetModules();
}
