import { SchemaBuilder } from '@directus/schema-builder';
import type { MutationOptions } from '@directus/types';
import { UserIntegrityCheckFlag } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccessService, ItemsService, PresetsService, RolesService, UsersService } from './index.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

const schema = new SchemaBuilder()
	.collection('test', (c) => {
		c.field('id').uuid().primary();
	})
	.build();

describe('Integration Tests', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));
	createTracker(db);

	describe('Services / Roles', () => {
		const service = new RolesService({
			knex: db,
			schema,
		});

		afterEach(() => {
			vi.clearAllMocks();
		});

		describe('updateMany', () => {
			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue(['role-id-1']);

			const validateRoleNestingSpy = vi
				.spyOn(RolesService.prototype as any, 'validateRoleNesting')
				.mockImplementation(vi.fn());

			it('should not request user integrity checks if no relevant fields are changed', async () => {
				const opts: MutationOptions = {};

				await service.updateMany(['role-id-2'], {}, opts);

				expect(opts.userIntegrityCheckFlags).toBe(undefined);
			});

			it('should request all user integrity checks if parent is changed', async () => {
				const opts: MutationOptions = {};

				await service.updateMany(['role-id-3'], { parent: 'parent-role-id-1' }, opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.All);
			});

			it('should validate role nesting if parent is changed', async () => {
				const opts: MutationOptions = {};

				await service.updateMany(['role-id-4'], { parent: 'parent-role-id-2' }, opts);

				expect(validateRoleNestingSpy).toHaveBeenCalled();
			});

			it('should clear caches if parent is changed', async () => {
				const clearCacheSpy = vi.spyOn(RolesService.prototype as any, 'clearCaches');

				await service.updateMany(['role-id-5'], { parent: 'parent-role-id-3' });

				expect(clearCacheSpy).toHaveBeenCalled();
			});
		});

		describe('deleteMany', () => {
			db.isTransaction = false;

			const accessDeleteByQuerySpy = vi
				.spyOn(AccessService.prototype, 'deleteByQuery')
				.mockResolvedValue(['access-id-1']);

			const presetsDeleteByQuerySpy = vi
				.spyOn(PresetsService.prototype, 'deleteByQuery')
				.mockResolvedValue(['preset-id-1']);

			const usersUpdateByQuerySpy = vi.spyOn(UsersService.prototype, 'updateByQuery').mockResolvedValue(['user-id-1']);
			const rolesUpdateByQuerySpy = vi.spyOn(RolesService.prototype, 'updateByQuery').mockResolvedValue(['role-id-6']);
			const itemsDeleteManySpy = vi.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue(['item-id-1']);

			it('should call associated service methods, with user integrity check flag', async () => {
				const keys = ['role-id-7'];

				await service.deleteMany(keys);

				const opts: MutationOptions = { userIntegrityCheckFlags: UserIntegrityCheckFlag.All, bypassLimits: true };

				expect(accessDeleteByQuerySpy).toHaveBeenCalledWith(
					{
						filter: { role: { _in: keys } },
					},
					opts,
				);

				expect(presetsDeleteByQuerySpy).toHaveBeenCalledWith(
					{
						filter: { role: { _in: keys } },
					},
					opts,
				);

				expect(presetsDeleteByQuerySpy).toHaveBeenCalledWith(
					{
						filter: { role: { _in: keys } },
					},
					opts,
				);

				expect(usersUpdateByQuerySpy).toHaveBeenCalledWith(
					{
						filter: { role: { _in: keys } },
					},
					{
						status: 'suspended',
						role: null,
					},
					opts,
				);

				expect(rolesUpdateByQuerySpy).toHaveBeenCalledWith(
					{
						filter: { parent: { _in: keys } },
					},
					{ parent: null },
				);

				expect(itemsDeleteManySpy).toHaveBeenCalledWith(keys, { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });
			});

			it('should clear caches', async () => {
				const clearCacheSpy = vi.spyOn(RolesService.prototype as any, 'clearCaches');

				await service.deleteMany(['role-id-8']);

				expect(clearCacheSpy).toHaveBeenCalled();
			});
		});
	});
});
