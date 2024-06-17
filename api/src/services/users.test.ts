import { ForbiddenError, InvalidPayloadError, RecordNotUniqueError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { randomUUID } from 'crypto';
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
import { checkIncreasedUserLimits } from '../telemetry/utils/check-increased-user-limits.js';
import { getRoleCountsByRoles } from '../telemetry/utils/get-role-counts-by-roles.js';
import { getRoleCountsByUsers } from '../telemetry/utils/get-role-counts-by-users.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { ItemsService, MailService, UsersService } from './index.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('./mail', () => {
	const MailService = vi.fn();
	MailService.prototype.send = vi.fn().mockImplementation(() => Promise.resolve());

	return { MailService };
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
vi.mock('../telemetry/utils/get-role-counts-by-roles.js');
vi.mock('../telemetry/utils/get-role-counts-by-users.js');
vi.mock('../telemetry/utils/should-check-user-limits.js');

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

		// mock user counts in updateOne/updateMany/updateByQuery methods
		tracker.on
			.select(
				/(select count\("directus_users"\."id"\) as "count", "directus_roles"\."admin_access", "directus_roles"\."app_access" from "directus_users").*(group by "directus_roles"\."admin_access", "directus_roles"\."app_access")/,
			)
			.response([{ count: 0, admin_access: true, app_access: true }]);

		vi.mocked(getRoleCountsByRoles).mockResolvedValueOnce({ admin: 0, app: 0, api: 0 });
		vi.mocked(getRoleCountsByUsers).mockResolvedValue({ admin: 0, api: 0, app: 0 });
		vi.mocked(shouldCheckUserLimits).mockResolvedValue(true);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Users', () => {
		let service: UsersService;
		let mailService: MailService;
		let superCreateOneSpy: MockInstance;
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

			superCreateOneSpy = vi.spyOn(ItemsService.prototype as any, 'createOne');
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
				expect(checkUniqueEmailsSpy).toBeCalledTimes(2);
			});

			it('should not checkPasswordPolicy', async () => {
				await service.createMany([{}]);
				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.createMany([{ password: 'testpassword' }]);
				expect(checkPasswordPolicySpy).toBeCalledTimes(2);
			});

			it('should process user limits for new roles', async () => {
				await service.createMany([{ role: { admin_access: true } }, { role: { app_access: true } }, { role: {} }]);
				expect(getRoleCountsByRoles).toBeCalledWith(db, []);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 1, app: 1, api: 1 });
			});

			it('should process user limits for existing roles', async () => {
				vi.mocked(getRoleCountsByRoles).mockReset();
				vi.mocked(getRoleCountsByRoles).mockResolvedValue({ admin: 1, app: 2, api: 3 });
				await service.createMany([{ role: randomUUID() }, { role: randomUUID() }, { role: randomUUID() }]);
				expect(getRoleCountsByRoles).toBeCalledWith(db, expect.any(Array<string>));
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 1, app: 2, api: 3 });
			});

			it('should process user limits for new and existing roles', async () => {
				vi.mocked(getRoleCountsByRoles).mockReset();
				vi.mocked(getRoleCountsByRoles).mockResolvedValue({ admin: 1, app: 2, api: 3 });

				await service.createMany([
					{ role: randomUUID() },
					{ role: randomUUID() },
					{ role: randomUUID() },
					{ role: { admin_access: true } },
					{ role: { app_access: true } },
					{ role: {} },
				]);

				expect(getRoleCountsByRoles).toBeCalledWith(db, expect.any(Array<string>));
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 2, app: 3, api: 4 });
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				await service.createMany([{ role: randomUUID() }, { role: randomUUID() }, { role: randomUUID() }]);

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});

		describe('updateOne', () => {
			it('should not checkRemainingAdminExistence', async () => {
				// mock newRole query in updateMany (called by ItemsService updateOne)
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

				await service.updateOne(1, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany (called by ItemsService updateOne)
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: false });

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
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

				await service.updateMany([1], { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: false });

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

			it('should process user limits for new admin role', async () => {
				await service.updateMany([1, 2, 3], { role: { admin_access: true } });
				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 3, app: 0, api: 0 });
			});

			it('should process user limits for existing admin role', async () => {
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

				await service.updateMany([1, 2, 3], { role: randomUUID() });

				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 3, app: 0, api: 0 });
			});

			it('should process user limits for new app role', async () => {
				await service.updateMany([1, 2, 3], { role: { app_access: true } });
				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 3, api: 0 });
			});

			it('should process user limits for existing app role', async () => {
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: false, app_access: true });

				await service.updateMany([1, 2, 3], { role: randomUUID() });

				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 3, api: 0 });
			});

			it('should process user limits for new api role', async () => {
				await service.updateMany([1, 2, 3], { role: {} });
				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 3 });
			});

			it('should process user limits for existing api role', async () => {
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: false, app_access: false });

				await service.updateMany([1, 2, 3], { role: randomUUID() });

				expect(getRoleCountsByUsers).toBeCalledWith(db, [1, 2, 3]);
				expect(checkIncreasedUserLimits).toBeCalledWith(db, { admin: 0, app: 0, api: 3 });
			});

			it('skips user limits check when no limit is set', async () => {
				vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

				await service.updateMany([1, 2, 3], { role: randomUUID() });

				expect(checkIncreasedUserLimits).not.toBeCalled();
			});
		});

		describe('updateByQuery', () => {
			it('should not checkRemainingAdminExistence', async () => {
				// mock newRole query in updateMany (called by ItemsService updateByQuery)
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);

				await service.updateByQuery({}, { role: testRoleId });
				expect(checkRemainingAdminExistenceSpy).not.toBeCalled();
			});

			it('should checkRemainingAdminExistence once', async () => {
				// mock newRole query in updateMany (called by ItemsService updateByQuery)
				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: false });

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
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValueOnce([1]);

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
				// mock newRole query in updateMany
				tracker.on
					.select(/select "id", "admin_access", "app_access" from "directus_roles"/)
					.response({ id: 'invite-role', admin_access: false, app_access: true });

				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				const promise = service.inviteUser('user@example.com', 'invite-role', null);

				await expect(promise).resolves.not.toThrow();

				expect(superCreateOneSpy.mock.lastCall![0]).toEqual(
					expect.objectContaining({
						email: 'user@example.com',
						status: 'invited',
						role: 'invite-role',
					}),
				);

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

				expect(superCreateOneSpy).not.toBeCalled();
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

				expect(superCreateOneSpy).not.toBeCalled();
				expect(mailService.send).not.toBeCalled();
			});

			it('should update role when re-sent invite contains different role than user has', async () => {
				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true },
				});

				tracker.on
					.select(/select "admin_access", "app_access" from "directus_roles"/)
					.response({ admin_access: true, app_access: true });

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
