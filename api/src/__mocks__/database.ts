/**
 * Database mocking utilities for service tests
 * Provides simplified mocks for src/database/index module used in service testing
 */

import { vi } from 'vitest';
import type { DatabaseClient } from '@directus/types';

/**
 * Creates a standard database mock for service tests
 * This matches the pattern used across all service test files
 *
 * @param client Database client to mock (default: 'postgres')
 * @returns Mock module object for vi.mock()
 *
 * @example
 * ```typescript
 * // Standard usage
 * vi.mock('../../src/database/index', () => mockDatabase());
 *
 * // For MySQL-specific tests
 * vi.mock('../../src/database/index', () => mockDatabase('mysql'));
 *
 * // To dynamically change the client during tests, import and mock directly:
 * import { getDatabaseClient } from '../database/index.js';
 * vi.mocked(getDatabaseClient).mockReturnValue('mssql');
 * ```
 */
export function mockDatabase(client: DatabaseClient = 'postgres') {
	return {
		default: vi.fn(),
		getDatabaseClient: vi.fn().mockReturnValue(client),
		getSchemaInspector: vi.fn(),
	};
}
