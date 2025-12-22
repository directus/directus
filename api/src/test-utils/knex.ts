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

	// Mock schema builder methods with functional callbacks
	const mockSchemaBuilder = {
		createTable: vi.fn((_tableName, callback) => {
			callback(createMockTableBuilder());
			return Promise.resolve();
		}),
		dropTable: vi.fn().mockResolvedValue(undefined),
		hasTable: vi.fn().mockResolvedValue(false),
		table: vi.fn((_tableName, callback) => {
			callback(createMockTableBuilder());
			return Promise.resolve();
		}),
		alterTable: vi.fn((_tableName, callback) => {
			callback(createMockTableBuilder());
			return Promise.resolve();
		}),
		dropTableIfExists: vi.fn().mockResolvedValue(undefined),
		renameTable: vi.fn().mockResolvedValue(undefined),
		raw: vi.fn().mockResolvedValue(undefined),
	};

	Object.defineProperty(db, 'schema', {
		get: () => mockSchemaBuilder,
		configurable: true,
	});

	// Note: We do NOT override the query builder methods (select, where, from, etc.)
	// because knex-mock-client already provides them and connects them to the tracker.
	// Overriding them would break the tracker connection and cause queries to not return
	// the mocked responses.

	return { db, tracker, mockSchemaBuilder };
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
		// Column types - actively used
		string: vi.fn().mockReturnThis(),
		text: vi.fn().mockReturnThis(),
		integer: vi.fn().mockReturnThis(),
		bigInteger: vi.fn().mockReturnThis(),
		float: vi.fn().mockReturnThis(),
		decimal: vi.fn().mockReturnThis(),
		boolean: vi.fn().mockReturnThis(),
		date: vi.fn().mockReturnThis(),
		dateTime: vi.fn().mockReturnThis(),
		timestamp: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		jsonb: vi.fn().mockReturnThis(),
		uuid: vi.fn().mockReturnThis(),

		// Column types - unused
		// tinyint: vi.fn().mockReturnThis(),
		// smallint: vi.fn().mockReturnThis(),
		// mediumint: vi.fn().mockReturnThis(),
		// bigint: vi.fn().mockReturnThis(),
		// double: vi.fn().mockReturnThis(),
		// datetime: vi.fn().mockReturnThis(),
		// time: vi.fn().mockReturnThis(),
		// timestamps: vi.fn().mockReturnThis(),
		// binary: vi.fn().mockReturnThis(),
		// enum: vi.fn().mockReturnThis(),
		// enu: vi.fn().mockReturnThis(),
		// geometry: vi.fn().mockReturnThis(),
		// geography: vi.fn().mockReturnThis(),
		// point: vi.fn().mockReturnThis(),
		// linestring: vi.fn().mockReturnThis(),
		// polygon: vi.fn().mockReturnThis(),
		// multipoint: vi.fn().mockReturnThis(),
		// multilinestring: vi.fn().mockReturnThis(),
		// multipolygon: vi.fn().mockReturnThis(),
		// geometrycollection: vi.fn().mockReturnThis(),
		// specificType: vi.fn().mockReturnThis(),

		// Auto-increment columns
		increments: vi.fn().mockReturnThis(),
		bigIncrements: vi.fn().mockReturnThis(),

		// Column modifiers - actively used
		defaultTo: vi.fn().mockReturnThis(),
		notNullable: vi.fn().mockReturnThis(),
		nullable: vi.fn().mockReturnThis(),
		primary: vi.fn().mockReturnThis(),
		unique: vi.fn().mockReturnThis(),
		index: vi.fn().mockReturnThis(),
		alter: vi.fn().mockReturnThis(),

		// Column modifiers - unused
		// unsigned: vi.fn().mockReturnThis(),
		// comment: vi.fn().mockReturnThis(),
		// collate: vi.fn().mockReturnThis(),
		// charset: vi.fn().mockReturnThis(),
		// first: vi.fn().mockReturnThis(),
		// after: vi.fn().mockReturnThis(),
		// references: vi.fn().mockReturnThis(),
		// inTable: vi.fn().mockReturnThis(),
		// onDelete: vi.fn().mockReturnThis(),
		// onUpdate: vi.fn().mockReturnThis(),
		// foreign: vi.fn().mockReturnThis(),

		// Schema alterations - actively used
		dropColumn: vi.fn().mockReturnThis(),
		dropUnique: vi.fn().mockReturnThis(),
		dropIndex: vi.fn().mockReturnThis(),

		// Schema alterations - unused
		// dropColumns: vi.fn().mockReturnThis(),
		// renameColumn: vi.fn().mockReturnThis(),
		// dropPrimary: vi.fn().mockReturnThis(),
		// dropForeign: vi.fn().mockReturnThis(),
		// dropTimestamps: vi.fn().mockReturnThis(),

		// Table options - unused
		// engine: vi.fn().mockReturnThis(),
		// inherits: vi.fn().mockReturnThis(),
		// queryContext: vi.fn().mockReturnThis(),
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
 * setupSystemCollectionMocks(tracker);
 * // Now all CRUD operations on system collections are mocked
 * ```
 */
export function setupSystemCollectionMocks(tracker: Tracker) {
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
export function resetKnexMocks(tracker: Tracker, mockSchema: ReturnType<typeof createMockKnex>['mockSchemaBuilder']) {
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
 * Creates a mock createTable function for testing table creation
 * Returns a vi.fn() that calls the callback with a mock table builder
 *
 * @returns Mock function for db.schema.createTable
 *
 * @example
 * ```typescript
 * const { db } = createMockKnex();
 * const createTableSpy = mockCreateTable();
 * db.schema.createTable = createTableSpy as any;
 *
 * // Now when createTable is called, it will invoke the callback with a mock table builder
 * await db.schema.createTable('users', (table) => {
 *   table.increments('id');
 *   table.string('name');
 * });
 * ```
 */
export function mockCreateTable() {
	return vi.fn((_tableName, callback) => {
		callback(createMockTableBuilder());
		return Promise.resolve();
	});
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
