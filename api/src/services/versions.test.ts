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
	});
});
