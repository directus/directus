import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { UsersService, ItemsService } from '.';
import { RecordNotUniqueException } from '../exceptions/database/record-not-unique';

jest.mock('../../src/database/index', () => {
	return { __esModule: true, default: jest.fn(), getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

const testRoleId = '4ccdb196-14b3-4ed1-b9da-c1978be07ca2';

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_users').response({});

		// mock notifications update query in deleteOne/deleteMany/deleteByQuery methods
		tracker.on.update('directus_notifications').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Users', () => {
		let service: UsersService;
		let checkUniqueEmailsSpy: jest.SpyInstance;
		let checkPasswordPolicySpy: jest.SpyInstance;
		let checkRemainingAdminExistenceSpy: jest.SpyInstance;
		let checkRemainingActiveAdminSpy: jest.SpyInstance;

		beforeEach(() => {
			service = new UsersService({
				knex: db,
				schema: {
					collections: {
						directus_users: {
							collection: 'directus_users',
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

			// "as any" are needed since these are private methods
			checkUniqueEmailsSpy = jest
				.spyOn(UsersService.prototype as any, 'checkUniqueEmails')
				.mockImplementation(jest.fn());
			checkPasswordPolicySpy = jest
				.spyOn(UsersService.prototype as any, 'checkPasswordPolicy')
				.mockImplementation(jest.fn());
			checkRemainingAdminExistenceSpy = jest
				.spyOn(UsersService.prototype as any, 'checkRemainingAdminExistence')
				.mockImplementation(jest.fn());
			checkRemainingActiveAdminSpy = jest
				.spyOn(UsersService.prototype as any, 'checkRemainingActiveAdmin')
				.mockImplementation(jest.fn());
		});

		afterEach(() => {
			checkUniqueEmailsSpy.mockClear();
			checkPasswordPolicySpy.mockClear();
			checkRemainingAdminExistenceSpy.mockClear();
			checkRemainingActiveAdminSpy.mockClear();
		});

		describe('createOne', () => {
			it('should not checkUniqueEmails', async () => {
				await service.createOne({});
				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				await service.createOne({ email: 'test@example.com' });
				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should not checkPasswordPolicy', async () => {
				await service.createOne({});
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.createOne({ password: 'testpassword' });
				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});
		});

		describe('createMany', () => {
			it('should not checkUniqueEmails', async () => {
				await service.createMany([{}]);
				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				await service.createMany([{ email: 'test@example.com' }]);
				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should not checkPasswordPolicy', async () => {
				await service.createMany([{}]);
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.createMany([{ password: 'testpassword' }]);
				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});
		});

		describe('updateOne', () => {
			it.todo('should have similar tests as updateMany');
		});

		describe('updateMany', () => {
			it('should not checkRemainingAdminExistence', async () => {
				// mock newRole query in updateMany
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: true });

				await service.updateMany([1], { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: false });

				await service.updateMany([1], { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});

			it('should not checkRemainingActiveAdmin', async () => {
				await service.updateMany([1], {});
				expect(checkRemainingActiveAdminSpy).not.toBeCalled();
			});

			it('should checkRemainingActiveAdmin once', async () => {
				await service.updateMany([1], { status: 'inactive' });
				expect(checkRemainingActiveAdminSpy).toBeCalledTimes(1);
			});

			it('should not checkUniqueEmails', async () => {
				await service.updateMany([1], {});
				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				await service.updateMany([1], { email: 'test@example.com' });
				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should throw RecordNotUniqueException for multiple keys with same email', async () => {
				expect.assertions(2); // to ensure both assertions in the catch block are reached

				try {
					await service.updateMany([1, 2], { email: 'test@example.com' });
				} catch (err: any) {
					expect(err.message).toBe(`Field "email" has to be unique.`);
					expect(err).toBeInstanceOf(RecordNotUniqueException);
				}
			});

			it('should not checkPasswordPolicy', async () => {
				await service.updateMany([1], {});
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.updateMany([1], { password: 'testpassword' });
				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});
		});

		describe('updateByQuery', () => {
			it.todo('should have similar tests as updateMany');
		});

		describe('deleteOne', () => {
			it('should checkRemainingAdminExistence once', async () => {
				await service.deleteOne(1);
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should checkRemainingAdminExistence once', async () => {
				await service.deleteMany([1]);
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteByQuery', () => {
			it('should checkRemainingAdminExistence once', async () => {
				// mock return value for the following empty query
				jest
					.spyOn(ItemsService.prototype, 'readByQuery')
					.mockImplementation(jest.fn(() => Promise.resolve([{ id: 1 }])));
				await service.deleteByQuery({});
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});
	});
});
