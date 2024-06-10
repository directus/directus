import { ForbiddenError, UnprocessableContentError } from '@directus/errors';
import { randomUUID } from '@directus/random';
import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker, type RawQuery } from 'knex-mock-client';
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
	type MockedFunction,
} from 'vitest';

import { checkIncreasedUserLimits } from '../telemetry/utils/check-increased-user-limits.js';
import { getRoleCountsByUsers } from '../telemetry/utils/get-role-counts-by-users.js';
import { getUserCountsByRoles } from '../telemetry/utils/get-user-counts-by-roles.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { ItemsService, PermissionsService, PresetsService, RolesService, UsersService } from './index.js';

vi.mock('../../src/database/index', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		USERS_ADMIN_ACCESS_LIMIT: 3,
		USERS_APP_ACCESS_LIMIT: 3,
		USERS_API_ACCESS_LIMIT: 3,
	}),
}));

vi.mock('../telemetry/utils/check-increased-user-limits.js');
vi.mock('../telemetry/utils/get-role-counts-by-users.js');
vi.mock('../telemetry/utils/get-user-counts-by-roles.js');
vi.mock('../telemetry/utils/should-check-user-limits.js');

const testSchema = {
	collections: {
		directus_roles: {
			collection: 'directus_roles',
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: true,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
			},
		},
	},
	relations: [],
} as SchemaOverview;

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	beforeEach(() => {
		tracker.on.any('directus_roles').response({});

		tracker.on
			.select(/"directus_roles"."id" from "directus_roles" order by "directus_roles"."id" asc limit .*/)
			.response([]);

		tracker.on
			.select(
				/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
			)
			.response([{ count: 0, admin_access: true, app_access: true }]);

		vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 0, api: 0, app: 0 });
		vi.mocked(getUserCountsByRoles).mockResolvedValueOnce({ admin: 0, app: 0, api: 0 });
		vi.mocked(shouldCheckUserLimits).mockReturnValue(true);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / RolesService', () => {
		describe('updateOne', () => {
			let service: RolesService;
			let superUpdateOne: MockInstance;
			const adminRoleId = 'cbfd1e77-b883-4090-93e4-5bcbfbd48aba';
			const userId1 = '07a5fee0-c168-49e2-8e33-4bae280e0c48';
			const userId2 = 'abedf9a4-6956-4a9c-8904-c1aa08a68173';

			beforeEach(() => {
				service = new RolesService({
					knex: db,
					schema: testSchema,
				});

				superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne');
			});

			afterEach(() => {
				superUpdateOne.mockRestore();
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
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

							const data: Record<string, any> = {
								users: [],
							};

							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
						});
					});

					describe('with an array of user objects', () => {
						it('having an added user', async () => {
							const data: Record<string, any> = {
								users: [{ id: userId1 }, { id: userId2 }],
							};

							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);

							tracker.on
								.select('select count(*) as "count" from "directus_users" where "id" in')
								.responseOnce({ count: 1 });

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
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

							const data: Record<string, any> = {
								users: [],
							};

							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
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
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

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

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
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

							tracker.on
								.select(
									({ sql, bindings }: RawQuery) =>
										sql.startsWith('select count(*) as "count" from "directus_users"') && bindings.includes(userId2),
								)
								.response({ count: 1 });

							const result = await service.updateOne(adminRoleId, data);

							expect(result).toBe(adminRoleId);
							expect(superUpdateOne).toHaveBeenCalledOnce();
						});

						it('having an added user that is the last admin', async () => {
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

							const data: Record<string, any> = {
								users: [userId1, userId2],
							};

							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
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
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

							const data: Record<string, any> = {
								users: [{ id: userId1 }, { id: userId2 }],
							};

							tracker.on.select('select "admin_access" from "directus_roles"').responseOnce({ admin_access });
							tracker.on.select('select "id" from "directus_users" where "role" = ?').responseOnce([{ id: userId1 }]);
							tracker.on.select('select count(*) as "count" from "directus_users"').responseOnce({ count: 0 });

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
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
							const service = new RolesService({
								knex: db,
								schema: testSchema,
								accountability: { role: 'test', admin: false },
							});

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

							const promise = service.updateOne(adminRoleId, data);

							expect.assertions(5); // to ensure both assertions in the catch block are reached

							try {
								await promise;
							} catch (err: any) {
								expect(err.message).toBe(`You don't have permission to access this.`);
								expect(err).toBeInstanceOf(ForbiddenError);
							}

							expect(superUpdateOne).toHaveBeenCalled();

							expect(superUpdateOne.mock.lastCall![2].preMutationError.message).toBe(
								`Can't process content. You can't remove the last admin user from the admin role.`,
							);

							expect(superUpdateOne.mock.lastCall![2].preMutationError).toBeInstanceOf(UnprocessableContentError);
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
					});
				});
			});
		});
	});

	describe('Services / Roles', () => {
		let service: RolesService;
		let checkForOtherAdminRolesSpy: MockInstance;
		let checkForOtherAdminUsersSpy: MockInstance;

		beforeEach(() => {
			service = new RolesService({
				knex: db,
				schema: {
					collections: {
						directus_roles: {
							collection: 'directus_roles',
							primary: 'id',
							singleton: false,
							sortField: null,
							note: null,
							accountability: null,
							fields: {
								id: {
									field: 'id',
									defaultValue: null,
									nullable: false,
									generated: true,
									type: 'integer',
									dbType: 'integer',
									precision: null,
									scale: null,
									special: [],
									note: null,
									validation: null,
									alias: false,
								},
							},
						},
					},
					relations: [],
				},
			});

			vi.spyOn(PermissionsService.prototype, 'deleteByQuery').mockResolvedValueOnce([]);
			vi.spyOn(PresetsService.prototype, 'deleteByQuery').mockResolvedValueOnce([]);
			vi.spyOn(UsersService.prototype, 'updateByQuery').mockResolvedValueOnce([]);
			vi.spyOn(UsersService.prototype, 'deleteByQuery').mockResolvedValueOnce([]);

			// "as any" are needed since these are private methods
			checkForOtherAdminRolesSpy = vi
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminRoles')
				.mockResolvedValue(true);

			checkForOtherAdminUsersSpy = vi
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminUsers')
				.mockResolvedValue(true);
		});

		afterEach(() => {
			checkForOtherAdminRolesSpy.mockRestore();
			checkForOtherAdminUsersSpy.mockRestore();
		});

		describe('createOne', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.createOne({});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.createOne({ ip_access: ['invalid_ip'] })).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('createMany', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.createMany([{}]);
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.createMany([{ ip_access: ['invalid_ip'] }])).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('updateOne', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.updateOne(1, {});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles once and not checkForOtherAdminUsersSpy', async () => {
				await service.updateOne(1, { admin_access: false });
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
				expect(checkForOtherAdminUsersSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles and checkForOtherAdminUsersSpy once', async () => {
				await service.updateOne(1, { admin_access: false, users: [1] });
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
				expect(checkForOtherAdminUsersSpy).toBeCalledTimes(1);
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.updateOne(1, { ip_access: ['invalid_ip'] })).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('updateMany', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.updateMany([1], {});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles once', async () => {
				await service.updateMany([1], { admin_access: false });
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.updateMany([1], { ip_access: ['invalid_ip'] })).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('updateBatch', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.updateBatch([{ id: 1 }]);
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles once', async () => {
				await service.updateBatch([{ id: 1, admin_access: false }]);
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.updateBatch([{ id: 1, ip_access: ['invalid_ip'] }])).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('updateByQuery', () => {
			it('should not checkForOtherAdminRoles', async () => {
				// mock return value for the following empty query
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValueOnce([1]);
				await service.updateByQuery({}, {});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles once', async () => {
				// mock return value for the following empty query
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValueOnce([1]);
				await service.updateByQuery({}, { admin_access: false });
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});

			it('should throw due to invalid ip_access', async () => {
				await expect(service.updateByQuery({}, { ip_access: ['invalid_ip'] })).rejects.toThrow(
					'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
				);
			});
		});

		describe('deleteOne', () => {
			it('should checkForOtherAdminRoles once', async () => {
				await service.deleteOne(1);
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should checkForOtherAdminRoles once', async () => {
				await service.deleteMany([1]);
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteByQuery', () => {
			it('should checkForOtherAdminRoles once', async () => {
				// mock return value for the following empty query
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValueOnce([1]);
				await service.deleteByQuery({});
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});
		});
	});

	describe('User Limits Tests', () => {
		let service: RolesService;
		let checkForOtherAdminRolesSpy: MockInstance;
		let checkForOtherAdminUsersSpy: MockInstance;

		beforeEach(() => {
			service = new RolesService({
				knex: db,
				schema: testSchema,
			});

			vi.mocked(checkIncreasedUserLimits).mockReset();
			vi.mocked(getRoleCountsByUsers).mockReset();
			vi.mocked(getUserCountsByRoles).mockReset();

			// "as any" are needed since these are private methods
			checkForOtherAdminRolesSpy = vi
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminRoles')
				.mockResolvedValueOnce(true);

			checkForOtherAdminUsersSpy = vi
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminUsers')
				.mockResolvedValueOnce(true);
		});

		afterEach(() => {
			checkForOtherAdminRolesSpy.mockRestore();
			checkForOtherAdminUsersSpy.mockRestore();
		});

		describe('createOne', () => {
			it('calculates the number of increased admin users', async () => {
				await service.createOne({ admin_access: true, app_access: true, users: [1, 2, 3] });

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 3, app: 0, api: 0 }, []);
			});

			it('calculates the number of increased app users', async () => {
				await service.createOne({ admin_access: false, app_access: true, users: [1, 2, 3] });

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 3, api: 0 }, []);
			});

			it('calculates the number of increased api users', async () => {
				await service.createOne({ admin_access: false, app_access: false, users: [1, 2, 3] });

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 3 }, []);
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				await service.createOne({ admin_access: true, app_access: true, users: [1, 2, 3] });

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});

		describe('createMany', () => {
			it('calculates the number of increased admin users', async () => {
				await service.createMany([
					{ admin_access: true, app_access: true, users: [1] },
					{ admin_access: true, app_access: true, users: [2, 3] },
					{ admin_access: true, app_access: true, users: [4, 5, 6] },
				]);

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 6, app: 0, api: 0 }, []);
			});

			it('calculates the number of increased app users', async () => {
				await service.createMany([
					{ admin_access: false, app_access: true, users: [1] },
					{ admin_access: false, app_access: true, users: [2, 3] },
					{ admin_access: false, app_access: true, users: [4, 5, 6] },
				]);

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 6, api: 0 }, []);
			});

			it('calculates the number of increased api users', async () => {
				await service.createMany([
					{ admin_access: false, app_access: false, users: [1] },
					{ admin_access: false, app_access: false, users: [2, 3] },
					{ admin_access: false, app_access: false, users: [4, 5, 6] },
				]);

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 6 }, []);
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				await service.createMany([
					{ admin_access: true, app_access: true, users: [1] },
					{ admin_access: true, app_access: true, users: [2, 3] },
					{ admin_access: true, app_access: true, users: [4, 5, 6] },
				]);

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});

		describe('updateOne', () => {
			it('calculates the number of increased admin users', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: true, app_access: true }]);

				vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 2, app: 0, api: 0 });
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 11, app: 0, api: 0 });

				await service.updateOne(randomUUID(), {
					admin_access: true,
					app_access: true,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 3, app: 0, api: 0 }, []);
			});

			it('calculates the number of increased admin users with access change', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: false, app_access: true }]);

				vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 2, app: 0, api: 0 });
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 11, app: 0, api: 0 });

				await service.updateOne(randomUUID(), {
					admin_access: true,
					app_access: true,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 5, app: 0, api: 0 }, []);
			});

			it('calculates the number of increased app users', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: false, app_access: true }]);

				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 0, app: 22, api: 0 });

				await service.updateOne(randomUUID(), {
					admin_access: false,
					app_access: true,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 3, api: 0 }, []);
			});

			it('calculates the number of increased app users with access change', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: false, app_access: false }]);

				vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 0, app: 2, api: 0 });
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 0, app: 22, api: 0 });

				await service.updateOne(randomUUID(), {
					admin_access: false,
					app_access: true,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 5, api: 0 }, []);
			});

			it('calculates the number of increased api users', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: false, app_access: false }]);

				vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 0, app: 0, api: 2 });
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 0, app: 0, api: 33 });

				await service.updateOne(randomUUID(), {
					admin_access: false,
					app_access: false,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 3 }, []);
			});

			it('calculates the number of increased api users with access change', async () => {
				tracker.resetHandlers();

				tracker.on
					.select(
						/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(where "directus_roles"\."id" = \?).*/,
					)
					.responseOnce([{ count: 2, admin_access: false, app_access: true }]);

				vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 0, app: 0, api: 2 });
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 0, app: 0, api: 33 });

				await service.updateOne(randomUUID(), {
					admin_access: false,
					app_access: false,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 5 }, []);
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				await service.updateOne(randomUUID(), {
					admin_access: false,
					app_access: true,
					users: [1, 2, 3, 4, 5],
				});

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});

		describe('updateMany', () => {
			it('calculates the number of increased admin users', async () => {
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 11, app: 22, api: 33 });

				await service.updateMany([randomUUID(), randomUUID(), randomUUID()], {
					admin_access: true,
					app_access: true,
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 55, app: 0, api: 0 });
			});

			it('calculates the number of increased app users', async () => {
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 11, app: 22, api: 33 });

				await service.updateMany([randomUUID(), randomUUID(), randomUUID()], {
					admin_access: false,
					app_access: true,
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 44, api: 0 });
			});

			it('calculates the number of increased api users', async () => {
				vi.mocked(getUserCountsByRoles).mockResolvedValue({ admin: 11, app: 22, api: 33 });

				await service.updateMany([randomUUID(), randomUUID(), randomUUID()], {
					admin_access: false,
					app_access: false,
				});

				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 33 });
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				await service.updateMany([randomUUID(), randomUUID(), randomUUID()], {
					admin_access: false,
					app_access: true,
				});

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});
	});
});
