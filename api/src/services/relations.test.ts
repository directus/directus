import { SchemaBuilder } from '@directus/schema-builder';
import type { RelationMeta } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, createMockTableBuilder, resetKnexMocks } from '../test-utils/knex.js';
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

const schema = new SchemaBuilder()
	.collection('authors', (c) => {
		c.field('id').id();
	})
	.collection('articles_authors', (c) => {
		c.field('id').id();
		c.field('articles_id').integer();
		c.field('authors_id').m2o('authors');
	})
	.build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / Relations', () => {
		describe('updateOne', () => {
			test('should re-add the foreign key when the payload only contains meta', async () => {
				const foreignKeyBuilder = {
					onDelete: vi.fn().mockReturnThis(),
					onUpdate: vi.fn().mockReturnThis(),
				};

				const table = {
					...createMockTableBuilder(),
					dropForeign: vi.fn().mockReturnThis(),
					foreign: vi.fn().mockReturnValue({ references: vi.fn().mockReturnValue(foreignKeyBuilder) }),
				};

				mockSchemaBuilder.alterTable.mockImplementation((_tableName, callback) => {
					callback(table);
					return Promise.resolve();
				});

				const service = new RelationsService({ knex: db, schema });

				await service.updateOne('articles_authors', 'authors_id', {
					meta: { junction_field: 'articles_id' } as RelationMeta,
				});

				expect(table.dropForeign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');
				expect(table.foreign).toHaveBeenCalledWith('authors_id', 'articles_authors_authors_id_foreign');
			});
		});
	});
});
