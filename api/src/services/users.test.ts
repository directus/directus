import { ForbiddenError, InvalidPayloadError, RecordNotUniqueError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import knex, { type Knex } from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
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
import { ItemsService, MailService, UsersService } from './index.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('./mail', () => {
	const MailService = vi.fn();
	MailService.prototype.send = vi.fn();

	return { MailService };
});

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
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	beforeEach(() => {
		tracker.on.any('directus_users').response({});

		// mock notifications update query in deleteOne/deleteMany/deleteByQuery methods
		tracker.on.update('directus_notifications').response({});

		// mock versions update query in deleteOne/deleteMany/deleteByQuery methods
		tracker.on.update('directus_versions').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Users', () => {
		let service: UsersService;
		let mailService: MailService;
		let superCreateManySpy: MockInstance;
		let superUpdateManySpy: MockInstance;
		let checkUniqueEmailsSpy: MockInstance;
		let checkPasswordPolicySpy: MockInstance;
		let checkRemainingAdminExistenceSpy: MockInstance;
		let checkRemainingActiveAdminSpy: MockInstance;

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

			superCreateManySpy = vi.spyOn(ItemsService.prototype as any, 'createMany');
			superUpdateManySpy = vi.spyOn(ItemsService.prototype as any, 'updateMany');

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

			vi.spyOn(UsersService.prototype as any, 'inviteUrl').mockImplementation(() => vi.fn());

			mailService = new MailService({
				schema: testSchema,
			});
		});

		afterEach(() => {
			vi.clearAllMocks();
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
				'should throw InvalidPayloadError for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					const promise = service.updateOne(1, { [field]: 'test' });

					expect.assertions(5); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You don't have permission to access this.`);
						expect(err).toBeInstanceOf(ForbiddenError);
					}

					expect(superUpdateManySpy).toHaveBeenCalled();

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError.message).toBe(
						`Invalid payload. You can't change the "${field}" value manually.`,
					);

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError).toBeInstanceOf(InvalidPayloadError);
				},
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
				},
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

			it('should checkRemainingAdminExistence once for new non admin role', async () => {
				await service.updateMany([1], { role: { name: 'test' } });
				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});

			it('should not checkRemainingAdminExistence for new admin role', async () => {
				await service.updateMany([1], { role: { name: 'test', admin_access: true } });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
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

			it('should throw RecordNotUniqueError for multiple keys with same email', async () => {
				expect.assertions(2); // to ensure both assertions in the catch block are reached

				try {
					await service.updateMany([1, 2], { email: 'test@example.com' });
				} catch (err: any) {
					expect(err.message).toBe(`Value for field "email" in collection "directus_users" has to be unique.`);
					expect(err).toBeInstanceOf(RecordNotUniqueError);
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
				'should throw InvalidPayloadError for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					const promise = service.updateMany([1], { [field]: 'test' });

					expect.assertions(5); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You don't have permission to access this.`);
						expect(err).toBeInstanceOf(ForbiddenError);
					}

					expect(superUpdateManySpy).toHaveBeenCalled();

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError.message).toBe(
						`Invalid payload. You can't change the "${field}" value manually.`,
					);

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError).toBeInstanceOf(InvalidPayloadError);
				},
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
				},
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

			it('should throw RecordNotUniqueError for multiple keys with same email', async () => {
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1, 2]);

				expect.assertions(2); // to ensure both assertions in the catch block are reached

				try {
					await service.updateByQuery({}, { email: 'test@example.com' });
				} catch (err: any) {
					expect(err.message).toBe(`Value for field "email" in collection "directus_users" has to be unique.`);
					expect(err).toBeInstanceOf(RecordNotUniqueError);
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
				'should throw InvalidPayloadError for non-admin users when updating "%s" field',
				async (field) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false },
					});

					vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

					const promise = service.updateByQuery({}, { [field]: 'test' });

					expect.assertions(5); // to ensure both assertions in the catch block are reached

					try {
						await promise;
					} catch (err: any) {
						expect(err.message).toBe(`You don't have permission to access this.`);
						expect(err).toBeInstanceOf(ForbiddenError);
					}

					expect(superUpdateManySpy).toHaveBeenCalled();

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError.message).toBe(
						`Invalid payload. You can't change the "${field}" value manually.`,
					);

					expect(superUpdateManySpy.mock.lastCall![2].preMutationError).toBeInstanceOf(InvalidPayloadError);
				},
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
				},
			);
		});

		describe('deleteOne', () => {
			it('should checkRemainingAdminExistence once', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: false },
				});

				const promise = service.deleteOne(1);

				expect.assertions(3); // to ensure both assertions in the catch block are reached

				try {
					await promise;
				} catch (err: any) {
					expect(err.message).toBe(`You don't have permission to access this.`);
					expect(err).toBeInstanceOf(ForbiddenError);
				}

				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should checkRemainingAdminExistence once', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: false },
				});

				const promise = service.deleteMany([1]);

				expect.assertions(3); // to ensure both assertions in the catch block are reached

				try {
					await promise;
				} catch (err: any) {
					expect(err.message).toBe(`You don't have permission to access this.`);
					expect(err).toBeInstanceOf(ForbiddenError);
				}

				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteByQuery', () => {
			it('should checkRemainingAdminExistence once', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: false },
				});

				// mock return value for the following empty query
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([{ id: 1 }]);

				const promise = service.deleteByQuery({ filter: { id: { _eq: 1 } } });

				expect.assertions(3); // to ensure both assertions in the catch block are reached

				try {
					await promise;
				} catch (err: any) {
					expect(err.message).toBe(`You don't have permission to access this.`);
					expect(err).toBeInstanceOf(ForbiddenError);
				}

				expect(checkRemainingAdminExistenceSpy).toBeCalledTimes(1);
			});
		});

		describe('invite', () => {
			it('should invite new users', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				const promise = service.inviteUser('user@example.com', 'invite-role', null);

				await expect(promise).resolves.not.toThrow();

				expect(superCreateManySpy.mock.lastCall![0]).toEqual([
					expect.objectContaining({
						email: 'user@example.com',
						status: 'invited',
						role: 'invite-role',
					}),
				]);

				expect(mailService.send).toBeCalledTimes(1);
			});

			it('should re-send invites for invited users', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				// mock an invited user
				vi.spyOn(UsersService.prototype as any, 'getUserByEmail').mockResolvedValueOnce({
					status: 'invited',
					role: 'invite-role',
				});

				const promise = service.inviteUser('user@example.com', 'invite-role', null);
				await expect(promise).resolves.not.toThrow();

				expect(superCreateManySpy).not.toBeCalled();
				expect(mailService.send).toBeCalledTimes(1);
			});

			it('should not re-send invites for users in state other than invited', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				// mock an active user
				vi.spyOn(UsersService.prototype as any, 'getUserByEmail').mockResolvedValueOnce({
					status: 'active',
					role: 'invite-role',
				});

				const promise = service.inviteUser('user@example.com', 'invite-role', null);
				await expect(promise).resolves.not.toThrow();

				expect(superCreateManySpy).not.toBeCalled();
				expect(mailService.send).not.toBeCalled();
			});

			it('should update role when re-sent invite contains different role than user has', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				tracker.on.select(/select "admin_access" from "directus_roles"/).response({ admin_access: true });

				// mock an invited user with different role
				vi.spyOn(UsersService.prototype as any, 'getUserByEmail').mockResolvedValueOnce({
					id: 1,
					status: 'invited',
					role: 'existing-role',
				});

				const promise = service.inviteUser('user@example.com', 'invite-role', null);
				await expect(promise).resolves.not.toThrow();

				expect(superUpdateManySpy.mock.lastCall![0]).toEqual([1]);
				expect(superUpdateManySpy.mock.lastCall![1]).toEqual({ role: 'invite-role' });
			});
		});
	});
});
