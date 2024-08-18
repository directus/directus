import { InvalidPayloadError, RecordNotUniqueError } from '@directus/errors';
import { randomUUID } from '@directus/random';
import type { Accountability, SchemaOverview } from '@directus/types';
import knex from 'knex';
import { MockClient, createTracker } from 'knex-mock-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateRemainingAdminUsers } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-users.js';
import type { MutationOptions } from '../types/items.js';
import { UserIntegrityCheckFlag } from '../utils/validate-user-count-integrity.js';
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

vi.mock('../permissions/modules/validate-remaining-admin/validate-remaining-admin-users.js');

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
	const db = vi.mocked(knex.default({ client: MockClient }));
	const tracker = createTracker(db);

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Users', () => {
		const service = new UsersService({
			knex: db,
			schema: testSchema,
		});

		const superCreateOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(randomUUID());
		const superUpdateManySpy = vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([randomUUID()]);

		const checkUniqueEmailsSpy = vi
			.spyOn(UsersService.prototype as any, 'checkUniqueEmails')
			.mockImplementation(() => vi.fn());

		const checkPasswordPolicySpy = vi
			.spyOn(UsersService.prototype as any, 'checkPasswordPolicy')
			.mockResolvedValue(() => vi.fn());

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

			it('should request user limits checks', async () => {
				const opts: MutationOptions = {};

				await service.createOne({}, opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.UserLimits);
			});
		});

		describe('createMany', () => {
			vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1]);

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

			it('should request user limits checks', async () => {
				const opts: MutationOptions = {};

				await service.createMany([{}], opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.UserLimits);
			});
		});

		describe('updateMany', () => {
			it('should not request user integrity checks if no relevant fields are changed', async () => {
				const opts: MutationOptions = {};

				await service.updateMany([randomUUID()], {}, opts);

				expect(opts.userIntegrityCheckFlags).toBe(undefined);
			});

			it('should request all user integrity checks if role is changed', async () => {
				const opts: MutationOptions = {};

				await service.updateMany([randomUUID()], { role: testRoleId }, opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.All);
			});

			it('should request all user integrity checks if status is changed to not "active"', async () => {
				const opts: MutationOptions = {};

				await service.updateMany([randomUUID()], { status: 'inactive' }, opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.All);
			});

			it('should request user limit checks if status is changed to "active"', async () => {
				const opts: MutationOptions = {};

				await service.updateMany([randomUUID()], { status: 'active' }, opts);

				expect(opts.userIntegrityCheckFlags).toBe(UserIntegrityCheckFlag.UserLimits);
			});

			it('should clear caches if role is changed', async () => {
				const clearCacheSpy = vi.spyOn(UsersService.prototype as any, 'clearCaches');

				await service.updateMany([randomUUID()], { role: testRoleId });

				expect(clearCacheSpy).toHaveBeenCalled();
			});

			it('should not checkUniqueEmails', async () => {
				await service.updateMany([randomUUID()], {});

				expect(checkUniqueEmailsSpy).not.toBeCalled();
			});

			it('should checkUniqueEmails once', async () => {
				await service.updateMany([randomUUID()], { email: 'test@example.com' });

				expect(checkUniqueEmailsSpy).toBeCalledTimes(1);
			});

			it('should disallow updating multiple items to same email', async () => {
				const opts: MutationOptions = {};

				await service.updateMany([randomUUID(), randomUUID()], { email: 'test@example.com' }, opts);

				expect(opts.preMutationError).toStrictEqual(
					new RecordNotUniqueError({
						collection: 'directus_users',
						field: 'email',
					}),
				);
			});

			it('should not checkPasswordPolicy', async () => {
				await service.updateMany([randomUUID()], {});

				expect(checkPasswordPolicySpy).not.toBeCalled();
			});

			it('should checkPasswordPolicy once', async () => {
				await service.updateMany([randomUUID()], { password: 'testpassword' });

				expect(checkPasswordPolicySpy).toBeCalledTimes(1);
			});

			describe('restricted auth fields', () => {
				describe('should disallow updates for non-admin users', () => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability: { role: 'test', admin: false } as Accountability,
					});

					it.each(['tfa_secret', 'provider', 'external_identifier'])('%s', async (field) => {
						const opts: MutationOptions = {};

						await service.updateMany([1], { [field]: 'test' }, opts);

						expect(superUpdateManySpy).toHaveBeenCalled();

						expect(opts.preMutationError).toStrictEqual(
							new InvalidPayloadError({ reason: `You can't change the "${field}" value manually` }),
						);
					});
				});

				describe.each([
					['admin users', { role: 'admin', admin: true } as Accountability],
					['null accountability', null],
				])('should allow updates for %s', (_, accountability) => {
					const service = new UsersService({
						knex: db,
						schema: testSchema,
						accountability,
					});

					it.each(['provider', 'external_identifier'])('%s', async (field) => {
						const promise = service.updateMany([randomUUID()], { [field]: 'test' });

						await expect(promise).resolves.not.toThrow();

						expect(superUpdateManySpy.mock.lastCall![1]).toEqual(
							expect.objectContaining({ [field]: 'test', auth_data: null }),
						);
					});
				});
			});
		});

		describe('deleteMany', () => {
			vi.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue([randomUUID()]);

			it('should validate remaining admin users', async () => {
				// mock notifications update query in deleteOne/deleteMany/deleteByQuery methods
				tracker.on.update('directus_notifications').response({});
				// mock versions update query in deleteOne/deleteMany/deleteByQuery methods
				tracker.on.update('directus_versions').response({});
				// mock comments update query in deleteOne/deleteMany/deleteByQuery methods
				tracker.on.update('directus_comments').response({});

				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await service.deleteMany([randomUUID()]);

				expect(validateRemainingAdminUsers).toHaveBeenCalled();
			});
		});

		describe('invite', () => {
			const mailService = new MailService({
				schema: testSchema,
			});

			vi.spyOn(UsersService.prototype as any, 'inviteUrl').mockImplementation(() => vi.fn());

			it('should invite new users', async () => {
				vi.spyOn(UsersService.prototype as any, 'getUserByEmail').mockResolvedValueOnce(undefined);

				const service = new UsersService({
					knex: db,
					schema: testSchema,
					accountability: { role: 'test', admin: true } as Accountability,
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
					accountability: { role: 'test', admin: true } as Accountability,
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
					accountability: { role: 'test', admin: true } as Accountability,
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
					accountability: { role: 'test', admin: true } as Accountability,
				});

				const mockUser = {
					id: randomUUID(),
					status: 'invited',
					role: 'existing-role',
				};

				// mock an invited user with different role
				vi.spyOn(UsersService.prototype as any, 'getUserByEmail').mockResolvedValueOnce(mockUser);

				const promise = service.inviteUser('user@example.com', 'invite-role', null);
				await expect(promise).resolves.not.toThrow();

				expect(superUpdateManySpy.mock.lastCall![0]).toEqual([mockUser.id]);
				expect(superUpdateManySpy.mock.lastCall![1]).toEqual({ role: 'invite-role' });
			});
		});
	});
});
