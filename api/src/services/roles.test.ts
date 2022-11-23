import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService, RolesService } from '.';
import { describe, beforeAll, afterEach, it, expect, vi, beforeEach, MockedFunction, SpyInstance } from 'vitest';
import { UnprocessableEntityException } from '../exceptions';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / RolesService', () => {
		describe('updateOne', () => {
			let service: RolesService;
			let superUpdateOne: SpyInstance;
			const adminRoleId = 'cbfd1e77-b883-4090-93e4-5bcbfbd48aba';
			const userId1 = '07a5fee0-c168-49e2-8e33-4bae280e0c48';
			const userId2 = 'abedf9a4-6956-4a9c-8904-c1aa08a68173';

			beforeEach(() => {
				service = new RolesService({
					knex: db,
					schema: {
						collections: {},
						relations: [],
					},
				});
				superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne').mockReturnValue(Promise.resolve(adminRoleId));
			});

			describe('checkForOtherAdminUsers', () => {
				describe('on an admin role', () => {
					const admin_access = true;

					describe('with an array of user ids', () => {
						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: [userId1, userId2],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: [userId1],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});

					describe('with an array of user objects', () => {
						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }, { id: userId2 }],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});

					describe('with an alterations object', () => {
						it('having a newly created user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [{ name: 'New User' }],
									update: [],
									delete: [],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [{ role: adminRoleId, id: userId2 }],
									delete: [],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId2],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId1],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId1],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});
				});

				describe('on an non-admin role', () => {
					const admin_access = false;

					describe('with an array of user ids', () => {
						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: [userId1, userId2],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user that is the last admin', async () => {
							const data: Record<string, any> = {
								users: [userId1, userId2],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: [userId1],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});

					describe('with an array of user objects', () => {
						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }, { id: userId2 }],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user that is the last admin', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }, { id: userId2 }],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: [],
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});

					describe('with an alterations object', () => {
						it('having a newly created user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [{ name: 'New User' }],
									update: [],
									delete: [],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [{ role: adminRoleId, id: userId2 }],
									delete: [],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user that is the last admin', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [{ role: adminRoleId, id: userId2 }],
									delete: [],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});

						it('having a removed user', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId2],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on
								.select('select "id" from "directus_users" where "role" = ?')
								.responseOnce([{ id: userId1 }, { id: userId2 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed last user that is not the last admin of system', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId1],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);
							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having a removed a last user that is the last admin of system', async () => {
							const data: Record<string, any> = {
								users: {
									create: [],
									update: [],
									delete: [userId1],
								},
							};
							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							expect.assertions(3);
							try {
								await service.updateOne(adminRoleId, data);
							} catch (err: any) {
								expect(err.message).toBe(`You can't remove the last admin user from the admin role.`);
								expect(err).toBeInstanceOf(UnprocessableEntityException);
							}
							expect(superUpdateOne).not.toHaveBeenCalled();
						});
					});
				});
			});
		});
	});
});
