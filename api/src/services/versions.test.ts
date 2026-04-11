import { SchemaBuilder } from '@directus/schema-builder';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';
import { VersionsService } from './versions.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		date: {
			writeTimestamp: vi.fn((value: string) => value),
		},
	})),
}));

vi.mock('../cache.js', () => ({
	getCache: vi.fn().mockReturnValue({
		cache: { clear: vi.fn() },
		systemCache: { clear: vi.fn() },
		localSchemaCache: { get: vi.fn(), set: vi.fn() },
		lockCache: undefined,
	}),
	getCacheValue: vi.fn(),
	setCacheValue: vi.fn(),
	clearSystemCache: vi.fn(),
}));

vi.mock('../utils/should-clear-cache.js', () => ({
	shouldClearCache: vi.fn().mockReturnValue(false),
}));

vi.mock('./payload.js', () => {
	const PayloadService = vi.fn();
	PayloadService.prototype.prepareDelta = vi.fn().mockImplementation(async (delta: unknown) => delta);
	return { PayloadService };
});

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		createTracker(db);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Services / Versions', () => {
		describe('save respects collection accountability tracking', () => {
			const buildSchema = (accountability: 'all' | 'activity' | null) =>
				new SchemaBuilder()
					.collection('articles', (c) => {
						c.field('id').id();
						c.field('title').string();
					})
					.options({ accountability })
					.collection('directus_versions', (c) => {
						c.field('id').id();
						c.field('key').string();
						c.field('item').string();
						c.field('collection').string();
						c.field('delta').json();
					})
					.build();

			const setupSpies = () => {
				const readOneSpy = vi
					.spyOn(ItemsService.prototype, 'readOne')
					.mockResolvedValue({ item: '1', collection: 'articles', delta: {} });

				const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('1');

				const activityCreateSpy = vi.spyOn(ActivityService.prototype, 'createOne').mockResolvedValue(42);

				const revisionsCreateSpy = vi.spyOn(RevisionsService.prototype, 'createOne').mockResolvedValue(99);

				return { readOneSpy, updateOneSpy, activityCreateSpy, revisionsCreateSpy };
			};

			test('creates both activity and revision when collection accountability is "all"', async () => {
				const schema = buildSchema('all');
				const { activityCreateSpy, revisionsCreateSpy } = setupSpies();

				const service = new VersionsService({ knex: db, schema });

				await service.save(1, { title: 'Updated' });

				expect(activityCreateSpy).toHaveBeenCalledTimes(1);
				expect(revisionsCreateSpy).toHaveBeenCalledTimes(1);

				expect(activityCreateSpy).toHaveBeenCalledWith(
					expect.objectContaining({ action: 'version_save', collection: 'articles', item: '1' }),
				);

				expect(revisionsCreateSpy).toHaveBeenCalledWith(
					expect.objectContaining({ collection: 'articles', item: '1', version: 1, activity: 42 }),
				);
			});

			test('creates only activity when collection accountability is "activity"', async () => {
				const schema = buildSchema('activity');
				const { activityCreateSpy, revisionsCreateSpy } = setupSpies();

				const service = new VersionsService({ knex: db, schema });

				await service.save(1, { title: 'Updated' });

				expect(activityCreateSpy).toHaveBeenCalledTimes(1);
				expect(revisionsCreateSpy).not.toHaveBeenCalled();
			});

			test('skips both activity and revision when collection accountability is null', async () => {
				const schema = buildSchema(null);
				const { activityCreateSpy, revisionsCreateSpy } = setupSpies();

				const service = new VersionsService({ knex: db, schema });

				await service.save(1, { title: 'Updated' });

				expect(activityCreateSpy).not.toHaveBeenCalled();
				expect(revisionsCreateSpy).not.toHaveBeenCalled();
			});

			test('still updates the version delta when accountability tracking is disabled', async () => {
				const schema = buildSchema(null);
				const { updateOneSpy } = setupSpies();

				const service = new VersionsService({ knex: db, schema });

				const result = await service.save(1, { title: 'Updated' });

				expect(updateOneSpy).toHaveBeenCalledWith(1, expect.objectContaining({ delta: expect.any(Object) }));
				expect(result).toEqual(expect.objectContaining({ title: 'Updated' }));
			});
		});
	});
});
