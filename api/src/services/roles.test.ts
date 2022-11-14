import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { PermissionsService, PresetsService, RolesService, UsersService, ItemsService } from '.';

jest.mock('../../src/database/index', () => {
	return { __esModule: true, default: jest.fn(), getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_roles').response({});
		tracker.on
			.select(/"directus_roles"."id" from "directus_roles" order by "directus_roles"."id" asc limit .*/)
			.response([]);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Roles', () => {
		let service: RolesService;
		let checkForOtherAdminRolesSpy: jest.SpyInstance;
		let checkForOtherAdminUsersSpy: jest.SpyInstance;

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

			jest.spyOn(PermissionsService.prototype, 'deleteByQuery').mockImplementation(jest.fn());
			jest.spyOn(PresetsService.prototype, 'deleteByQuery').mockImplementation(jest.fn());
			jest.spyOn(UsersService.prototype, 'updateByQuery').mockImplementation(jest.fn());
			jest.spyOn(UsersService.prototype, 'deleteByQuery').mockImplementation(jest.fn());

			// "as any" are needed since these are private methods
			checkForOtherAdminRolesSpy = jest
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminRoles')
				.mockImplementation(jest.fn());
			checkForOtherAdminUsersSpy = jest
				.spyOn(RolesService.prototype as any, 'checkForOtherAdminUsers')
				.mockImplementation(jest.fn());
		});

		afterEach(() => {
			checkForOtherAdminRolesSpy.mockClear();
			checkForOtherAdminUsersSpy.mockClear();
		});

		describe('createOne', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.createOne({});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});
		});

		describe('createMany', () => {
			it('should not checkForOtherAdminRoles', async () => {
				await service.createMany([{}]);
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
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
		});

		describe('updateByQuery', () => {
			it('should not checkForOtherAdminRoles', async () => {
				// mock return value for the following empty query
				jest.spyOn(ItemsService.prototype, 'getKeysByQuery').mockImplementation(jest.fn(() => Promise.resolve([1])));
				await service.updateByQuery({}, {});
				expect(checkForOtherAdminRolesSpy).not.toBeCalled();
			});

			it('should checkForOtherAdminRoles once', async () => {
				// mock return value for the following empty query
				jest.spyOn(ItemsService.prototype, 'getKeysByQuery').mockImplementation(jest.fn(() => Promise.resolve([1])));
				await service.updateByQuery({}, { admin_access: false });
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
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
				jest.spyOn(ItemsService.prototype, 'getKeysByQuery').mockImplementation(jest.fn(() => Promise.resolve([1])));
				await service.deleteByQuery({});
				expect(checkForOtherAdminRolesSpy).toBeCalledTimes(1);
			});
		});
	});
});
