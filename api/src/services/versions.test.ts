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
	});
});
