import type { ForeignKey } from '@directus/schema';
import { SchemaBuilder } from '@directus/schema-builder';
import type { RelationMeta } from '@directus/types';
import { getRelation } from '@directus/utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, createMockTableBuilder, resetKnexMocks } from '../test-utils/knex.js';
import { ItemsService } from './items.js';
import { RelationsService } from './relations.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

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

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		schema: {
			preColumnChange: vi.fn().mockResolvedValue(false),
			preRelationChange: vi.fn(),
			constraintName: vi.fn((name) => name),
		},
	})),
}));

function buildSchema() {
	return new SchemaBuilder()
		.collection('authors', (c) => {
			c.field('id').id();
		})
		.collection('articles_authors', (c) => {
			c.field('id').id();
			c.field('articles_id').integer();
			c.field('authors_id').m2o('authors');
		})
		.build();
}

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / Relations', () => {
		describe('updateOne', () => {
			let schema: ReturnType<typeof buildSchema>;
			let foreignKey: { onDelete: ReturnType<typeof vi.fn>; onUpdate: ReturnType<typeof vi.fn> };

			let table: ReturnType<typeof createMockTableBuilder> & {
				dropForeign: ReturnType<typeof vi.fn>;
				foreign: ReturnType<typeof vi.fn>;
			};

			beforeEach(() => {
				schema = buildSchema();

				foreignKey = {
					onDelete: vi.fn().mockReturnThis(),
					onUpdate: vi.fn().mockReturnThis(),
				};

				table = {
					...createMockTableBuilder(),
					dropForeign: vi.fn().mockReturnThis(),
					foreign: vi.fn().mockReturnValue({ references: vi.fn().mockReturnValue(foreignKey) }),
				};

				mockSchemaBuilder.alterTable.mockImplementation(async (_tableName, callback) => {
					// Awaited so errors thrown in the callback surface instead of being swallowed
					await callback(table);
				});
			});

			test('should leave the foreign key alone when the payload only contains meta', async () => {
				const service = new RelationsService({ knex: db, schema });

				await service.updateOne('articles_authors', 'authors_id', {
					meta: { junction_field: 'articles_id' } as RelationMeta,
				});

				expect(mockSchemaBuilder.alterTable).not.toHaveBeenCalled();
				expect(table.dropForeign).not.toHaveBeenCalled();
			});

			test('should give preRelationChange the resolved relation and build the foreign key from its return', async () => {
				const service = new RelationsService({ knex: db, schema });

				vi.spyOn(service.helpers.schema, 'preRelationChange').mockImplementation((relation) => {
					if (relation.schema) {
						relation.schema.on_delete = null;
					}
				});

				await service.updateOne('articles_authors', 'authors_id', { schema: { on_delete: 'CASCADE' } as ForeignKey });

				expect(service.helpers.schema.preRelationChange).toHaveBeenCalledWith(
					expect.objectContaining({ collection: 'articles_authors', related_collection: 'authors' }),
				);

				expect(foreignKey.onDelete).not.toHaveBeenCalled();
			});

			test('should rebuild the foreign key, keeping the triggers the payload does not override', async () => {
				getRelation(schema.relations, 'articles_authors', 'authors_id')!.schema!.on_update = 'CASCADE';

				const service = new RelationsService({ knex: db, schema });

				await service.updateOne('articles_authors', 'authors_id', { schema: { on_delete: 'SET NULL' } as ForeignKey });

				expect(table.dropForeign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');
				expect(table.foreign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');
				expect(foreignKey.onDelete).toHaveBeenCalledWith('SET NULL');
				expect(foreignKey.onUpdate).toHaveBeenCalledWith('CASCADE');
			});

			test('should create the replacement under the name the helper hands back', async () => {
				const service = new RelationsService({ knex: db, schema });

				vi.spyOn(service.helpers.schema, 'constraintName').mockImplementation((name) => `${name}_replaced`);

				await service.updateOne('articles_authors', 'authors_id', { schema: { on_delete: 'CASCADE' } as ForeignKey });

				expect(table.dropForeign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');
				expect(table.foreign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign_replaced');
			});

			test('should not write the resolved constraint name back into the schema overview', async () => {
				getRelation(schema.relations, 'articles_authors', 'authors_id')!.schema!.constraint_name = null;

				const service = new RelationsService({ knex: db, schema });

				await service.updateOne('articles_authors', 'authors_id', { schema: { on_delete: 'CASCADE' } as ForeignKey });

				expect(getRelation(schema.relations, 'articles_authors', 'authors_id')!.schema!.constraint_name).toBeNull();
			});

			test('should create the meta row using the route params when no meta row exists yet', async () => {
				getRelation(schema.relations, 'articles_authors', 'authors_id')!.meta = null;

				const service = new RelationsService({ knex: db, schema });

				await service.updateOne('articles_authors', 'authors_id', {
					meta: { junction_field: 'articles_id' } as RelationMeta,
				});

				expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
					expect.objectContaining({ many_collection: 'articles_authors', many_field: 'authors_id' }),
					expect.anything(),
				);
			});
		});
	});
});
