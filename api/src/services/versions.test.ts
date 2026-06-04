import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';
import { VersionsService } from './versions.js';

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		date: {
			writeTimestamp: vi.fn((value: string) => value),
		},
	})),
}));

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

vi.mock('../utils/should-clear-cache.js');

vi.mock('./payload.js', () => {
	const PayloadService = vi.fn();
	PayloadService.prototype.prepareDelta = vi.fn().mockImplementation(async (delta: unknown) => delta);
	return { PayloadService };
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('./revisions.js', async () => {
	const { mockRevisionsService } = await import('../test-utils/services/revisions-service.js');
	return mockRevisionsService();
});

vi.mock('./activity.js', async () => {
	const { mockActivityService } = await import('../test-utils/services/activity-service.js');
	return mockActivityService();
});

vi.mock('./collections.js', () => {
	const CollectionsService = vi.fn(function (this: any) {
		return this;
	});

	CollectionsService.prototype.readOne = vi.fn().mockResolvedValue({ meta: { versioning: true } });

	return { CollectionsService };
});

const schema = new SchemaBuilder()
	.collection('articles_track_all', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ accountability: 'all' })
	.collection('articles_track_activity', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ accountability: 'activity' })
	.collection('articles_track_none', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ accountability: null })
	.collection('singleton_collection', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ singleton: true })
	.build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);

		vi.clearAllMocks();
	});

	describe('Services / Versions', () => {
		const service = new VersionsService({ knex: db, schema });

		describe('save respects collection accountability tracking', () => {
			test('should skip activity and revision when collection accountability is null', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_none',
					item: 1,
				});

				await service.save(1, { title: 'Updated' });

				expect(ActivityService.prototype.createOne).not.toHaveBeenCalled();
				expect(RevisionsService.prototype.createOne).not.toHaveBeenCalled();

				expect(ItemsService.prototype.updateOne).toHaveBeenCalledWith(
					1,
					expect.objectContaining({ delta: expect.any(Object) }),
				);
			});

			test('should create activity without revision when collection accountability is "activity"', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_activity',
					item: 1,
				});

				await service.save(1, { title: 'Updated' });

				expect(ActivityService.prototype.createOne).toHaveBeenCalledTimes(1);
				expect(RevisionsService.prototype.createOne).not.toHaveBeenCalled();
			});

			test('should create activity and revision when collection accountability is "all"', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_all',
					item: 2,
				});

				await service.save(1, { title: 'Updated' });

				expect(ActivityService.prototype.createOne).toHaveBeenCalledWith(
					expect.objectContaining({ action: 'version_save', collection: 'articles_track_all', item: 2 }),
				);

				expect(RevisionsService.prototype.createOne).toHaveBeenCalledWith(
					expect.objectContaining({ collection: 'articles_track_all', item: 2, version: 1, activity: 1 }),
				);
			});
		});

		describe('save with patchRevision', () => {
			test('should coalesce into latest revision and skip new activity when one exists', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_all',
					item: 2,
					delta: { title: 'Old' },
				});

				vi.spyOn(RevisionsService.prototype, 'readByQuery').mockResolvedValue([
					{ id: 42, data: { id: 2, title: 'Old' }, delta: { title: 'Old' } },
				]);

				await service.save(1, { title: 'Newer' }, { patchRevision: true });

				expect(ActivityService.prototype.createOne).not.toHaveBeenCalled();
				expect(RevisionsService.prototype.createOne).not.toHaveBeenCalled();

				expect(RevisionsService.prototype.updateOne).toHaveBeenCalledWith(42, {
					data: expect.objectContaining({ title: 'Newer' }),
					delta: expect.objectContaining({ title: 'Newer' }),
				});
			});

			test('should fall back to creating activity + revision when no prior revision exists', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_all',
					item: 2,
				});

				vi.spyOn(RevisionsService.prototype, 'readByQuery').mockResolvedValue([]);

				await service.save(1, { title: 'First' }, { patchRevision: true });

				expect(ActivityService.prototype.createOne).toHaveBeenCalledTimes(1);
				expect(RevisionsService.prototype.createOne).toHaveBeenCalledTimes(1);
				expect(RevisionsService.prototype.updateOne).not.toHaveBeenCalled();
			});

			test('should create activity (no revision) under "activity" tracking even with patchRevision', async () => {
				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_activity',
					item: 1,
				});

				await service.save(1, { title: 'Updated' }, { patchRevision: true });

				expect(ActivityService.prototype.createOne).toHaveBeenCalledTimes(1);
				expect(RevisionsService.prototype.createOne).not.toHaveBeenCalled();
				expect(RevisionsService.prototype.updateOne).not.toHaveBeenCalled();
			});

			test('should NOT coalesce when latest revision belongs to a different user', async () => {
				const serviceAsUserB = new VersionsService({
					knex: db,
					schema,
					accountability: { user: 'user-b', role: null, admin: false, app: false, roles: [] } as any,
				});

				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_all',
					item: 2,
					delta: { title: 'Old' },
				});

				vi.spyOn(RevisionsService.prototype, 'readByQuery').mockResolvedValue([
					{
						id: 42,
						data: { title: 'A wrote this' },
						delta: { title: 'A wrote this' },
						activity: { user: 'user-a' },
					},
				]);

				await serviceAsUserB.save(1, { title: 'B wrote this' }, { patchRevision: true });

				expect(RevisionsService.prototype.updateOne).not.toHaveBeenCalled();

				expect(ActivityService.prototype.createOne).toHaveBeenCalledWith(
					expect.objectContaining({ user: 'user-b', action: 'version_save' }),
				);

				expect(RevisionsService.prototype.createOne).toHaveBeenCalledTimes(1);
			});

			test('should coalesce when latest revision belongs to the same user', async () => {
				const serviceAsUserA = new VersionsService({
					knex: db,
					schema,
					accountability: { user: 'user-a', role: null, admin: false, app: false, roles: [] } as any,
				});

				vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
					collection: 'articles_track_all',
					item: 2,
					delta: { title: 'Old' },
				});

				vi.spyOn(RevisionsService.prototype, 'readByQuery').mockResolvedValue([
					{
						id: 42,
						data: { title: 'A first edit' },
						delta: { title: 'A first edit' },
						activity: { user: 'user-a' },
					},
				]);

				await serviceAsUserA.save(1, { title: 'A second edit' }, { patchRevision: true });

				expect(RevisionsService.prototype.updateOne).toHaveBeenCalledWith(42, {
					data: expect.objectContaining({ title: 'A second edit' }),
					delta: expect.objectContaining({ title: 'A second edit' }),
				});

				expect(ActivityService.prototype.createOne).not.toHaveBeenCalled();
				expect(RevisionsService.prototype.createOne).not.toHaveBeenCalled();
			});
		});

		describe('assertSingletonEmpty', () => {
			test('does not throw when collection is not a singleton', async () => {
				await expect((service as any).assertSingletonEmpty('articles_track_all')).resolves.toBeUndefined();
			});

			test('does not throw when singleton collection is empty', async () => {
				tracker.on.select('singleton_collection').response([]);

				await expect((service as any).assertSingletonEmpty('singleton_collection')).resolves.toBeUndefined();
			});

			test('throws when singleton collection is populated', async () => {
				tracker.on.select('singleton_collection').response([{ id: 1 }]);

				await expect((service as any).assertSingletonEmpty('singleton_collection')).rejects.toThrowError(
					/Singleton collection "singleton_collection" already contains an item/,
				);
			});
		});

		describe('createOne forbids item-less version on singleton when already present', () => {
			test('throws when the singleton already contains a published item', async () => {
				tracker.on.select('singleton_collection').response([{ id: 1 }]);

				await expect(
					service.createOne({ key: 'draft', collection: 'singleton_collection', item: null }),
				).rejects.toThrowError(/already contains an item/);
			});

			test('throws when the singleton already has an item-less version', async () => {
				tracker.on.select('singleton_collection').response([]);

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([{ count: 1 }] as any);

				await expect(
					service.createOne({ key: 'draft', collection: 'singleton_collection', item: null }),
				).rejects.toThrowError(/already has an item-less version/);
			});
		});

		describe('updateMany forbids item-less transition on singleton', () => {
			test('throws when transitioning an itemed version to item-less on a singleton, regardless of singleton state', async () => {
				vi.spyOn(VersionsService.prototype, 'readOne').mockResolvedValue({
					collection: 'singleton_collection',
					item: '1',
					key: 'draft',
				} as any);

				await expect(service.updateMany(['version-id'], { item: null })).rejects.toThrowError(
					/cannot be converted to item-less/,
				);
			});
		});
	});
});
