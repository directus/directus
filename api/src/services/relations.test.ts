import { useEnv } from '@directus/env';
import type { SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { RelationsService } from './relations.js';

// The import graph of the service pulls in the extensions manager, which
// value-imports the native isolated-vm module. Mock it so the suite does
// not need the compiled native binary.
vi.mock('isolated-vm', () => {
	class MockReference {
		constructor(public value: unknown) {}
	}

	class MockIsolate {
		createContext() {
			return { global: {} };
		}
		dispose() {}
	}

	return {
		default: { Isolate: MockIsolate, Reference: MockReference, Callback: class {} },
		Isolate: MockIsolate,
		Reference: MockReference,
		Callback: class {},
	};
});


vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../database/index', async () => {
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

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js', () => ({
	fetchAllowedFieldMap: vi.fn().mockResolvedValue(null),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		schema: {
			constraintName: vi.fn((name: string) => name),
			preColumnChange: vi.fn().mockResolvedValue(true),
			postColumnChange: vi.fn().mockResolvedValue(undefined),
			preRelationChange: vi.fn(),
			postRelationChange: vi.fn(),
		},
	})),
}));

const schema: SchemaOverview = {
	collections: {
		articles_authors: {
			collection: 'articles_authors',
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'integer',
					dbType: 'int',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				authors_id: {
					field: 'authors_id',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'integer',
					dbType: 'int',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
			},
		},
		authors: {
			collection: 'authors',
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'integer',
					dbType: 'int',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
			},
		},
	},
	relations: [
		{
			collection: 'articles_authors',
			field: 'authors_id',
			related_collection: 'authors',
			meta: {
				id: 1,
				sort: null,
				on_delete: null,
				on_update: null,
				junction_field: 'articles_id',
			},
			schema: {
				name: 'articles_authors_authors_id_foreign',
				table: 'articles_authors',
				column: 'authors_id',
				foreign_key_table: 'authors',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'CASCADE',
				constraint_name: 'articles_authors_authors_id_foreign',
			},
		},
	],
	globals: {
		widgets: {},
	} as unknown as SchemaOverview['globals'],
};

type CapturedBuilder = {
	dropForeign: ReturnType<typeof vi.fn>;
	specificType: ReturnType<typeof vi.fn>;
	foreign: ReturnType<typeof vi.fn>;
};

describe('Services / Relations', () => {
	const { db } = createMockKnex();

	let capturedBuilder: CapturedBuilder;

	const installCapturingAlterTable = () => {
		capturedBuilder = {
			dropForeign: vi.fn().mockReturnThis(),
			specificType: vi.fn().mockReturnThis(),
			foreign: vi.fn().mockReturnThis(),
		};

		const chainable = {
			notNullable: vi.fn().mockReturnThis(),
			alter: vi.fn().mockReturnThis(),
			references: vi.fn().mockReturnThis(),
			onDelete: vi.fn().mockReturnThis(),
			onUpdate: vi.fn().mockReturnThis(),
		};

		const builder = new Proxy(capturedBuilder as unknown as Record<string, unknown>, {
			get(target, prop) {
				if (prop in target) {
					return target[prop as keyof CapturedBuilder];
				}

				return chainable[prop as keyof typeof chainable] ?? vi.fn().mockReturnThis();
			},
		});

		(db.schema as unknown as { alterTable: ReturnType<typeof vi.fn> }).alterTable = vi.fn(
			async (_tableName: string, callback: (table: unknown) => unknown) => {
				await callback(builder);
			},
		);
	};

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('#updateOne', () => {
		beforeEach(() => {
			installCapturingAlterTable();
		});

		test('a meta-only PATCH must not crash the table builder callback', async () => {
			const service = new RelationsService({ knex: db, schema });

			// On the previous implementation this rejected (indirectly, as an
			// unhandled rejection inside the schema compiler) with
			// "Cannot read properties of undefined (reading 'fields')" from
			// alterType, after dropForeign had already been queued (#28135).
			await expect(
				service.updateOne('articles_authors', 'authors_id', { meta: { junction_field: 'articles_id' } }),
			).resolves.toBeUndefined();
		});

		test('a meta-only PATCH re-adds the FK with the existing on_delete', async () => {
			const service = new RelationsService({ knex: db, schema });

			await service.updateOne('articles_authors', 'authors_id', { meta: { junction_field: 'articles_id' } });

			expect(capturedBuilder.dropForeign).toHaveBeenCalledWith(
				'authors_id',
				'articles_authors_authors_id_foreign',
			);

			expect(capturedBuilder.foreign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');

			const foreignChain = (capturedBuilder.foreign as ReturnType<typeof vi.fn>).mock.results[0]?.value;
			expect(foreignChain?.onDelete).toHaveBeenCalledWith('CASCADE');
		});

		test('an explicit on_delete override still wins', async () => {
			const service = new RelationsService({ knex: db, schema });

			await service.updateOne('articles_authors', 'authors_id', {
				schema: { on_delete: 'SET NULL' },
			});

			const foreignChain = (capturedBuilder.foreign as ReturnType<typeof vi.fn>).mock.results[0]?.value;
			expect(foreignChain?.onDelete).toHaveBeenCalledWith('SET NULL');
		});
	});
});
