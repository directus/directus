/**
 * Environment mocking utilities for service tests
 * Provides simplified mocks for @directus/env module used in service testing
 */

import { vi } from 'vite-plus/test';

/**
 * Creates a standard environment mock for service tests
 * Returns default environment variables with sensible test defaults
 *
 * @param overrides - Optional environment variable overrides
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 *
 * import { useEnv } from '@directus/env';
 * const { resetEnvMock } = await import('../test-utils/env.js');
 *
 * // Standard usage with defaults
 * vi.mock('@directus/env', () => {
 *   const { mockEnv } = await import('../test-utils/env.js');
 *   return mockEnv();
 * });
 *
 * // With custom default values
 * vi.mock('@directus/env', () => {
 *   const { mockEnv } = await import('../test-utils/env.js');
 *   return mockEnv({
 *     STORAGE_LOCATIONS: 'custom-storage',
 *     FILES_DELETE_ORIGINAL_ON_MOVE: 'true',
 *   });
 * });
 *
 * // When useEnv is called top level to dynamically change env values during tests:
 * beforeEach(() => {
 *   resetEnvMock()
 * });
 *
 * it('should use custom env value', async () => {
 *   // Override the mock return value
 *   vi.mocked(useEnv).mockReturnValue({
 *     FILES_DELETE_ORIGINAL_ON_MOVE: 'true',
 *   } as any);
 *
 *   // Re-import the module to pick up the new mock
 *   const { FilesService } = await import('./files.js');
 *
 *   // Create new service instance
 *   const service = new FilesService({
 *     knex: db,
 *     schema: { collections: {}, relations: [] },
 *   });
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
export function mockEnv(overrides?: Record<string, unknown>) {
	const defaultEnv = {
		EXTENSIONS_PATH: './extensions',
		STORAGE_LOCATIONS: 'local',
		EMAIL_TEMPLATES_PATH: './templates',
		...overrides,
	};

	return {
		useEnv: vi.fn().mockReturnValue(defaultEnv),
	};
}

export function resetEnvMock() {
	vi.resetModules();
}
