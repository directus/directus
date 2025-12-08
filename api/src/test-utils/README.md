# Service Test Mocks

Shared mocking utilities for service layer tests. These utilities help reduce code duplication and provide consistent
mocking patterns across service tests.

## Overview

This directory contains mock implementations for commonly used modules in service tests:

- **[knex.ts](#knexts)** - Knex instance, query tracker, and schema builder mocks
- **[database.ts](#databasets)** - Database client and transaction mocks
- **[cache.ts](#cachets)** - Cache system mocks
- **[schema.ts](#schemats)** - Schema inspector mocks
- **[emitter.ts](#emitterts)** - Event emitter mocks
- **[items-service.ts](#items-servicets)** - ItemsService mocks
- **[fields-service.ts](#fields-servicets)** - FieldsService mocks
- **[files-service.ts](#files-servicets)** - FilesService mocks
- **[folders-service.ts](#folders-servicets)** - FoldersService mocks
- **[test-helpers.ts](#test-helpersts)** - Test data factory functions

## Quick Start

```typescript
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';

// Set up mocks
vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

describe('YourService Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	// Your tests here
});
```

## File Documentation

### knex.ts

Provides Knex mocking utilities including the database client, query tracker, and schema builder.

#### `createMockKnex()`

Creates a complete mocked Knex instance with tracker and schema builder support.

**Returns:** `{ db, tracker, mockSchemaBuilder }`

- `db`: Mocked Knex client (connected to knex-mock-client)
- `tracker`: Query tracker for mocking database responses
- `mockSchemaBuilder`: Mocked schema builder with createTable, dropTable, alterTable, etc.

**Example:**

```typescript
const { db, tracker, mockSchemaBuilder } = createMockKnex();

// Mock query responses
tracker.on.select('users').response([{ id: 1, name: 'John' }]);
tracker.on.insert('users').response([1]);

// Use in service constructor
const service = new YourService({ knex: db, schema });

// Verify schema operations
expect(mockSchemaBuilder.createTable).toHaveBeenCalledWith('users', expect.any(Function));
```

#### `createMockTableBuilder()`

Creates a mock Knex table builder with all column types, modifiers, and constraints.

**Returns:** Mock table builder with chainable methods

**Example:**

```typescript
const table = createMockTableBuilder();
table.string('name', 255).notNullable().index();
table.integer('age').unsigned().nullable();
```

#### `setupSystemCollectionMocks(tracker)`

Sets up default CRUD operation mocks for all Directus system collections (directus_collections, directus_fields, etc.).

**Parameters:**

- `tracker`: The knex-mock-client tracker instance

**Example:**

```typescript
const { tracker } = createMockKnex();
setupSystemCollectionMocks(tracker);
// Now all system collection queries return empty arrays by default
```

#### `resetKnexMocks(tracker, mockSchemaBuilder)`

Resets all mock states. Should be called in `afterEach` hooks.

**Parameters:**

- `tracker`: The knex-mock-client tracker instance
- `mockSchemaBuilder`: The mock schema builder object from createMockKnex

**Example:**

```typescript
const { db, tracker, mockSchemaBuilder } = createMockKnex();

afterEach(() => {
	resetKnexMocks(tracker, mockSchemaBuilder);
});
```

#### `mockCreateTable()`

Creates a mock for `db.schema.createTable` that executes the callback with a mock table builder.

**Returns:** `vi.fn()` that can be assigned to `db.schema.createTable`

**Example:**

```typescript
const { db } = createMockKnex();
const createTableSpy = mockCreateTable();
db.schema.createTable = createTableSpy as any;

await db.schema.createTable('users', (table) => {
	table.increments('id');
	table.string('name');
});

expect(createTableSpy).toHaveBeenCalledWith('users', expect.any(Function));
```

#### `mockAlterTable()`

Creates a mock for `db.schema.alterTable` that executes the callback with a mock table builder.

**Returns:** `vi.fn()` that can be assigned to `db.schema.alterTable`

**Example:**

```typescript
const { db } = createMockKnex();
const alterTableSpy = mockAlterTable();
db.schema.alterTable = alterTableSpy as any;

await db.schema.alterTable('users', (table) => {
	table.string('email');
});
```

#### `mockSchemaTable()`

Creates a mock for `db.schema.table` that executes the callback with a mock table builder.

**Returns:** `vi.fn()` that can be assigned to `db.schema.table`

**Example:**

```typescript
const { db } = createMockKnex();
const schemaTableSpy = mockSchemaTable();
db.schema.table = schemaTableSpy as any;

await db.schema.table('users', (table) => {
	table.dropColumn('old_field');
});
```

---

### database.ts

Provides database module mocking utilities including database client detection and transaction handling.

#### `mockDatabase(client?)`

Creates a standard database module mock for service tests.

**Parameters:**

- `client` (optional): Database client to mock (default: `'postgres'`)
  - Supported values: `'postgres'`, `'mysql'`, `'sqlite3'`, `'mssql'`, `'oracledb'`, `'cockroachdb'`

**Returns:** Mock module object with `getDatabaseClient` and `getSchemaInspector`

**Example:**

```typescript
// Standard PostgreSQL mock
vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

// MySQL-specific mock
vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase('mysql');
});

// Dynamically change client during tests
import { getDatabaseClient } from '../../src/database/index.js';
vi.mocked(getDatabaseClient).mockReturnValue('sqlite3');
```

#### `mockTransaction()`

Creates a mock for the transaction utility. By default, executes the callback with the provided Knex instance (no actual
transaction wrapper).

**Returns:** Mock module object with `transaction` function

**Example:**

```typescript
vi.mock('../utils/transaction.js', async () => {
	const { mockTransaction } = await import('../test-utils/database.js');
	return mockTransaction();
});

// Transaction callback is executed immediately with the same knex instance
await transaction(db, async (trx) => {
	// trx === db in tests
	await trx('users').insert({ name: 'John' });
});
```

---

### cache.ts

Provides cache system mocking utilities.

#### `mockCache()`

Creates a standard cache module mock with getCache, getCacheValue, setCacheValue, and clearSystemCache. Returns both the
mocks for vi.mock() declarations and spies for testing cache behavior.

**Returns:** Object with mock functions and spies

- `getCache`: Mock function returning cache object
- `getCacheValue`: Mock function returning null
- `setCacheValue`: Mock function returning undefined
- `clearSystemCache`: Mock function
- `spies`: Spy functions for testing cache behavior
  - `clearSpy`: Spy for cache.clear()
  - `systemClearSpy`: Spy for systemCache.clear()
  - `getCacheSpy`: Spy for localSchemaCache.get()
  - `setCacheSpy`: Spy for localSchemaCache.set()
  - `mockCacheReturn`: The mock cache object to pass to vi.mocked()

**Example:**

```typescript
// Standard usage for vi.mock()
vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

// Testing cache clearing with spies
import { getCache } from '../cache.js';
import { mockCache } from '../test-utils/cache.js';

test('should clear cache after update', async () => {
	const { spies } = mockCache();
	vi.mocked(getCache).mockReturnValue(spies.mockCacheReturn as any);

	const service = new YourService({ knex: db, schema });
	await service.updateOne('1', { name: 'Updated' });

	expect(spies.clearSpy).toHaveBeenCalled();
});
```

---

### schema.ts

Provides schema inspector mocking utilities for the `@directus/schema` package.

#### `mockSchema()`

Creates a standard schema inspector mock with tableInfo, columnInfo, primary, foreignKeys, etc.

**Returns:** Mock module object for `vi.mock()`

**Example:**

```typescript
// Standard usage
vi.mock('@directus/schema', async () => {
	const { mockSchema } = await import('../test-utils/schema.js');
	return mockSchema();
});

// Dynamically change inspector behavior during tests
import { createInspector } from '@directus/schema';
vi.mocked(createInspector).mockReturnValue({
	tableInfo: vi.fn().mockResolvedValue([{ name: 'users' }, { name: 'posts' }]),
	columnInfo: vi.fn().mockResolvedValue([
		{ table: 'users', name: 'id', data_type: 'integer', is_nullable: false },
		{ table: 'users', name: 'name', data_type: 'varchar', is_nullable: true },
	]),
	primary: vi.fn().mockResolvedValue('id'),
	foreignKeys: vi.fn().mockResolvedValue([]),
	withSchema: vi.fn().mockReturnThis(),
} as any);
```

---

### emitter.ts

Provides event emitter mocking utilities.

#### `mockEmitter()`

Creates a standard emitter mock with emitAction, emitFilter, emitInit, and event listener methods.

**Returns:** Mock module object for `vi.mock()`

**Example:**

```typescript
// Standard usage
vi.mock('../emitter.js', async () => {
	const { mockEmitter } = await import('../test-utils/emitter.js');
	return mockEmitter();
});

// Dynamically change emitter behavior during tests
import emitter from '../emitter.js';

// Mock filter to modify payload
vi.mocked(emitter.emitFilter).mockResolvedValue({ modified: true });

// Verify action was emitted
await service.createOne(data);
expect(emitter.emitAction).toHaveBeenCalledWith(
	'items.create',
	expect.objectContaining({ collection: 'test_collection' }),
	expect.any(Object),
);
```

---

### items-service.ts

Provides ItemsService mocking utilities for testing services that depend on ItemsService.

#### `mockItemsService()`

Creates a standard ItemsService mock with all CRUD methods pre-configured with sensible defaults.

**Returns:** Mock module object with `ItemsService` class

**Default return values:**

- `createOne` → `1`
- `createMany` → `[1]`
- `readByQuery` → `[]`
- `readOne` → `{}`
- `readMany` → `[]`
- `updateOne` → `1`
- `updateMany` → `[1]`
- `updateByQuery` → `[1]`
- `deleteOne` → `1`
- `deleteMany` → `[1]`
- `deleteByQuery` → `[1]`

**Example:**

```typescript
// Standard usage
vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

// Override specific methods during tests
import { ItemsService } from './items.js';

const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('custom-id');

await service.createOne(data);
expect(createOneSpy).toHaveBeenCalledWith(expect.objectContaining({ field: 'value' }));

// Mock readByQuery to return specific data
vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([
	{ collection: 'users', name: 'John' },
	{ collection: 'posts', name: 'My Post' },
]);
```

---

### fields-service.ts

Provides FieldsService mocking utilities for testing services that depend on FieldsService (like CollectionsService).

#### `mockFieldsService()`

Creates a standard FieldsService mock with common methods pre-configured.

**Returns:** Mock module object with `FieldsService` class

**Mocked methods:**

In addition to the base `ItemsService` method the following `FieldsService` specific methods are available:

- `addColumnToTable` → no-op function
- `addColumnIndex` → resolves to undefined
- `deleteField` → resolves to undefined
- `createField` → resolves to undefined
- `updateField` → resolves to 'field'

**Example:**

```typescript
// Standard usage in CollectionsService tests
vi.mock('./fields.js', async () => {
  const { mockFieldsService } = await import('../test-utils/services/fields-service.js');
  return mockFieldsService();
});

// Override specific methods during tests
import { FieldsService } from './fields.js';

const addColumnIndexSpy = vi.spyOn(FieldsService.prototype, 'addColumnIndex')
  .mockResolvedValue();

await service.createOne({ collection: 'test', fields: [...] });
expect(addColumnIndexSpy).toHaveBeenCalled();
```

---

### files-service.ts

Provides FilesService mocking utilities for testing services that depend on FilesService.

#### `mockFilesService()`

Creates a standard FilesService mock with common methods pre-configured.

**Returns:** Mock module object with `FilesService` class

**Mocked methods:**

In addition to the base `ItemsService` method the following `FilesService` specific methods are available:

- `uploadOne` → `1`
- `importOne` → `1`

**Example:**

```typescript
// Standard usage in service tests
vi.mock('./files.js', async () => {
	const { mockFilesService } = await import('../test-utils/services/files-service.js');
	return mockFilesService();
});

// Override specific methods during tests
import { FilesService } from './files.js';

const uploadOneSpy = vi.spyOn(FilesService.prototype, 'uploadOne').mockResolvedValue(`1`);
```

---

### folders-service.ts

Provides FoldersService mocking utilities for testing services that depend on FoldersService.

#### `mockFilesService()`

Creates a standard FoldersService mock with common methods pre-configured.

**Returns:** Mock module object with `FoldersService` class

**Mocked methods:**

In addition to the base `ItemsService` method the following `FoldersService` specific methods are available:

- `buildTree` → return `1` => `root` map

**Example:**

```typescript
// Standard usage in service tests
vi.mock('./folders.js', async () => {
	const { mockFoldersService } = await import('../test-utils/services/folders-service.js');
	return mockFilesService();
});

// Override specific methods during tests
import { FoldersService } from './folders.js';

const buildTreeSpy = vi.spyOn(FoldersService.prototype, 'buildTree').mockResolvedValue(new Map('1', 'root-alt'));
```

---

## Common Patterns

### Full Service Test Setup

```typescript
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock all dependencies (before imports)
vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('@directus/schema', async () => {
	const { mockSchema } = await import('../test-utils/schema.js');
	return mockSchema();
});

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

vi.mock('../emitter.js', async () => {
	const { mockEmitter } = await import('../test-utils/emitter.js');
	return mockEmitter();
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../utils/transaction.js', async () => {
	const { mockTransaction } = await import('../test-utils/database.js');
	return mockTransaction();
});

// Import after mocks
import { YourService } from './your-service.js';

// Define test schema
const schema = new SchemaBuilder()
	.collection('users', (c) => {
		c.field('id').integer().primary();
		c.field('name').string();
	})
	.build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / YourService', () => {
		test('should create a user', async () => {
			tracker.on.select('users').response([]);
			tracker.on.insert('users').response([1]);

			const service = new YourService({ knex: db, schema });
			const result = await service.createOne({ name: 'John' });

			expect(result).toBe(1);
		});
	});
});
```

### Testing Schema Operations

```typescript
import { mockCreateTable, mockAlterTable, createMockTableBuilder } from '../test-utils/knex.js';

test('should create table with correct schema', async () => {
	const { db, mockSchemaBuilder } = createMockKnex();
	const service = new YourService({ knex: db, schema });

	await service.createCollection('users');

	expect(mockSchemaBuilder.createTable).toHaveBeenCalledWith('users', expect.any(Function));
});

test('should alter table to add column', async () => {
	const { db } = createMockKnex();
	const alterTableSpy = mockAlterTable();
	db.schema.alterTable = alterTableSpy as any;

	const service = new YourService({ knex: db, schema });
	await service.addField('users', { field: 'email', type: 'string' });

	expect(alterTableSpy).toHaveBeenCalledWith('users', expect.any(Function));
});
```

### Testing Cache Clearing

```typescript
import { getCache } from '../cache.js';
import { mockCache } from '../test-utils/cache.js';

test('should clear cache after update', async () => {
	const { spies } = mockCache();
	vi.mocked(getCache).mockReturnValue(spies.mockCacheReturn as any);

	const service = new YourService({ knex: db, schema });
	await service.updateOne('1', { name: 'Updated' });

	expect(spies.clearSpy).toHaveBeenCalled();
});
```

### Testing with Accountability

```typescript
test('should allow admin to create collection', async () => {
	const service = new CollectionsService({
		knex: db,
		schema,
		accountability: { role: 'admin', admin: true } as Accountability,
	});

	await expect(service.createOne({ collection: 'test' })).resolves.toBeDefined();
});

test('should deny non-admin from creating collection', async () => {
	const service = new CollectionsService({
		knex: db,
		schema,
		accountability: { role: 'editor', admin: false } as Accountability,
	});

	await expect(service.createOne({ collection: 'test' })).rejects.toThrow(ForbiddenError);
});

test('should read column info', async () => {
	const mockColumns = [
		createMockColumn({ table: 'users', name: 'id', data_type: 'integer', is_primary_key: true }),
		createMockColumn({ table: 'users', name: 'email', data_type: 'varchar', max_length: 255 }),
	];

	service.schemaInspector.columnInfo = vi.fn().mockResolvedValue(mockColumns);
	const result = await service.columnInfo('users');

	expect(result).toEqual(mockColumns);
});
```

### Testing with System Collection Mocks

```typescript
import { setupSystemCollectionMocks } from '../test-utils/knex.js';

describe('Service Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	beforeEach(() => {
		// Automatically mock all CRUD operations for system collections
		setupSystemCollectionMocks(tracker);
	});

	test('should query directus_fields', async () => {
		// Override the default empty response for specific tests
		tracker.on.select('directus_fields').response([{ id: 1, collection: 'users', field: 'name' }]);

		const service = new YourService({ knex: db, schema });
		const fields = await service.getFields('users');

		expect(fields).toHaveLength(1);
	});
});
```

### Mocking Additional Dependencies

```typescript
// Mock environment variables
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		CACHE_SCHEMA: true,
		DB_CLIENT: 'postgres',
	}),
}));

// Mock getSchema utility
vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

// Mock permissions utilities
vi.mock('../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([
		{
			collection: 'test_collection',
			fields: ['*'],
			action: 'read',
		},
	]),
}));

// Use in tests
import { getSchema } from '../utils/get-schema.js';
vi.mocked(getSchema).mockResolvedValue(schema);
```

---

## Examples

See these files for complete examples:

- [collections.test.ts](../services/collections.test.ts) - Full service test with schema operations
- [fields.test.ts](../services/fields.test.ts) - Complex service test with field management

---

## Best Practices

### Mock Declaration Order

Always declare `vi.mock()` calls **before** importing the modules they mock:

```typescript
// ✅ Correct - mocks first
vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

import { YourService } from './your-service.js';

// ❌ Wrong - imports before mocks
import { YourService } from './your-service.js';

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});
```

### Resetting Mocks Between Tests

Always reset mocks in `afterEach` to prevent test interference:

```typescript
afterEach(() => {
	resetKnexMocks(tracker, mockSchemaBuilder);
	vi.clearAllMocks(); // Clear any additional spies
});
```

### Tracker Response Patterns

Set up tracker responses for every database query your test will execute:

```typescript
test('should create and read item', async () => {
	// Mock all queries that will run
	tracker.on.select('users').response([]); // Check if exists
	tracker.on.insert('users').response([1]); // Create
	tracker.on.select('users').response([{ id: 1, name: 'John' }]); // Read back

	// Your test code...
});
```

### Using TypeScript with Mocks

Add type assertions when needed to satisfy TypeScript:

```typescript
vi.mocked(getCache).mockReturnValue({
	cache: { clear: vi.fn() },
	systemCache: { clear: vi.fn() },
	localSchemaCache: { get: vi.fn(), set: vi.fn() },
	lockCache: undefined,
} as any);
```

### Spying on Service Methods

Use `vi.spyOn` to override specific methods while keeping the rest of the service intact:

```typescript
import { ItemsService } from './items.js';

const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('new-id');

// Test your code
expect(createOneSpy).toHaveBeenCalledWith(expect.objectContaining({ field: 'value' }));
```

---

## Contributing

When adding new mock utilities:

1. Create or update the appropriate mock file
2. Add comprehensive JSDoc comments with examples
3. Document the utility in this README
4. Export all functions from the module
5. Use TypeScript for proper typing
6. Include return type documentation
7. Test the mock with actual service tests
