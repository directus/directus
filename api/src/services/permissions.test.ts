import { SchemaBuilder } from '@directus/schema-builder';
import type { MutationOptions } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ItemsService, PermissionsService } from './index.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

const schema = new SchemaBuilder()
	.collection('directus_permissions', (c) => {
		c.field('id').uuid().primary();
	})
	.build();

describe('Integration Tests', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));
	createTracker(db);

	describe('Services / Permissions', () => {
		const service = new PermissionsService({
			knex: db,
			schema,
		});

		vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue(['perm-id-1']);
		vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue(['perm-id-2']);
		vi.spyOn(ItemsService.prototype, 'updateBatch').mockResolvedValue(['perm-id-3']);
		vi.spyOn(ItemsService.prototype, 'upsertMany').mockResolvedValue(['perm-id-4']);
		vi.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue(['perm-id-5']);

		const clearCacheSpy = vi.spyOn(PermissionsService.prototype as any, 'clearCaches').mockResolvedValue(undefined);

		afterEach(() => {
			vi.clearAllMocks();
		});

		it('should clear caches after createOne', async () => {
			await service.createOne({});

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should clear caches after createMany', async () => {
			await service.createMany([{}]);

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should clear caches after updateMany', async () => {
			await service.updateMany(['perm-id-6'], {});

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should clear caches after updateBatch', async () => {
			await service.updateBatch([{ id: 'perm-id-7' }]);

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should clear caches after upsertMany', async () => {
			await service.upsertMany([{}]);

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should clear caches after deleteMany', async () => {
			await service.deleteMany(['perm-id-8']);

			expect(clearCacheSpy).toHaveBeenCalled();
		});

		it('should forward autoPurgeCache option to clearCaches', async () => {
			const opts: MutationOptions = { autoPurgeCache: false };

			await service.createMany([{}], opts);

			expect(clearCacheSpy).toHaveBeenCalledWith(opts);
		});
	});
});
