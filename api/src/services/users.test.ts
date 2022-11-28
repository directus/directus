import { SchemaOverview } from '@directus/shared/types';
import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, MockedFunction, SpyInstance, vi } from 'vitest';
import { ItemsService, UsersService } from '.';
import { InvalidPayloadException } from '../exceptions';
import { RecordNotUniqueException } from '../exceptions/database/record-not-unique';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

const testRoleId = '4ccdb196-14b3-4ed1-b9da-c1978be07ca2';

const testSchema = {
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
} as SchemaOverview;

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex({ client: MockClient }));
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
		let superUpdateManySpy: SpyInstance;
		let checkUniqueEmailsSpy: SpyInstance;
		let checkPasswordPolicySpy: SpyInstance;
		let checkRemainingAdminExistenceSpy: SpyInstance;
		let checkRemainingActiveAdminSpy: SpyInstance;

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

			superUpdateManySpy = vi.spyOn(ItemsService.prototype, 'updateMany');

			// "as any" are needed since these are private methods
			checkUniqueEmailsSpy = vi
				.spyOn(UsersService.prototype as any, 'checkUniqueEmails')
				.mockImplementation(() => vi.fn());
			checkPasswordPolicySpy = vi
				.spyOn(UsersService.prototype as any, 'checkPasswordPolicy')
				.mockResolvedValue(() => vi.fn());
			checkRemainingAdminExistenceSpy = vi
				.spyOn(UsersService.prototype as any, 'checkRemainingAdminExistence')
				.mockResolvedValue(() => vi.fn());
			checkRemainingActiveAdminSpy = vi
				.spyOn(UsersService.prototype as any, 'checkRemainingActiveAdmin')
				.mockResolvedValue(() => vi.fn());
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
			it('should not checkRemainingAdminExistence', async () => {
				// mock newRole query in updateMany (called by ItemsService updateOne)
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: true });

				await service.updateOne(1, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany (called by ItemsService updateOne)
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: false });

				await service.updateOne(1, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});

			it('should not checkRemainingActiveAdmin', async () => {
				await service.updateOne(1, {});
				expect(checkRemainingActiveAdminSpy).not.toBeCalled();
			});

			it('should checkRemainingActiveAdmin once', async () => {
				await service.updateOne(1, { status: 'inactive' });
				expect(checkRemainingActiveAdminSpy).toBeCalledTimes(1);
			});

			it('should not checkUniqueEmails', async () => {
				await service.updateOne(1, {});
				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				await service.updateOne(1, { email: 'test@example.com' });
				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should not checkPasswordPolicy', async () => {
				await service.updateOne(1, {});
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.updateOne(1, { password: 'testpassword' });
				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});

			it.each(['provider', 'external_identifier'])(
				'should throw InvalidPayloadException for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					const promise = service.updateOne(1, { [field]: 'test' });

					expect.assertions(2); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You can't change the "${field}" value manually.`);
						expect(err).toBeInstanceOf(InvalidPayloadException);
					}
				}
			);

			it.each(['provider', 'external_identifier'])('should allow admin users to update "%s" field', async (field) => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'admin', admin: true },
				});

				const promise = service.updateOne(1, { [field]: 'test' });

				await expect(promise).resolves.not.toThrow();
				expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
			});

			it.each(['provider', 'external_identifier'])(
				'should allow null accountability to update "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
					});

					const promise = service.updateOne(1, { [field]: 'test' });

					await expect(promise).resolves.not.toThrow();
					expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
				}
			);
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

			it.each(['provider', 'external_identifier'])(
				'should throw InvalidPayloadException for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					const promise = service.updateMany([1], { [field]: 'test' });

					expect.assertions(2); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You can't change the "${field}" value manually.`);
						expect(err).toBeInstanceOf(InvalidPayloadException);
					}
				}
			);

			it.each(['provider', 'external_identifier'])('should allow admin users to update "%s" field', async (field) => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'admin', admin: true },
				});

				const promise = service.updateMany([1], { [field]: 'test' });

				await expect(promise).resolves.not.toThrow();
				expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
			});

			it.each(['provider', 'external_identifier'])(
				'should allow null accountability to update "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
					});

					const promise = service.updateMany([1], { [field]: 'test' });

					await expect(promise).resolves.not.toThrow();
					expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
				}
			);
		});

		describe('updateByQuery', () => {
			it('should not checkRemainingAdminExistence', async () => {
				// mock newRole query in updateMany (called by ItemsService updateByQuery)
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: true });

				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany (called by ItemsService updateByQuery)
				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: false });

				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});

			it('should not checkRemainingActiveAdmin', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, {});
				expect(checkRemainingActiveAdminSpy).not.toBeCalled();
			});

			it('should checkRemainingActiveAdmin once', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { status: 'inactive' });
				expect(checkRemainingActiveAdminSpy).toBeCalledTimes(1);
			});

			it('should not checkUniqueEmails', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, {});
				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { email: 'test@example.com' });
				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should throw RecordNotUniqueException for multiple keys with same email', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1, 2]);

				expect.assertions(2); // to ensure both assertions in the catch block are reached

				try {
					await service.updateByQuery({}, { email: 'test@example.com' });
				} catch (err: any) {
					expect(err.message).toBe(`Field "email" has to be unique.`);
					expect(err).toBeInstanceOf(RecordNotUniqueException);
				}
			});

			it('should not checkPasswordPolicy', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, {});
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { password: 'testpassword' });
				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});

			it.each(['provider', 'external_identifier'])(
				'should throw InvalidPayloadException for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

					const promise = service.updateByQuery({}, { [field]: 'test' });

					expect.assertions(2); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You can't change the "${field}" value manually.`);
						expect(err).toBeInstanceOf(InvalidPayloadException);
					}
				}
			);

			it.each(['provider', 'external_identifier'])('should allow admin users to update "%s" field', async (field) => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'admin', admin: true },
				});

				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				const promise = service.updateByQuery({}, { [field]: 'test' });

				await expect(promise).resolves.not.toThrow();
				expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
			});

			it.each(['provider', 'external_identifier'])(
				'should allow null accountability to update "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
					});

					vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

					const promise = service.updateByQuery({}, { [field]: 'test' });

					await expect(promise).resolves.not.toThrow();
					expect(superUpdateManySpy).toBeCalledWith([1], expect.objectContaining({ auth_data: null }), undefined);
				}
			);
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
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([{ id: 1 }]);

				await service.deleteByQuery({});
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});
	});
});
