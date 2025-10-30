/**
 * Knex mocking utilities for service tests
 * Provides mock knex instances, table builders, and tracker utilities
 */

import knex from 'knex';
import { MockClient, createTracker, type Tracker } from 'knex-mock-client';
import { vi } from 'vitest';

/**
 * Creates a mocked knex instance with tracker and schema builder support
 *
 * @returns Object containing the mocked db instance, tracker, and mockSchema
 *
 * @example
 * ```typescript
 * const { db, tracker, mockSchema } = createMockKnex();
 *
 * // Use tracker to mock query responses
 * tracker.on.select('users').response([{ id: 1, name: 'John' }]);
 *
 * // Verify schema operations
 * expect(mockSchema.createTable).toHaveBeenCalled();
 * ```
 */
export function createMockKnex() {
	const db = vi.mocked(knex.default({ client: MockClient }));
	const tracker = createTracker(db);

	// Mock schema builder methods
	const mockSchema = {
		createTable: vi.fn().mockResolvedValue(undefined),
		dropTable: vi.fn().mockResolvedValue(undefined),
		hasTable: vi.fn().mockResolvedValue(false),
		table: vi.fn().mockResolvedValue(undefined),
		alterTable: vi.fn().mockResolvedValue(undefined),
	};

	Object.defineProperty(db, 'schema', {
		get: () => mockSchema,
		configurable: true,
	});

	return { db, tracker, mockSchema };
}

/**
 * Creates a mock table builder for schema operations
 * Used for testing column creation and alteration
 *
 * @returns Mock table builder with chainable methods
 *
 * @example
 * ```typescript
 * const table = createMockTableBuilder();
 * table.string('name', 255).notNullable().index();
 * ```
 */
export function createMockTableBuilder() {
	return {
		string: vi.fn().mockReturnThis(),
		integer: vi.fn().mockReturnThis(),
		text: vi.fn().mockReturnThis(),
		boolean: vi.fn().mockReturnThis(),
		increments: vi.fn().mockReturnThis(),
		bigIncrements: vi.fn().mockReturnThis(),
		decimal: vi.fn().mockReturnThis(),
		float: vi.fn().mockReturnThis(),
		dateTime: vi.fn().mockReturnThis(),
		timestamp: vi.fn().mockReturnThis(),
		date: vi.fn().mockReturnThis(),
		time: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		jsonb: vi.fn().mockReturnThis(),
		uuid: vi.fn().mockReturnThis(),
		binary: vi.fn().mockReturnThis(),
		specificType: vi.fn().mockReturnThis(),
		defaultTo: vi.fn().mockReturnThis(),
		notNullable: vi.fn().mockReturnThis(),
		nullable: vi.fn().mockReturnThis(),
		unique: vi.fn().mockReturnThis(),
		index: vi.fn().mockReturnThis(),
		primary: vi.fn().mockReturnThis(),
		alter: vi.fn().mockReturnThis(),
		dropColumn: vi.fn().mockReturnThis(),
		dropUnique: vi.fn().mockReturnThis(),
		dropIndex: vi.fn().mockReturnThis(),
	};
}

/**
 * Sets up common database operation mock handlers
 * Useful for deleteOne operations that require multiple queries
 *
 * @param tracker The knex-mock-client tracker instance
 *
 * @example
 * ```typescript
 * const { db, tracker, mockSchema } = createMockKnex();
 * setupDeleteOperationMocks(tracker);
 * // Now all common delete operations are mocked
 * ```
 */
export function setupDeleteOperationMocks(tracker: Tracker) {
	tracker.on.update('directus_collections').response([]);
	tracker.on.update('directus_relations').response([]);
	tracker.on.select('directus_revisions').response([]);
	tracker.on.update('directus_revisions').response([]);
	tracker.on.delete('directus_revisions').response([]);
	tracker.on.delete('directus_presets').response([]);
	tracker.on.delete('directus_activity').response([]);
	tracker.on.delete('directus_permissions').response([]);
	tracker.on.delete('directus_relations').response([]);
	tracker.on.select('directus_collections').response([]);
}

/**
 * Resets all mock states
 * Should be called in afterEach hooks to clean up between tests
 *
 * @param tracker The knex-mock-client tracker instance
 * @param mockSchema The mock schema object from createMockKnex
 *
 * @example
 * ```typescript
 * const { db, tracker, mockSchema } = createMockKnex();
 *
 * afterEach(() => {
 *   resetMocks(tracker, mockSchema);
 * });
 * ```
 */
export function resetMocks(tracker: Tracker, mockSchema: ReturnType<typeof createMockKnex>['mockSchema']) {
	tracker.reset();
	vi.clearAllMocks();
	mockSchema.createTable.mockClear();
	mockSchema.dropTable.mockClear();
	mockSchema.hasTable.mockClear();
	mockSchema.table.mockClear();

	if (mockSchema.alterTable) {
		mockSchema.alterTable.mockClear();
	}
}

/**
 * Helper to mock empty select responses for common Directus tables
 * Useful for tests that need to mock "no existing records" scenarios
 *
 * @param tracker The knex-mock-client tracker instance
 * @param tables Array of table names to mock empty responses for
 *
 * @example
 * ```typescript
 * const { tracker } = createMockKnex();
 * mockEmptySelects(tracker, ['directus_collections', 'directus_fields']);
 * // Now SELECT queries to these tables will return empty arrays
 * ```
 */
export function mockEmptySelects(tracker: Tracker, tables: string[]) {
	for (const table of tables) {
		tracker.on.select(table).response([]);
	}
}

/**
 * Helper to mock DDL operations (Data Definition Language)
 * Sets up mocks for common schema alteration operations
 *
 * @param tracker The knex-mock-client tracker instance
 *
 * @example
 * ```typescript
 * const { tracker } = createMockKnex();
 * mockDDLOperations(tracker);
 * // Now ALTER TABLE, CREATE TABLE, etc. operations are mocked
 * ```
 */
export function mockDDLOperations(tracker: Tracker) {
	tracker.on.any(/alter table/i).response([]);
	tracker.on.any(/create table/i).response([]);
	tracker.on.any(/drop table/i).response([]);
}
