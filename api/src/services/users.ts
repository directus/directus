import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, RecordNotUniqueError, UnprocessableContentError } from '@directus/errors';
import type { Item, PrimaryKey, RegisterUserInput, User } from '@directus/types';
import { getSimpleHash, toArray, toBoolean, validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { isEmpty, mergeWith } from 'lodash-es';
import { performance } from 'perf_hooks';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger.js';
import { checkIncreasedUserLimits } from '../telemetry/utils/check-increased-user-limits.js';
import { getRoleCountsByRoles } from '../telemetry/utils/get-role-counts-by-roles.js';
import { getRoleCountsByUsers } from '../telemetry/utils/get-role-counts-by-users.js';
import { type AccessTypeCount } from '../telemetry/utils/get-user-count.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { getSecret } from '../utils/get-secret.js';
import isUrlAllowed from '../utils/is-url-allowed.js';
import { verifyJWT } from '../utils/jwt.js';
import { stall } from '../utils/stall.js';
import { Url } from '../utils/url.js';
import { ItemsService } from './items.js';
import { MailService } from './mail/index.js';
import { SettingsService } from './settings.js';

const env = useEnv();
const logger = useLogger();

export class UsersService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_users', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * User email has to be unique case-insensitive. This is an additional check to make sure that
	 * the email is unique regardless of casing
	 */
	private async checkUniqueEmails(emails: string[], excludeKey?: PrimaryKey): Promise<void> {
		emails = emails.map((email) => email.toLowerCase());

		const duplicates = emails.filter((value, index, array) => array.indexOf(value) !== index);

		if (duplicates.length) {
			throw new RecordNotUniqueError({
				collection: 'directus_users',
				field: 'email',
			});
		}

		const query = this.knex
			.select('email')
			.from('directus_users')
			.whereRaw(`LOWER(??) IN (${emails.map(() => '?')})`, ['email', ...emails]);

		if (excludeKey) {
			query.whereNot('id', excludeKey);
		}

		const results = await query;

		if (results.length) {
			throw new RecordNotUniqueError({
				collection: 'directus_users',
				field: 'email',
			});
		}
	}

	/**
	 * Check if the provided password matches the strictness as configured in
	 * directus_settings.auth_password_policy
	 */
	private async checkPasswordPolicy(passwords: string[]): Promise<void> {
		const settingsService = new SettingsService({
			schema: this.schema,
			knex: this.knex,
		});

		const { auth_password_policy: policyRegExString } = await settingsService.readSingleton({
			fields: ['auth_password_policy'],
		});

		if (!policyRegExString) {
			return;
		}

		const wrapped = policyRegExString.startsWith('/') && policyRegExString.endsWith('/');
		const regex = new RegExp(wrapped ? policyRegExString.slice(1, -1) : policyRegExString);

		for (const password of passwords) {
			if (!regex.test(password)) {
				throw new FailedValidationError(
					joiValidationErrorItemToErrorExtensions({
						message: `Provided password doesn't match password policy`,
						path: ['password'],
						type: 'custom.pattern.base',
						context: {
							value: password,
						},
					}),
				);
			}
		}
	}

	private async checkRemainingAdminExistence(excludeKeys: PrimaryKey[]) {
		// Make sure there's at least one admin user left after this deletion is done
		const otherAdminUsers = await this.knex
			.count('*', { as: 'count' })
			.from('directus_users')
			.whereNotIn('directus_users.id', excludeKeys)
			.andWhere({ 'directus_roles.admin_access': true })
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.first();

		const otherAdminUsersCount = +(otherAdminUsers?.count || 0);

		if (otherAdminUsersCount === 0) {
			throw new UnprocessableContentError({ reason: `You can't remove the last admin user from the role` });
		}
	}

	/**
	 * Make sure there's at least one active admin user when updating user status
	 */
	private async checkRemainingActiveAdmin(excludeKeys: PrimaryKey[]): Promise<void> {
		const otherAdminUsers = await this.knex
			.count('*', { as: 'count' })
			.from('directus_users')
			.whereNotIn('directus_users.id', excludeKeys)
			.andWhere({ 'directus_roles.admin_access': true })
			.andWhere({ 'directus_users.status': 'active' })
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.first();

		const otherAdminUsersCount = +(otherAdminUsers?.count || 0);

		if (otherAdminUsersCount === 0) {
			throw new UnprocessableContentError({ reason: `You can't change the active status of the last admin user` });
		}
	}

	/**
	 * Get basic information of user identified by email
	 */
	private async getUserByEmail(
		email: string,
	): Promise<{ id: string; role: string; status: string; password: string; email: string } | undefined> {
		return await this.knex
			.select('id', 'role', 'status', 'password', 'email')
			.from('directus_users')
			.whereRaw(`LOWER(??) = ?`, ['email', email.toLowerCase()])
			.first();
	}

	/**
	 * Create URL for inviting users
	 */
	private inviteUrl(email: string, url: string | null): string {
		const payload = { email, scope: 'invite' };

		const token = jwt.sign(payload, getSecret(), { expiresIn: '7d', issuer: 'directus' });

		return (url ? new Url(url) : new Url(env['PUBLIC_URL'] as string).addPath('admin', 'accept-invite'))
			.setQuery('token', token)
			.toString();
	}

	/**
	 * Validate array of emails. Intended to be used with create/update users
	 */
	private validateEmail(input: string | string[]) {
		const emails = Array.isArray(input) ? input : [input];

		const schema = Joi.string().email().required();

		for (const email of emails) {
			const { error } = schema.validate(email);

			if (error) {
				throw new FailedValidationError({
					field: 'email',
					type: 'email',
				});
			}
		}
	}

	/**
	 * Create a new user
	 */
	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		try {
			if (data['email']) {
				this.validateEmail(data['email']);
				await this.checkUniqueEmails([data['email']]);
			}

			if (data['password']) {
				await this.checkPasswordPolicy([data['password']]);
			}

			if (shouldCheckUserLimits() && data['role']) {
				const increasedCounts: AccessTypeCount = {
					admin: 0,
					app: 0,
					api: 0,
				};

				if (typeof data['role'] === 'object') {
					if ('admin_access' in data['role'] && data['role']['admin_access'] === true) {
						increasedCounts.admin++;
					} else if ('app_access' in data['role'] && data['role']['app_access'] === true) {
						increasedCounts.app++;
					} else {
						increasedCounts.api++;
					}
				} else {
					const existingRoleCounts = await getRoleCountsByRoles(this.knex, [data['role']]);
					mergeWith(increasedCounts, existingRoleCounts, (x, y) => x + y);
				}

				await checkIncreasedUserLimits(this.knex, increasedCounts);
			}
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		return await super.createOne(data, opts);
	}

	/**
	 * Create multiple new users
	 */
	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const emails = data['map']((payload) => payload['email']).filter((email) => email);
		const passwords = data['map']((payload) => payload['password']).filter((password) => password);
		const roles = data['map']((payload) => payload['role']).filter((role) => role);

		try {
			if (emails.length) {
				this.validateEmail(emails);
				await this.checkUniqueEmails(emails);
			}

			if (passwords.length) {
				await this.checkPasswordPolicy(passwords);
			}

			if (shouldCheckUserLimits() && roles.length) {
				const increasedCounts: AccessTypeCount = {
					admin: 0,
					app: 0,
					api: 0,
				};

				const existingRoles = [];

				for (const role of roles) {
					if (typeof role === 'object') {
						if ('admin_access' in role && role['admin_access'] === true) {
							increasedCounts.admin++;
						} else if ('app_access' in role && role['app_access'] === true) {
							increasedCounts.app++;
						} else {
							increasedCounts.api++;
						}
					} else {
						existingRoles.push(role);
					}
				}

				const existingRoleCounts = await getRoleCountsByRoles(this.knex, existingRoles);

				mergeWith(increasedCounts, existingRoleCounts, (x, y) => x + y);

				await checkIncreasedUserLimits(this.knex, increasedCounts);
			}
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		return await super.createMany(data, opts);
	}

	/**
	 * Update many users by primary key
	 */
	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		try {
			const needsUserLimitCheck = shouldCheckUserLimits();

			if (data['role']) {
				/*
				 * data['role'] has the following cases:
				 * - a string with existing role id
				 * - an object with existing role id for GraphQL mutations
				 * - an object with data for new role
				 */
				const role = data['role']?.id ?? data['role'];

				let newRole;

				if (typeof role === 'string') {
					newRole = await this.knex
						.select('admin_access', 'app_access')
						.from('directus_roles')
						.where('id', role)
						.first();
				} else {
					newRole = role;
				}

				if (!newRole?.admin_access) {
					await this.checkRemainingAdminExistence(keys);
				}

				if (needsUserLimitCheck && newRole) {
					const existingCounts = await getRoleCountsByUsers(this.knex, keys);

					const increasedCounts: AccessTypeCount = {
						admin: 0,
						app: 0,
						api: 0,
					};

					if (toBoolean(newRole.admin_access)) {
						increasedCounts.admin = keys.length - existingCounts.admin;
					} else if (toBoolean(newRole.app_access)) {
						increasedCounts.app = keys.length - existingCounts.app;
					} else {
						increasedCounts.api = keys.length - existingCounts.api;
					}

					await checkIncreasedUserLimits(this.knex, increasedCounts);
				}
			}

			if (needsUserLimitCheck && data['role'] === null) {
				await checkIncreasedUserLimits(this.knex, { admin: 0, app: 0, api: 1 });
			}

			if (data['status'] !== undefined && data['status'] !== 'active') {
				await this.checkRemainingActiveAdmin(keys);
			}

			if (needsUserLimitCheck && data['status'] === 'active') {
				const increasedCounts = await getRoleCountsByUsers(this.knex, keys, { inactiveUsers: true });

				await checkIncreasedUserLimits(this.knex, increasedCounts);
			}

			if (data['email']) {
				if (keys.length > 1) {
					throw new RecordNotUniqueError({
						collection: 'directus_users',
						field: 'email',
					});
				}

				this.validateEmail(data['email']);
				await this.checkUniqueEmails([data['email']], keys[0]);
			}

			if (data['password']) {
				await this.checkPasswordPolicy([data['password']]);
			}

			if (data['tfa_secret'] !== undefined) {
				throw new InvalidPayloadError({ reason: `You can't change the "tfa_secret" value manually` });
			}

			if (data['provider'] !== undefined) {
				if (this.accountability && this.accountability.admin !== true) {
					throw new InvalidPayloadError({ reason: `You can't change the "provider" value manually` });
				}

				data['auth_data'] = null;
			}

			if (data['external_identifier'] !== undefined) {
				if (this.accountability && this.accountability.admin !== true) {
					throw new InvalidPayloadError({ reason: `You can't change the "external_identifier" value manually` });
				}

				data['auth_data'] = null;
			}
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		return await super.updateMany(keys, data, opts);
	}

	/**
	 * Delete multiple users by primary key
	 */
	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		try {
			await this.checkRemainingAdminExistence(keys);
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		// Manual constraint, see https://github.com/directus/directus/pull/19912
		await this.knex('directus_notifications').update({ sender: null }).whereIn('sender', keys);
		await this.knex('directus_versions').update({ user_updated: null }).whereIn('user_updated', keys);

		await super.deleteMany(keys, opts);
		return keys;
	}

	async inviteUser(email: string | string[], role: string, url: string | null, subject?: string | null): Promise<void> {
		const opts: MutationOptions = {};

		try {
			if (url && isUrlAllowed(url, env['USER_INVITE_URL_ALLOW_LIST'] as string) === false) {
				throw new InvalidPayloadError({ reason: `URL "${url}" can't be used to invite users` });
			}
		} catch (err: any) {
			opts.preMutationError = err;
		}

		const emails = toArray(email);

		const mailService = new MailService({
			schema: this.schema,
			accountability: this.accountability,
		});

		for (const email of emails) {
			// Check if user is known
			const user = await this.getUserByEmail(email);

			// Create user first to verify uniqueness if unknown
			if (isEmpty(user)) {
				await this.createOne({ email, role, status: 'invited' }, opts);

				// For known users update role if changed
			} else if (user.status === 'invited' && user.role !== role) {
				await this.updateOne(user.id, { role }, opts);
			}

			// Send invite for new and already invited users
			if (isEmpty(user) || user.status === 'invited') {
				const subjectLine = subject ?? "You've been invited";

				mailService
					.send({
						to: user?.email ?? email,
						subject: subjectLine,
						template: {
							name: 'user-invitation',
							data: {
								url: this.inviteUrl(user?.email ?? email, url),
								email: user?.email ?? email,
							},
						},
					})
					.catch((error) => {
						logger.error(error, `Could not send user invitation mail`);
					});
			}
		}
	}

	async acceptInvite(token: string, password: string): Promise<void> {
		const { email, scope } = verifyJWT(token, getSecret()) as {
			email: string;
			scope: string;
		};

		if (scope !== 'invite') throw new ForbiddenError();

		const user = await this.getUserByEmail(email);

		if (user?.status !== 'invited') {
			throw new InvalidPayloadError({ reason: `Email address ${email} hasn't been invited` });
		}

		// Allow unauthenticated update
		const service = new UsersService({
			knex: this.knex,
			schema: this.schema,
		});

		await service.updateOne(user.id, { password, status: 'active' });
	}

	async registerUser(input: RegisterUserInput) {
		if (
			input.verification_url &&
			isUrlAllowed(input.verification_url, env['USER_REGISTER_URL_ALLOW_LIST'] as string) === false
		) {
			throw new InvalidPayloadError({
				reason: `URL "${input.verification_url}" can't be used to verify registered users`,
			});
		}

		const STALL_TIME = env['REGISTER_STALL_TIME'] as number;
		const timeStart = performance.now();
		const serviceOptions: AbstractServiceOptions = { accountability: this.accountability, schema: this.schema };
		const settingsService = new SettingsService(serviceOptions);

		const settings = await settingsService.readSingleton({
			fields: [
				'public_registration',
				'public_registration_verify_email',
				'public_registration_role',
				'public_registration_email_filter',
			],
		});

		if (settings?.['public_registration'] == false) {
			throw new ForbiddenError();
		}

		const publicRegistrationRole = settings?.['public_registration_role'] ?? null;
		const hasEmailVerification = settings?.['public_registration_verify_email'];
		const emailFilter = settings?.['public_registration_email_filter'];
		const first_name = input.first_name ?? null;
		const last_name = input.last_name ?? null;

		const partialUser: Partial<User> = {
			// Required fields
			email: input.email,
			password: input.password,
			role: publicRegistrationRole,
			status: hasEmailVerification ? 'unverified' : 'active',
			// Optional fields
			first_name,
			last_name,
		};

		if (emailFilter && validatePayload(emailFilter, { email: input.email }).length !== 0) {
			await stall(STALL_TIME, timeStart);
			throw new ForbiddenError();
		}

		const user = await this.getUserByEmail(input.email);

		if (isEmpty(user)) {
			await this.createOne(partialUser);
		}
		// We want to be able to re-send the verification email
		else if (user.status !== ('unverified' satisfies User['status'])) {
			// To avoid giving attackers infos about registered emails we dont fail for violated unique constraints
			await stall(STALL_TIME, timeStart);
			return;
		}

		if (hasEmailVerification) {
			const mailService = new MailService(serviceOptions);
			const payload = { email: input.email, scope: 'pending-registration' };

			const token = jwt.sign(payload, env['SECRET'] as string, {
				expiresIn: env['EMAIL_VERIFICATION_TOKEN_TTL'] as string,
				issuer: 'directus',
			});

			const verificationUrl = (
				input.verification_url
					? new Url(input.verification_url)
					: new Url(env['PUBLIC_URL'] as string).addPath('users', 'register', 'verify-email')
			)
				.setQuery('token', token)
				.toString();

			mailService
				.send({
					to: input.email,
					subject: 'Verify your email address', // TODO: translate after theres support for internationalized emails
					template: {
						name: 'user-registration',
						data: {
							url: verificationUrl,
							email: input.email,
							first_name,
							last_name,
						},
					},
				})
				.catch((error) => {
					logger.error(error, 'Could not send email verification mail');
				});
		}

		await stall(STALL_TIME, timeStart);
	}

	async verifyRegistration(token: string): Promise<string> {
		const { email, scope } = verifyJWT(token, env['SECRET'] as string) as {
			email: string;
			scope: string;
		};

		if (scope !== 'pending-registration') throw new ForbiddenError();

		const user = await this.getUserByEmail(email);

		if (user?.status !== ('unverified' satisfies User['status'])) {
			throw new InvalidPayloadError({ reason: 'Invalid verification code' });
		}

		await this.updateOne(user.id, { status: 'active' });

		return user.id;
	}

	async requestPasswordReset(email: string, url: string | null, subject?: string | null): Promise<void> {
		const STALL_TIME = 500;
		const timeStart = performance.now();

		const user = await this.getUserByEmail(email);

		if (user?.status !== 'active') {
			await stall(STALL_TIME, timeStart);
			throw new ForbiddenError();
		}

		if (url && isUrlAllowed(url, env['PASSWORD_RESET_URL_ALLOW_LIST'] as string) === false) {
			throw new InvalidPayloadError({ reason: `URL "${url}" can't be used to reset passwords` });
		}

		const mailService = new MailService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const payload = { email: user.email, scope: 'password-reset', hash: getSimpleHash('' + user.password) };
		const token = jwt.sign(payload, getSecret(), { expiresIn: '1d', issuer: 'directus' });

		const acceptUrl = (url ? new Url(url) : new Url(env['PUBLIC_URL'] as string).addPath('admin', 'reset-password'))
			.setQuery('token', token)
			.toString();

		const subjectLine = subject ? subject : 'Password Reset Request';

		mailService
			.send({
				to: user.email,
				subject: subjectLine,
				template: {
					name: 'password-reset',
					data: {
						url: acceptUrl,
						email: user.email,
					},
				},
			})
			.catch((error) => {
				logger.error(error, `Could not send password reset mail`);
			});

		await stall(STALL_TIME, timeStart);
	}

	async resetPassword(token: string, password: string): Promise<void> {
		const { email, scope, hash } = jwt.verify(token, getSecret(), { issuer: 'directus' }) as {
			email: string;
			scope: string;
			hash: string;
		};

		if (scope !== 'password-reset' || !hash) throw new ForbiddenError();

		const opts: MutationOptions = {};

		try {
			await this.checkPasswordPolicy([password]);
		} catch (err: any) {
			opts.preMutationError = err;
		}

		const user = await this.getUserByEmail(email);

		if (user?.status !== 'active' || hash !== getSimpleHash('' + user.password)) {
			throw new ForbiddenError();
		}

		// Allow unauthenticated update
		const service = new UsersService({
			knex: this.knex,
			schema: this.schema,
			accountability: {
				...(this.accountability ?? { role: null }),
				admin: true, // We need to skip permissions checks for the update call below
			},
		});

		await service.updateOne(user.id, { password, status: 'active' }, opts);
	}
}
