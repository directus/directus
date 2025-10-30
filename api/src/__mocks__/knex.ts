/**
 * Knex mocking utilities for service tests
 * Provides mock knex instances, table builders, and tracker utilities
 */

import { systemCollectionNames } from '@directus/system-data';
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
 * Sets up common database operation mock handlers for all system collections
 * Automatically mocks CRUD operations (select, insert, update, delete) for all Directus system collections
 *
 * @param tracker The knex-mock-client tracker instance
 *
 * @example
 * ```typescript
 * const { db, tracker, mockSchema } = createMockKnex();
 * setupDeleteOperationMocks(tracker);
 * // Now all CRUD operations on system collections are mocked
 * ```
 */
export function setupDeleteOperationMocks(tracker: Tracker) {
	// Mock all CRUD operations for all system collections
	for (const collection of systemCollectionNames) {
		tracker.on.select(collection).response([]);
		tracker.on.insert(collection).response([]);
		tracker.on.update(collection).response([]);
		tracker.on.delete(collection).response([]);
	}
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
export function resetKnexMocks(tracker: Tracker, mockSchema: ReturnType<typeof createMockKnex>['mockSchema']) {
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

/**
 * Creates a mock alterTable function for testing schema alterations
 * Returns a vi.fn() that calls the callback with a mock table builder
 *
 * @returns Mock function for db.schema.alterTable
 *
 * @example
 * ```typescript
 * const { db } = createMockKnex();
 * const alterTableSpy = mockAlterTable();
 * db.schema.alterTable = alterTableSpy as any;
 *
 * // Now when alterTable is called, it will invoke the callback with a mock table builder
 * await db.schema.alterTable('users', (table) => {
 *   table.string('name');
 * });
 * ```
 */
export function mockAlterTable() {
	return vi.fn((_tableName, callback) => {
		callback(createMockTableBuilder());
		return Promise.resolve();
	});
}

/**
 * Creates a mock schema.table function for testing schema operations
 * Returns a vi.fn() that calls the callback with a mock table builder
 *
 * @returns Mock function for db.schema.table
 *
 * @example
 * ```typescript
 * const { db } = createMockKnex();
 * const schemaTableSpy = mockSchemaTable();
 * db.schema.table = schemaTableSpy as any;
 *
 * // Now when schema.table is called, it will invoke the callback with a mock table builder
 * await db.schema.table('users', (table) => {
 *   table.dropColumn('name');
 * });
 * ```
 */
export function mockSchemaTable() {
	return vi.fn((_tableName, callback) => {
		callback(createMockTableBuilder());
		return Promise.resolve();
	});
}
