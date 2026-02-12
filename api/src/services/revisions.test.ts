import { InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

const schema = new SchemaBuilder()
	.collection('test_collection', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('m2o').m2o('some_collection');
		c.field('m2o1').m2o('some_collection');
		c.field('o2m').o2m('some_collection', 'test_collection_id');
		c.field('o2m1').o2m('some_collection', 'test_collection_id');
		c.field('m2a').m2a(['some_collection']);
		c.field('m2a1').m2a(['some_collection']);
		c.field('m2m').m2m('some_collection');
		c.field('m2m1').m2m('some_collection');
	})
	.collection('some_collection', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('clean_collection', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.build();

describe('Services / Revisions', () => {
	const { db } = createMockKnex();

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createOne', () => {
		test('should throw InvalidPayloadError when collection is missing', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await expect(service.createOne({})).rejects.toThrow(InvalidPayloadError);
		});

		test('should omit one or more m2o relational fields from data', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.createOne({
				collection: 'test_collection',
				item: '1',
				data: { name: 'test', m2o: {}, m2o1: {} },
				delta: { status: 'published' },
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: { name: 'test' } }),
				expect.any(Object),
			);
		});

		test('should omit one or more o2m relational fields from data', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.createOne({
				collection: 'test_collection',
				item: '1',
				data: { name: 'test', o2m: [], o2m1: [] },
				delta: { status: 'published' },
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: { name: 'test' } }),
				expect.any(Object),
			);
		});

		test('should omit relational fields from both data and delta', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.createOne({
				collection: 'test_collection',
				item: '1',
				data: { name: 'test', o2m: [1] },
				delta: { o2m: [2], name: 'updated' },
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: { name: 'test' }, delta: { name: 'updated' } }),
				expect.any(Object),
			);
		});

		test('should preserve all fields when collection has no matching relation field names', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.createOne({
				collection: 'clean_collection',
				item: '1',
				data: { title: 'hello' },
				delta: { title: 'goodbye' },
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: { title: 'hello' }, delta: { title: 'goodbye' } }),
				expect.any(Object),
			);
		});

		test('should not modify non object data or delta values', async () => {
			const service = new RevisionsService({ knex: db, schema });

			const stringData = JSON.stringify({ name: 'test', activity: 'value' });

			await service.createOne({
				collection: 'test_collection',
				item: '1',
				data: stringData,
				delta: null,
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: stringData, delta: null }),
				expect.any(Object),
			);
		});

		test('should skip processing if collection is not found', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.createOne({
				collection: 'nonexistent',
				item: '1',
				data: { name: 'test', activity: 'value' },
				delta: { name: 'test' },
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ data: { name: 'test', activity: 'value' }, delta: { name: 'test' } }),
				expect.any(Object),
			);
		});
	});

	describe('updateMany', () => {
		test('should omit one or more m2o relational fields from data', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				collection: 'test_collection',
				data: { name: 'test', m2o: {}, m2o1: {} },
				delta: { status: 'published' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { name: 'test' } }),
				expect.any(Object),
			);
		});

		test('should omit one ore more o2m one_field relational fields from data', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				collection: 'test_collection',
				data: { name: 'test', o2m: [], o2m1: [] },
				delta: { status: 'published' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { name: 'test' } }),
				expect.any(Object),
			);
		});

		test('should omit relational fields from both data and delta', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				collection: 'test_collection',
				item: '1',
				data: { name: 'test', o2m: [1] },
				delta: { o2m: [2], name: 'updated' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { name: 'test' }, delta: { name: 'updated' } }),
				expect.any(Object),
			);
		});

		test('should preserve all fields when collection has no matching relation field names', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				collection: 'clean_collection',
				item: '1',
				data: { title: 'hello' },
				delta: { title: 'goodbye' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { title: 'hello' }, delta: { title: 'goodbye' } }),
				expect.any(Object),
			);
		});

		test('should not modify non object data or delta values', async () => {
			const service = new RevisionsService({ knex: db, schema });

			const stringData = JSON.stringify({ name: 'test', activity: 'value' });

			await service.updateMany(['1'], {
				collection: 'test_collection',
				item: '1',
				data: stringData,
				delta: null,
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: stringData, delta: null }),
				expect.any(Object),
			);
		});

		test('should skip processing if collection is not provided', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				data: { name: 'test', activity: 'value' },
				delta: { name: 'test' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { name: 'test', activity: 'value' }, delta: { name: 'test' } }),
				expect.any(Object),
			);
		});

		test('should skip processing if collection is not valid', async () => {
			const service = new RevisionsService({ knex: db, schema });

			await service.updateMany(['1'], {
				collection: 'nonexistent',
				item: '1',
				data: { name: 'test', activity: 'value' },
				delta: { name: 'test' },
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ data: { name: 'test', activity: 'value' }, delta: { name: 'test' } }),
				expect.any(Object),
			);
		});
	});
});
