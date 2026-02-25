import { performance } from 'perf_hooks';
import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, RecordNotUniqueError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Item,
	MutationOptions,
	PrimaryKey,
	RegisterUserInput,
	User,
} from '@directus/types';
import { UserIntegrityCheckFlag } from '@directus/types';
import { getSimpleHash, toArray, validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { isEmpty } from 'lodash-es';
import type { StringValue } from 'ms';
import { clearSystemCache } from '../cache.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { validateRemainingAdminUsers } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-users.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
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
				value: '[' + String(duplicates) + ']',
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
				value: '[' + String(emails) + ']',
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

	/**
	 * Clear users' sessions to log them out
	 */
	private async clearUserSessions(userKeys: PrimaryKey[], excludeSession?: string): Promise<void> {
		if (excludeSession) {
			await this.knex
				.from('directus_sessions')
				.whereIn('user', userKeys)
				.andWhereNot('token', '=', excludeSession)
				.delete();
		} else {
			await this.knex.from('directus_sessions').whereIn('user', userKeys).delete();
		}
	}

	/**
	 * Get basic information of user identified by email
	 */
	private async getUserByEmail(
		email: string,
	): Promise<
		{ id: string; role: string; status: string; password: string; email: string; provider: string } | undefined
	> {
		return this.knex
			.select('id', 'role', 'status', 'password', 'email', 'provider')
			.from('directus_users')
			.whereRaw(`LOWER(??) = ?`, ['email', email.toLowerCase()])
			.first();
	}

	/**
	 * Create URL for inviting users
	 */
	private inviteUrl(email: string, url: string | null): string {
		const payload = { email, scope: 'invite' };

		const token = jwt.sign(payload, getSecret(), {
			expiresIn: env['USER_INVITE_TOKEN_TTL'] as StringValue | number,
			issuer: 'directus',
		});

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
					path: [],
				});
			}
		}
	}

	/**
	 * Create a new user
	 */
	override async createOne(data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		try {
			if ('email' in data && data['email'] !== undefined) {
				this.validateEmail(data['email']);
				await this.checkUniqueEmails([data['email']]);
			}

			if ('password' in data) {
				await this.checkPasswordPolicy([data['password']]);
			}
		} catch (err: any) {
			opts.preMutationError = err;
		}

		if (!('status' in data) || data['status'] === 'active') {
			// Creating a user only requires checking user limits if the user is active, no need to care about the role
			opts.userIntegrityCheckFlags =
				(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | UserIntegrityCheckFlag.UserLimits;

			opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);
		}

		return await super.createOne(data, opts);
	}

	/**
	 * Create multiple new users
	 */
	override async createMany(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		const emails = data.map((payload) => payload['email']).filter((email) => email);
		const passwords = data.map((payload) => payload['password']).filter((password) => password);
		const someActive = data.some((payload) => !('status' in payload) || payload['status'] === 'active');

		try {
			if (emails.length) {
				this.validateEmail(emails);
				await this.checkUniqueEmails(emails);
			}

			if (passwords.length) {
				await this.checkPasswordPolicy(passwords);
			}
		} catch (err: any) {
			opts.preMutationError = err;
		}

		if (someActive) {
			// Creating users only requires checking user limits if the users are active, no need to care about the role
			opts.userIntegrityCheckFlags =
				(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | UserIntegrityCheckFlag.UserLimits;

			opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);
		}

		// Use generic ItemsService to avoid calling `UserService.createOne` to avoid additional work of validating emails,
		// as this requires one query per email if done in `createOne`
		const itemsService = new ItemsService(this.collection, {
			schema: this.schema,
			accountability: this.accountability,
			knex: this.knex,
		});

		return await itemsService.createMany(data, opts);
	}

	/**
	 * Update many users by primary key
	 */
	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Item>,
		opts: MutationOptions = {},
	): Promise<PrimaryKey[]> {
		try {
			if (data['email']) {
				if (keys.length > 1) {
					throw new RecordNotUniqueError({
						collection: 'directus_users',
						field: 'email',
						value: data['email'],
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
			opts.preMutationError = err;
		}

		if ('role' in data) {
			opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
		}

		if ('status' in data) {
			if (data['status'] === 'active') {
				// User are being activated, no need to check if there are enough admins
				opts.userIntegrityCheckFlags =
					(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) | UserIntegrityCheckFlag.UserLimits;
			} else {
				opts.userIntegrityCheckFlags = UserIntegrityCheckFlag.All;
			}
		}

		if (opts.userIntegrityCheckFlags) {
			opts.onRequireUserIntegrityCheck?.(opts.userIntegrityCheckFlags);
		}

		const result = await super.updateMany(keys, data, opts);

		if (data['status'] !== undefined && data['status'] !== 'active') {
			await this.clearUserSessions(keys);
		} else if (data['password'] !== undefined || data['email'] !== undefined) {
			await this.clearUserSessions(keys, this.accountability?.session);
		}

		// Only clear the caches if the role has been updated
		if ('role' in data) {
			await this.clearCaches(opts);
		}

		return result;
	}

	/**
	 * Delete multiple users by primary key
	 */
	override async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (opts?.onRequireUserIntegrityCheck) {
			opts.onRequireUserIntegrityCheck(opts?.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None);
		} else {
			try {
				await validateRemainingAdminUsers({ excludeUsers: keys }, { knex: this.knex, schema: this.schema });
			} catch (err: any) {
				opts.preMutationError = err;
			}
		}

		// Manual constraint, see https://github.com/directus/directus/pull/19912
		await this.knex('directus_comments').update({ user_updated: null }).whereIn('user_updated', keys);
		await this.knex('directus_notifications').update({ sender: null }).whereIn('sender', keys);
		await this.knex('directus_versions').update({ user_updated: null }).whereIn('user_updated', keys);

		await super.deleteMany(keys, opts);
		await this.clearUserSessions(keys);

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

		if (isEmpty(user)) {
			throw new InvalidPayloadError({ reason: `Email address ${email} hasn't been invited` });
		}

		if (user.status !== 'invited' && user.status !== 'active') {
			throw new InvalidPayloadError({ reason: `Email address ${email} hasn't been invited` });
		}

		const service = new UsersService({
			knex: this.knex,
			schema: this.schema,
		});

		const payload: { password: string; status?: string } = { password };

		if (user.status === 'invited') {
			payload.status = 'active';
		}

		await service.updateOne(user.id, payload);
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
				expiresIn: env['EMAIL_VERIFICATION_TOKEN_TTL'] as StringValue | number,
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

		if (url && isUrlAllowed(url, env['PASSWORD_RESET_URL_ALLOW_LIST'] as string) === false) {
			throw new InvalidPayloadError({ reason: `URL "${url}" can't be used to reset passwords` });
		}

		const user = await this.getUserByEmail(email);

		if (user?.status !== 'active') {
			await stall(STALL_TIME, timeStart);
			throw new ForbiddenError();
		}

		if (user.provider !== DEFAULT_AUTH_PROVIDER) {
			await stall(STALL_TIME, timeStart);
			throw new ForbiddenError();
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
		const { email, scope, hash } = verifyJWT(token, getSecret()) as {
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
				...(this.accountability ?? createDefaultAccountability()),
				admin: true, // We need to skip permissions checks for the update call below
			},
		});

		await service.updateOne(user.id, { password, status: 'active' }, opts);
	}

	private async clearCaches(opts?: MutationOptions) {
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}
	}
}
